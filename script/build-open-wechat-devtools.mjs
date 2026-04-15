#!/usr/bin/env node

import {
  accessSync,
  constants,
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const {
  cliAppId,
  mode,
  workspace,
  framework,
} = parseArgs(process.argv.slice(2));
const projectDir = workspace;
const projectLabel = framework === 'vue' ? 'Vue' : framework === 'react' ? 'React' : framework;
const projectRoot = path.join(repoRoot, projectDir);
const urlCheckEnabled = resolveUrlCheckSetting();

ensureProjectRoot();

const appId = resolveAppId(cliAppId, mode);
ensureAppId(appId);
const apiOrigin = resolveApiOrigin(mode);

const devtoolsCli = resolveDevtoolsCli();
const openCommandFailurePatterns = [
  /\[error\]/i,
  /invalid appid/i,
  /appid 不合法/i,
  /✖\s+preparing/i,
];

log(`Using mini-program workspace: ${projectRoot}`);
log(`Using WeChat DevTools CLI: ${devtoolsCli}`);
log(`Using mini-program AppID: ${appId}`);
log(`Using build mode: ${mode}`);
log(
  `DevTools legal-domain check: ${urlCheckEnabled ? 'enabled' : 'disabled'} (project.config.setting.urlCheck=${urlCheckEnabled})`,
);
warnIfLocalApiOrigin(apiOrigin);
log(`Building ${projectLabel} mini-program bundle...`);
runCommand('pnpm', buildWeappArgs(mode), {
  TARO_APP_ID: appId,
}, {
  cwd: projectRoot,
});

const projectPath = resolveBuiltProjectPath();
const projectConfigPath = path.join(projectPath, 'project.config.json');
const projectPrivateConfigPath = path.join(projectPath, 'project.private.config.json');

patchProjectConfig(projectConfigPath, appId, urlCheckEnabled);
patchProjectPrivateConfig(projectPrivateConfigPath, urlCheckEnabled);
syncDevtoolsLocalProjectSetting(projectPath, urlCheckEnabled, 'before-open');

openProjectInDevtools(devtoolsCli, projectPath, openCommandFailurePatterns);

const syncAfterOpen = syncDevtoolsLocalProjectSetting(projectPath, urlCheckEnabled, 'after-open');
if (syncAfterOpen.updated > 0) {
  log(
    `Detected ${syncAfterOpen.updated} local project setting file(s) rewritten by DevTools on launch. Reopening project to apply urlCheck=${urlCheckEnabled} immediately.`,
  );
  runCommand(devtoolsCli, ['close', '--project', projectPath], {}, {
    cwd: repoRoot,
  });
  openProjectInDevtools(devtoolsCli, projectPath, openCommandFailurePatterns);

  const syncAfterReopen = syncDevtoolsLocalProjectSetting(projectPath, urlCheckEnabled, 'after-reopen');
  if (syncAfterReopen.updated > 0) {
    fail(
      `DevTools keeps rewriting local project setting "urlCheck". Expected ${urlCheckEnabled} but still had to patch ${syncAfterReopen.updated} file(s) after reopen.`,
    );
  }
}

function parseArgs(args) {
  let resolvedAppId = process.env.TARO_APP_ID ?? '';
  let resolvedMode = 'production';
  let resolvedWorkspace = 'infoq-scaffold-frontend-weapp-react';
  let resolvedFramework = 'react';

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

    if (current === '--workspace') {
      resolvedWorkspace = args[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (current.startsWith('--workspace=')) {
      resolvedWorkspace = current.slice('--workspace='.length);
      continue;
    }

    if (current === '--framework') {
      resolvedFramework = args[index + 1] ?? '';
      index += 1;
      continue;
    }

    if (current.startsWith('--framework=')) {
      resolvedFramework = current.slice('--framework='.length);
      continue;
    }

    fail('Unsupported argument "'
      + `${current}`
      + '". Supported options: --appid <wx...> --mode <production|development> --workspace <workspace-dir> --framework <react|vue>');
  }

  const workspace = normalizeWorkspace(resolvedWorkspace);
  const framework = normalizeFramework(resolvedFramework);

  return {
    cliAppId: resolvedAppId.trim(),
    mode: normalizeMode(resolvedMode),
    workspace,
    framework,
  };
}

function normalizeWorkspace(candidate) {
  const value = String(candidate || '').trim();
  if (!value) {
    fail('Workspace argument is required and cannot be empty.');
  }
  if (path.isAbsolute(value) || value.includes('..')) {
    fail(`Unsupported workspace "${candidate}". Use a repository-relative directory name.`);
  }
  return value;
}

function normalizeFramework(candidate) {
  const value = String(candidate || '').trim().toLowerCase() || 'react';
  if (value !== 'react' && value !== 'vue') {
    fail(`Unsupported framework "${candidate}". Supported values: "react" or "vue".`);
  }
  return value;
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

function resolveBuiltProjectPath() {
  const candidatePaths = [
    path.join(projectRoot, 'dist'),
    path.join(projectRoot, 'dist', 'build', 'mp-weixin'),
    path.join(projectRoot, 'dist', 'dev', 'mp-weixin'),
    path.join(projectRoot, 'unpackage', 'dist', 'build', 'mp-weixin'),
    path.join(projectRoot, 'unpackage', 'dist', 'dev', 'mp-weixin'),
  ];

  const matched = candidatePaths.find((candidate) => existsSync(path.join(candidate, 'project.config.json')));
  if (matched) {
    log(`Detected mini-program output: ${matched}`);
    return matched;
  }

  fail(
    'Expected build output with project.config.json in one of: '
      + `${candidatePaths.join(', ')}`,
  );
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

function resolveUrlCheckSetting() {
  const rawValue = process.env.WECHAT_DEVTOOLS_URL_CHECK;
  if (rawValue === undefined) {
    return false;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  fail(
    `Unsupported WECHAT_DEVTOOLS_URL_CHECK value "${rawValue}". Use one of: true/false/1/0/yes/no/on/off.`,
  );
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

function patchProjectConfig(projectConfigPath, appId, urlCheckEnabled) {
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
  if (parsedConfig.setting !== undefined && (Array.isArray(parsedConfig.setting) || typeof parsedConfig.setting !== 'object')) {
    fail(`Expected "setting" in "${projectConfigPath}" to be an object.`);
  }
  parsedConfig.setting = parsedConfig.setting || {};
  parsedConfig.setting.urlCheck = urlCheckEnabled;
  writeFileSync(projectConfigPath, `${JSON.stringify(parsedConfig, null, 2)}\n`, 'utf8');
  log(`Patched "${projectConfigPath}" with appid and setting.urlCheck=${urlCheckEnabled}.`);
}

function patchProjectPrivateConfig(projectPrivateConfigPath, urlCheckEnabled) {
  let parsedConfig = {};
  if (existsSync(projectPrivateConfigPath)) {
    try {
      parsedConfig = JSON.parse(readFileSync(projectPrivateConfigPath, 'utf8'));
    } catch (error) {
      fail(`Failed to parse "${projectPrivateConfigPath}": ${error.message}`);
    }
  }

  if (Array.isArray(parsedConfig) || typeof parsedConfig !== 'object' || parsedConfig === null) {
    fail(`Expected "${projectPrivateConfigPath}" to contain a JSON object.`);
  }

  if (parsedConfig.setting !== undefined && (Array.isArray(parsedConfig.setting) || typeof parsedConfig.setting !== 'object')) {
    fail(`Expected "setting" in "${projectPrivateConfigPath}" to be an object.`);
  }

  parsedConfig.setting = parsedConfig.setting || {};
  parsedConfig.setting.urlCheck = urlCheckEnabled;
  writeFileSync(projectPrivateConfigPath, `${JSON.stringify(parsedConfig, null, 2)}\n`, 'utf8');
  log(`Patched "${projectPrivateConfigPath}" with setting.urlCheck=${urlCheckEnabled}.`);
}

function syncDevtoolsLocalProjectSetting(projectPath, urlCheckEnabled, stage) {
  const homeDir = process.env.HOME;
  if (!homeDir) {
    log(`Skipping local DevTools setting sync (${stage}): HOME is not set.`);
    return { matched: 0, updated: 0 };
  }

  const devtoolsDataRoot = path.join(homeDir, 'Library', 'Application Support', '微信开发者工具');
  if (!existsSync(devtoolsDataRoot)) {
    log(`Skipping local DevTools setting sync (${stage}): "${devtoolsDataRoot}" does not exist.`);
    return { matched: 0, updated: 0 };
  }

  const pathVariants = resolveProjectPathVariants(projectPath);
  const localStorageTargets = new Set();
  const profileDirs = readdirSync(devtoolsDataRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(devtoolsDataRoot, entry.name));

  for (const profileDir of profileDirs) {
    const localDataDir = path.join(profileDir, 'WeappLocalData');
    const hashMapPath = path.join(localDataDir, 'hash_key_map_2.json');
    if (!existsSync(hashMapPath)) {
      continue;
    }

    let hashKeyMap = {};
    try {
      hashKeyMap = JSON.parse(readFileSync(hashMapPath, 'utf8'));
    } catch (error) {
      log(`Skipping corrupted hash key map "${hashMapPath}": ${error.message}`);
      continue;
    }

    if (Array.isArray(hashKeyMap) || typeof hashKeyMap !== 'object' || hashKeyMap === null) {
      log(`Skipping invalid hash key map "${hashMapPath}": expected a JSON object.`);
      continue;
    }

    const mapEntries = Object.entries(hashKeyMap);
    for (const variantPath of pathVariants) {
      const candidateNames = [
        `project2_${variantPath}`,
        `project_${variantPath}`,
      ];
      for (const [hashKey, mappedName] of mapEntries) {
        if (!candidateNames.includes(mappedName)) {
          continue;
        }
        const localStoragePath = path.join(localDataDir, `localstorage_${hashKey}.json`);
        if (existsSync(localStoragePath)) {
          localStorageTargets.add(localStoragePath);
        }
      }
    }
  }

  if (localStorageTargets.size === 0) {
    log(`No local DevTools project settings found for "${projectPath}" (${stage}).`);
    return { matched: 0, updated: 0 };
  }

  let updated = 0;
  for (const localStoragePath of localStorageTargets) {
    const changed = patchLocalProjectSetting(localStoragePath, urlCheckEnabled);
    if (changed) {
      updated += 1;
    }
  }

  log(
    `Synced local DevTools project settings (${stage}): matched=${localStorageTargets.size}, updated=${updated}, target.urlCheck=${urlCheckEnabled}.`,
  );
  return {
    matched: localStorageTargets.size,
    updated,
  };
}

function patchLocalProjectSetting(localStoragePath, urlCheckEnabled) {
  let parsedConfig;
  try {
    parsedConfig = JSON.parse(readFileSync(localStoragePath, 'utf8'));
  } catch (error) {
    fail(`Failed to parse local DevTools setting "${localStoragePath}": ${error.message}`);
  }

  if (Array.isArray(parsedConfig) || typeof parsedConfig !== 'object' || parsedConfig === null) {
    fail(`Expected local DevTools setting "${localStoragePath}" to be a JSON object.`);
  }

  if (parsedConfig.setting !== undefined && (Array.isArray(parsedConfig.setting) || typeof parsedConfig.setting !== 'object')) {
    fail(`Expected "setting" in local DevTools setting "${localStoragePath}" to be an object.`);
  }

  parsedConfig.setting = parsedConfig.setting || {};
  const previousValue = parsedConfig.setting.urlCheck;
  if (previousValue === urlCheckEnabled) {
    return false;
  }

  parsedConfig.setting.urlCheck = urlCheckEnabled;
  writeFileSync(localStoragePath, `${JSON.stringify(parsedConfig)}\n`, 'utf8');
  return true;
}

function resolveProjectPathVariants(projectPath) {
  const variants = new Set([path.resolve(projectPath)]);
  try {
    variants.add(realpathSync(projectPath));
  } catch {
    // projectPath is expected to exist; when it does not, using path.resolve is still sufficient for lookup attempts.
  }
  return Array.from(variants);
}

function openProjectInDevtools(devtoolsCli, projectPath, failurePatterns) {
  log(`Opening ${projectLabel} mini-program project in WeChat DevTools...`);
  runCommand(devtoolsCli, ['open', '--project', projectPath], {}, {
    cwd: repoRoot,
    failurePatterns,
  });
  log(`WeChat DevTools launch request completed for ${projectLabel}.`);
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
