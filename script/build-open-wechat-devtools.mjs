#!/usr/bin/env node

import { accessSync, constants, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const projectDir = 'infoq-scaffold-frontend-weapp-react';
const projectLabel = 'React';
const projectRoot = path.join(repoRoot, projectDir);
const { cliAppId, mode } = parseArgs(process.argv.slice(2));

ensureProjectRoot();

const appId = resolveAppId(cliAppId, mode);
ensureAppId(appId);
const apiOrigin = resolveApiOrigin(mode);

const devtoolsCli = resolveDevtoolsCli();
const projectPath = path.join(projectRoot, 'dist');
const projectConfigPath = path.join(projectPath, 'project.config.json');

log(`Using mini-program workspace: ${projectRoot}`);
log(`Using WeChat DevTools CLI: ${devtoolsCli}`);
log(`Using mini-program AppID: ${appId}`);
log(`Using build mode: ${mode}`);
warnIfLocalApiOrigin(apiOrigin);
log(`Building ${projectLabel} mini-program bundle...`);
runCommand('pnpm', buildWeappArgs(mode), {
  TARO_APP_ID: appId,
}, {
  cwd: projectRoot,
});

if (!existsSync(projectPath)) {
  fail(`Expected build output at "${projectPath}", but it was not created.`);
}

patchProjectConfig(projectConfigPath, appId);

log(`Opening ${projectLabel} mini-program project in WeChat DevTools...`);
runCommand(devtoolsCli, ['open', '--project', projectPath], {}, {
  cwd: repoRoot,
  failurePatterns: [
    /\[error\]/i,
    /invalid appid/i,
    /appid 不合法/i,
    /✖\s+preparing/i,
  ],
});
log(`WeChat DevTools launch request completed for ${projectLabel}.`);

function parseArgs(args) {
  let resolvedAppId = process.env.TARO_APP_ID ?? '';
  let resolvedMode = 'production';

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (current === '--') {
      continue;
    }

    if (current === '--appid') {
      resolvedAppId = args[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (current.startsWith('--appid=')) {
      resolvedAppId = current.slice('--appid='.length);
      continue;
    }

    if (current === '--mode') {
      resolvedMode = args[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (current.startsWith('--mode=')) {
      resolvedMode = current.slice('--mode='.length);
      continue;
    }

    fail(`Unsupported argument "${current}". Supported options: --appid <wx...> --mode <production|development>`);
  }

  return {
    cliAppId: resolvedAppId.trim(),
    mode: normalizeMode(resolvedMode),
  };
}

function normalizeMode(candidate) {
  const value = (candidate || 'production').trim();
  if (!value) {
    return 'production';
  }

  if (value !== 'production' && value !== 'development') {
    fail(`Unsupported mode "${candidate}". Supported values: "production" or "development".`);
  }

  return value;
}

function ensureProjectRoot() {
  if (!existsSync(projectRoot)) {
    fail(`Expected mini-program workspace at "${projectRoot}", but it does not exist.`);
  }
}

function resolveAppId(cliAppId, mode) {
  if (cliAppId) {
    return cliAppId;
  }

  if (process.env.TARO_APP_ID?.trim()) {
    return process.env.TARO_APP_ID.trim();
  }

  const envFileAppId = readEnvValue(
    resolveEnvFilePath(mode),
    'TARO_APP_ID',
  );

  return envFileAppId.trim();
}

function ensureAppId(candidate) {
  if (!candidate || candidate === 'touristappid') {
    fail(
      'A real WeChat mini-program AppID is required. Pass --appid <wx...>, set TARO_APP_ID in the shell, or configure TARO_APP_ID in the mini-program workspace .env.production file before running this script.',
    );
  }
}

function resolveApiOrigin(mode) {
  if (process.env.TARO_APP_API_ORIGIN?.trim()) {
    return process.env.TARO_APP_API_ORIGIN.trim();
  }

  const envFileApiOrigin = readEnvValue(
    resolveEnvFilePath(mode),
    'TARO_APP_API_ORIGIN',
  );

  return envFileApiOrigin.trim();
}

function resolveEnvFilePath(mode) {
  return path.join(projectRoot, `.env.${mode}`);
}

function buildWeappArgs(mode) {
  if (mode === 'production') {
    return ['run', 'build:weapp'];
  }

  return ['run', 'build:weapp:dev'];
}

function warnIfLocalApiOrigin(apiOrigin) {
  if (!apiOrigin) {
    log(
      `No TARO_APP_API_ORIGIN is configured for ${projectLabel}. Mini-program pages that call the backend will fail until you set a reachable origin.`,
    );
    return;
  }

  let hostname = '';
  try {
    hostname = new URL(apiOrigin).hostname;
  } catch {
    log(`TARO_APP_API_ORIGIN is not a valid absolute URL: ${apiOrigin}`);
    return;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    log(
      `${projectLabel} is using a local API origin (${apiOrigin}). In WeChat DevTools simulator you must disable legal-domain verification, and for real-device debugging or delivery you must replace it with a reachable HTTPS domain added to the mini-program request domain list.`,
    );
  }
}

function resolveDevtoolsCli() {
  const overridePath = process.env.WECHAT_DEVTOOLS_CLI;
  if (overridePath) {
    ensureExecutable(overridePath, 'WECHAT_DEVTOOLS_CLI');
    return overridePath;
  }

  const candidates = [
    '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    '/Applications/微信开发者工具.app/Contents/MacOS/cli',
    path.join(process.env.HOME ?? '', 'Applications/wechatwebdevtools.app/Contents/MacOS/cli'),
    path.join(process.env.HOME ?? '', 'Applications/微信开发者工具.app/Contents/MacOS/cli'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  const spotlightResult = spawnSync(
    'mdfind',
    ["kMDItemCFBundleIdentifier == 'com.tencent.webplusdevtools'"],
    { encoding: 'utf8' },
  );

  if (spotlightResult.status === 0) {
    const appPath = spotlightResult.stdout
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.endsWith('.app'));

    if (appPath) {
      const cliPath = path.join(appPath, 'Contents', 'MacOS', 'cli');
      if (isExecutable(cliPath)) {
        return cliPath;
      }
    }
  }

  fail(
    'WeChat DevTools CLI was not found. Install WeChat DevTools locally, or set WECHAT_DEVTOOLS_CLI to the full CLI path.',
  );
}

function patchProjectConfig(projectConfigPath, appId) {
  if (!existsSync(projectConfigPath)) {
    fail(`Expected project config at "${projectConfigPath}", but it was not created.`);
  }

  let parsedConfig;
  try {
    parsedConfig = JSON.parse(readFileSync(projectConfigPath, 'utf8'));
  } catch (error) {
    fail(`Failed to parse "${projectConfigPath}": ${error.message}`);
  }

  parsedConfig.appid = appId;
  writeFileSync(projectConfigPath, `${JSON.stringify(parsedConfig, null, 2)}\n`, 'utf8');
}

function readEnvValue(filePath, key) {
  if (!existsSync(filePath)) {
    return '';
  }

  const fileContent = readFileSync(filePath, 'utf8');
  const line = fileContent
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry && !entry.startsWith('#') && entry.startsWith(`${key}`));

  if (!line) {
    return '';
  }

  const separatorIndex = line.indexOf('=');
  if (separatorIndex === -1) {
    return '';
  }

  return line
    .slice(separatorIndex + 1)
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function runCommand(command, args, extraEnv = {}, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    fail(`Failed to start "${command}": ${result.error.message}`);
  }

  const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (options.failurePatterns?.some((pattern) => pattern.test(combinedOutput))) {
    fail(`Command "${command} ${args.join(' ')}" reported an application-level failure.`);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function isExecutable(targetPath) {
  try {
    accessSync(targetPath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureExecutable(targetPath, source) {
  if (!isExecutable(targetPath)) {
    fail(`${source} points to a non-executable path: ${targetPath}`);
  }
}

function log(message) {
  console.log(`[weapp-devtools] ${message}`);
}

function fail(message) {
  console.error(`[weapp-devtools] ${message}`);
  process.exit(1);
}
