#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import process from 'node:process';
import {
  ROUTES,
  SUITE_PIPELINES,
  loadRuntimeConfig,
  parseRunnerArgs
} from './config.mjs';
import {
  closeMiniProgram,
  ensureProjectReady,
  launchMiniProgram,
  resolveWeChatDevtoolsCli,
  synchronizeUrlCheckSetting
} from './bootstrap.mjs';
import { autoLoginWithBackend } from './auto-login.mjs';
import { createE2EContext } from './context.mjs';
import { summarizeResults, writeRunReport } from './report.mjs';

const suiteModuleLoaders = {
  'smoke.routes': () => import('./suites/smoke.routes.mjs'),
  'full.routes': () => import('./suites/full.routes.mjs'),
  'api.contract': () => import('./suites/api.contract.mjs'),
  'auth.flow': () => import('./suites/auth.flow.mjs'),
  'profile.flow': () => import('./suites/profile.flow.mjs'),
  'notice.flow': () => import('./suites/notice.flow.mjs'),
  'permission.flow': () => import('./suites/permission.flow.mjs')
};

export async function runRunner({ suite = 'smoke', report = false } = {}) {
  const runtime = loadRuntimeConfig({ suite, report });
  const keepExistingSession = Boolean(runtime.keepExistingSession && !runtime.token);
  const autoLoginEnabled = Boolean(runtime.autoLogin && !runtime.token && !keepExistingSession);
  let effectiveToken = runtime.token || (keepExistingSession ? '__existing-session__' : '');
  let autoLoginResult = null;
  const startedAt = Date.now();
  const results = [];
  const consoleLogs = [];
  const exceptionLogs = [];

  log(`Suite mode: ${runtime.suite}`);
  log(`Dist project: ${runtime.distDir}`);

  ensureProjectReady(runtime);
  synchronizeUrlCheckSetting({
    distDir: runtime.distDir,
    projectConfigPath: runtime.projectConfigPath,
    projectPrivateConfigPath: runtime.projectPrivateConfigPath,
    urlCheckEnabled: runtime.devtoolsUrlCheckEnabled,
    logger: log
  });

  const cliPath = resolveWeChatDevtoolsCli(runtime.cliOverridePath);
  log(`WeChat DevTools CLI: ${cliPath}`);

  const miniProgram = await launchMiniProgram({
    cliPath,
    distDir: runtime.distDir,
    launchTimeoutMs: runtime.launchTimeoutMs
  });

  log('MiniProgram automator launch success.');
  miniProgram.on('console', (entry) => {
    const normalized = normalizeConsoleLog(entry);
    consoleLogs.push(normalized);
    if (normalized.type === 'error') {
      log(`[CONSOLE_ERROR] ${normalized.message}`);
    }
  });
  miniProgram.on('exception', (entry) => {
    const normalized = normalizeExceptionLog(entry);
    exceptionLogs.push(normalized);
    log(`[APP_EXCEPTION] ${normalized.message}`);
  });

  let reactMounted = false;
  try {
    reactMounted = await miniProgram.evaluate(() => Boolean(typeof getApp === 'function' && getApp()));
  } catch (error) {
    const detail = formatError(error);
    exceptionLogs.push({
      message: 'uni-app runtime probe failed.',
      stack: detail,
      timestamp: new Date().toISOString()
    });
    log(`[APP_EXCEPTION] uni-app runtime probe failed: ${detail}`);
  }
  if (!reactMounted) {
    log('uni-app runtime probe is not mounted in current automator session; route assertions continue with selector checks best-effort.');
  }

  if (autoLoginEnabled) {
    autoLoginResult = await autoLoginWithBackend(runtime, log);
    effectiveToken = autoLoginResult.token;
    log(
      `Auto login succeeded: user=${autoLoginResult.username}, mode=${autoLoginResult.mode}, backend=${autoLoginResult.baseUrl}.`
    );
  }

  const ctx = createE2EContext({
    miniProgram,
    waitMs: runtime.waitMs,
    token: effectiveToken,
    extraRoutes: runtime.extraRoutes,
    strictSelector: runtime.strictSelector,
    reactMounted,
    keepExistingSession
  });

  try {
    if (runtime.token) {
      await ctx.setToken(runtime.token);
      log('Injected Admin-Token from WEAPP_E2E_TOKEN.');
    } else if (keepExistingSession) {
      await ctx.reLaunchRoute(ROUTES.home, runtime.waitMs + 600);
      log('Using existing mini-program session token (WEAPP_E2E_KEEP_EXISTING_SESSION enabled).');
    } else if (autoLoginResult) {
      await ctx.setToken(autoLoginResult.token);
      await ctx.reLaunchRoute(ROUTES.home, runtime.waitMs + 600);
      log('Injected Admin-Token from WEAPP_E2E_AUTO_LOGIN.');
    } else {
      await ctx.clearToken();
      await ctx.reLaunchRoute(ROUTES.home, runtime.waitMs + 600);
      log('No WEAPP_E2E_TOKEN provided; authenticated-route cases will assert unauthenticated fallback behavior.');
    }

    const suiteIds = SUITE_PIPELINES[runtime.suite] || [];

    for (const suiteId of suiteIds) {
      const moduleLoader = suiteModuleLoaders[suiteId];
      if (!moduleLoader) {
        throw new Error(`No suite loader found for "${suiteId}".`);
      }

      const suiteModule = await moduleLoader();
      const suiteCases = suiteModule.createCases(ctx);
      log(`Running suite ${suiteId}${suiteModule.suiteDescription ? ` - ${suiteModule.suiteDescription}` : ''}`);

      for (const testCase of suiteCases) {
        const caseResult = await executeCase({
          suiteId,
          caseName: testCase.caseName,
          skipReason: testCase.skipReason,
          run: testCase.run
        });
        results.push(caseResult);
      }
    }
  } finally {
    await closeMiniProgram(miniProgram);
    log('MiniProgram instance closed.');
  }

  const endedAt = Date.now();
  const consoleGuard = buildConsoleGuardResult({
    consoleLogs,
    exceptionLogs,
    failOnConsoleError: runtime.failOnConsoleError
  });
  results.push(consoleGuard);

  const summary = summarizeResults(results);

  log(`Summary: total=${summary.total}, passed=${summary.passed}, failed=${summary.failed}, skipped=${summary.skipped}`);

  const hasFullSkipViolation = runtime.suite === 'full' && summary.skipped > 0;
  if (hasFullSkipViolation) {
    log(`[FAILED] full suite produced skipped cases (${summary.skipped}).`);
  }

  if (runtime.report) {
    const reportResult = writeRunReport({
      suite: runtime.suite,
      reportDir: runtime.reportDir,
      startedAt,
      endedAt,
      results,
      consoleLogs,
      exceptionLogs
    });

    log(`Report JSON: ${reportResult.jsonPath}`);
    log(`Report Markdown: ${reportResult.markdownPath}`);
  }

  return summary.failed > 0 || hasFullSkipViolation ? 1 : 0;
}

export async function runFromCli(argv = process.argv.slice(2)) {
  const parsed = parseRunnerArgs(argv);
  return runRunner(parsed);
}

async function executeCase({ suiteId, caseName, skipReason, run }) {
  const startedAt = Date.now();

  if (skipReason) {
    log(`[SKIPPED] ${suiteId} :: ${caseName} - ${skipReason}`);
    return {
      suiteId,
      caseName,
      status: 'skipped',
      durationMs: Date.now() - startedAt,
      detail: skipReason
    };
  }

  try {
    await run();
    const durationMs = Date.now() - startedAt;
    log(`[PASSED] ${suiteId} :: ${caseName} (${durationMs}ms)`);
    return {
      suiteId,
      caseName,
      status: 'passed',
      durationMs,
      detail: ''
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const detail = formatError(error);
    log(`[FAILED] ${suiteId} :: ${caseName} (${durationMs}ms)`);
    log(detail);
    return {
      suiteId,
      caseName,
      status: 'failed',
      durationMs,
      detail
    };
  }
}

function formatError(error) {
  if (error instanceof Error) {
    return `${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }

  return String(error);
}

function log(message) {
  console.log(`[weapp-e2e] ${message}`);
}

function normalizeConsoleLog(entry) {
  const type = String(entry?.type || 'log');
  const args = Array.isArray(entry?.args) ? entry.args : [];
  const message = args.length > 0
    ? args.map(formatValue).join(' ')
    : formatValue(entry);

  return {
    type,
    args,
    message,
    timestamp: new Date().toISOString()
  };
}

function normalizeExceptionLog(entry) {
  const message = String(entry?.message || formatValue(entry));
  const stack = String(entry?.stack || '');
  return {
    message,
    stack,
    timestamp: new Date().toISOString()
  };
}

function formatValue(value) {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildConsoleGuardResult({ consoleLogs, exceptionLogs, failOnConsoleError }) {
  const issues = [
    ...consoleLogs
      .filter((item) => item.type === 'error')
      .map((item) => `[console.error] ${item.message}`),
    ...exceptionLogs.map((item) => `[exception] ${item.message}`)
  ];

  if (issues.length === 0) {
    return {
      suiteId: 'console.guard',
      caseName: 'no-runtime-console-errors',
      status: 'passed',
      durationMs: 0,
      detail: ''
    };
  }

  const previewLimit = 20;
  const preview = issues.slice(0, previewLimit).join('\n');
  const rest = issues.length > previewLimit ? `\n... ${issues.length - previewLimit} more issue(s)` : '';
  const detail = `Captured ${issues.length} runtime console issue(s):\n${preview}${rest}`;

  if (failOnConsoleError) {
    log(`[FAILED] console.guard :: no-runtime-console-errors (captured ${issues.length} issue(s))`);
    return {
      suiteId: 'console.guard',
      caseName: 'no-runtime-console-errors',
      status: 'failed',
      durationMs: 0,
      detail
    };
  }

  log(`[SKIPPED] console.guard :: no-runtime-console-errors - ${issues.length} issue(s) captured while fail gate is disabled`);
  return {
    suiteId: 'console.guard',
    caseName: 'no-runtime-console-errors',
    status: 'skipped',
    durationMs: 0,
    detail
  };
}

const isExecutedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isExecutedDirectly) {
  const exitCode = await runFromCli();
  process.exit(exitCode);
}
