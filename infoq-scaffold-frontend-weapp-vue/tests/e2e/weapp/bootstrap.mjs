import { spawnSync } from 'node:child_process';
import {
  accessSync,
  constants,
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync
} from 'node:fs';
import path from 'node:path';
import automator from 'miniprogram-automator';

export function ensureProjectReady({ distDir, projectConfigPath }) {
  if (!existsSync(distDir)) {
    throw new Error(`Dist directory not found at "${distDir}". Run "pnpm run build:weapp:dev" first.`);
  }

  if (!existsSync(projectConfigPath)) {
    throw new Error(`Missing "${projectConfigPath}". Ensure the mini-program build output is complete.`);
  }
}

export function synchronizeUrlCheckSetting({
  distDir,
  projectConfigPath,
  projectPrivateConfigPath,
  urlCheckEnabled,
  logger = () => {}
}) {
  const normalizedUrlCheck = Boolean(urlCheckEnabled);
  const configResult = patchProjectSettingFile({
    filePath: projectConfigPath,
    urlCheckEnabled: normalizedUrlCheck,
    createIfMissing: false
  });

  const privateConfigResult = patchProjectSettingFile({
    filePath: projectPrivateConfigPath,
    urlCheckEnabled: normalizedUrlCheck,
    createIfMissing: true
  });

  const syncResult = syncDevtoolsLocalProjectSetting({
    projectPath: distDir,
    urlCheckEnabled: normalizedUrlCheck,
    logger
  });

  logger(
    `Legal-domain check target urlCheck=${normalizedUrlCheck}; `
    + `project.config updated=${configResult.updated}; `
    + `project.private updated=${privateConfigResult.updated}; `
    + `local-settings matched=${syncResult.matched}, updated=${syncResult.updated}.`
  );
}

export function resolveWeChatDevtoolsCli(overridePath) {
  if (overridePath) {
    ensureExecutable(overridePath, 'WECHAT_DEVTOOLS_CLI');
    return overridePath;
  }

  const candidates = [
    '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    '/Applications/微信开发者工具.app/Contents/MacOS/cli',
    path.join(process.env.HOME || '', 'Applications/wechatwebdevtools.app/Contents/MacOS/cli'),
    path.join(process.env.HOME || '', 'Applications/微信开发者工具.app/Contents/MacOS/cli')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  const spotlightResult = spawnSync('mdfind', ["kMDItemCFBundleIdentifier == 'com.tencent.webplusdevtools'"], {
    encoding: 'utf8'
  });

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

  throw new Error(
    'WeChat DevTools CLI not found. Set WECHAT_DEVTOOLS_CLI to your cli path, for example: '
    + '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
  );
}

export async function launchMiniProgram({ cliPath, distDir, launchTimeoutMs }) {
  return automator.launch({
    cliPath,
    projectPath: distDir,
    timeout: launchTimeoutMs
  });
}

export async function closeMiniProgram(miniProgram) {
  if (!miniProgram) {
    return;
  }

  await miniProgram.close();
}

function patchProjectSettingFile({ filePath, urlCheckEnabled, createIfMissing }) {
  if (!existsSync(filePath)) {
    if (!createIfMissing) {
      throw new Error(`Missing "${filePath}".`);
    }
  }

  const parsed = existsSync(filePath)
    ? readJsonObject(filePath, `project config "${filePath}"`)
    : {};

  if (parsed.setting !== undefined && (Array.isArray(parsed.setting) || typeof parsed.setting !== 'object')) {
    throw new Error(`Expected "setting" in "${filePath}" to be a JSON object.`);
  }

  parsed.setting = parsed.setting || {};
  const updated = parsed.setting.urlCheck !== urlCheckEnabled;
  parsed.setting.urlCheck = urlCheckEnabled;
  writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');

  return { updated };
}

function syncDevtoolsLocalProjectSetting({ projectPath, urlCheckEnabled, logger }) {
  const homeDir = process.env.HOME;
  if (!homeDir) {
    logger('Skipping local DevTools setting sync: HOME is not set.');
    return { matched: 0, updated: 0 };
  }

  const devtoolsDataRoot = path.join(homeDir, 'Library', 'Application Support', '微信开发者工具');
  if (!existsSync(devtoolsDataRoot)) {
    logger(`Skipping local DevTools setting sync: "${devtoolsDataRoot}" does not exist.`);
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
      hashKeyMap = readJsonObject(hashMapPath, `hash map "${hashMapPath}"`);
    } catch (error) {
      logger(`Skipping unreadable hash map "${hashMapPath}": ${error.message}`);
      continue;
    }

    if (Array.isArray(hashKeyMap) || typeof hashKeyMap !== 'object' || hashKeyMap === null) {
      logger(`Skipping invalid hash map "${hashMapPath}": expected a JSON object.`);
      continue;
    }

    const mapEntries = Object.entries(hashKeyMap);
    for (const variantPath of pathVariants) {
      const candidateNames = [`project2_${variantPath}`, `project_${variantPath}`];

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
    logger(`No local DevTools project settings found for "${projectPath}".`);
    return { matched: 0, updated: 0 };
  }

  let updated = 0;
  for (const localStoragePath of localStorageTargets) {
    const changed = patchLocalProjectSetting(localStoragePath, urlCheckEnabled);
    if (changed) {
      updated += 1;
    }
  }

  return { matched: localStorageTargets.size, updated };
}

function patchLocalProjectSetting(localStoragePath, urlCheckEnabled) {
  const parsedConfig = readJsonObject(localStoragePath, `local DevTools setting "${localStoragePath}"`);
  if (Array.isArray(parsedConfig) || typeof parsedConfig !== 'object' || parsedConfig === null) {
    throw new Error(`Expected local DevTools setting "${localStoragePath}" to be a JSON object.`);
  }

  if (parsedConfig.setting !== undefined && (Array.isArray(parsedConfig.setting) || typeof parsedConfig.setting !== 'object')) {
    throw new Error(`Expected "setting" in local DevTools setting "${localStoragePath}" to be an object.`);
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
    // When realpath fails (for symlink/permission edge cases), path.resolve variant still works for lookup.
  }
  return Array.from(variants);
}

function readJsonObject(filePath, targetLabel) {
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
      throw new Error('expected a JSON object');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse ${targetLabel}: ${error.message}`);
  }
}

function ensureExecutable(filePath, sourceName) {
  if (!isExecutable(filePath)) {
    throw new Error(`${sourceName} points to a non-executable file: ${filePath}`);
  }
}

function isExecutable(filePath) {
  try {
    accessSync(filePath, constants.F_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
