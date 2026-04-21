import path from 'node:path';
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';

export const ROUTES = Object.freeze({
  login: '/pages/login/index',
  home: '/pages/home/index',
  profile: '/pages/profile/index',
  profileEdit: '/pages/profile-edit/index',
  notices: '/pages/notices/index',
  noticeDetail: '/pages/notice-detail/index',
  systemUsers: '/pages/system-users/index'
});

export const ROUTE_SELECTORS = Object.freeze({
  [ROUTES.login]: '.login-container',
  [ROUTES.home]: '.home-container',
  [ROUTES.profile]: '.profile-container',
  [ROUTES.profileEdit]: '.profile-edit-container',
  [ROUTES.notices]: '.list-container',
  [ROUTES.systemUsers]: '.list-container'
});

export const ALL_ROUTES = Object.freeze([
  ROUTES.login,
  ROUTES.home,
  '/pages/admin/index',
  '/pages/notices/index',
  '/pages/notice-detail/index',
  '/pages/notice-form/index',
  ROUTES.profile,
  '/pages/profile-edit/index',
  '/pages/system-users/index',
  '/pages/system-users/form/index',
  '/pages/system-roles/index',
  '/pages/system-roles/form/index',
  '/pages/system-depts/index',
  '/pages/system-depts/form/index',
  '/pages/system-posts/index',
  '/pages/system-posts/form/index',
  '/pages/system-menus/index',
  '/pages/system-menus/form/index',
  '/pages/system-dicts/index',
  '/pages/system-dicts/data/index',
  '/pages/monitor-online/index',
  '/pages/monitor-login-info/index',
  '/pages/monitor-oper-log/index',
  '/pages/monitor-cache/index'
]);

export const PROTECTED_ROUTES = Object.freeze(ALL_ROUTES.filter((route) => route !== ROUTES.login));
export const UNAUTH_REDIRECT_ROUTES = Object.freeze([ROUTES.login, ROUTES.home]);

export const CORE_ROUTES = Object.freeze([
  ROUTES.home,
  ROUTES.notices,
  ROUTES.systemUsers
]);

export const SUITE_PIPELINES = Object.freeze({
  smoke: ['smoke.routes'],
  core: ['smoke.routes', 'auth.flow', 'profile.flow', 'notice.flow', 'permission.flow'],
  full: ['api.contract', 'full.routes', 'auth.flow', 'profile.flow', 'notice.flow', 'permission.flow']
});

const suiteValues = new Set(Object.keys(SUITE_PIPELINES));
const DEFAULT_LOGIN_CANDIDATES = 'admin:admin123,dept:666666,owner:666666,admin:123456';
const DEFAULT_RSA_PUBLIC_KEY = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKoR8mX0rGKLqzcWmOzbfj64K8ZIgOdHnzkXSOVOZbFu/TJhZ7rFAN+eaGkl3C4buccQd/EjEsj9ir7ijT7h96MCAwEAAQ==';

export function parseRunnerArgs(argv) {
  let suite = String(process.env.WEAPP_E2E_SUITE || 'smoke').trim();
  let report = parseBoolean(process.env.WEAPP_E2E_REPORT, false);

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];

    if (current === '--suite') {
      suite = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }

    if (current.startsWith('--suite=')) {
      suite = current.slice('--suite='.length).trim();
      continue;
    }

    if (current === '--report') {
      report = true;
      continue;
    }

    if (current === '--no-report') {
      report = false;
      continue;
    }

    throw new Error(`Unsupported argument "${current}". Supported: --suite <smoke|core|full> --report --no-report`);
  }

  if (!suiteValues.has(suite)) {
    throw new Error(`Unsupported suite "${suite}". Supported values: ${Array.from(suiteValues).join(', ')}`);
  }

  return { suite, report };
}

export function loadRuntimeConfig({ suite, report }) {
  const workspaceRoot = process.cwd();
  const distDir = path.resolve(workspaceRoot, process.env.WEAPP_E2E_PROJECT_PATH || 'dist');
  const projectConfigPath = path.join(distDir, 'project.config.json');
  const projectPrivateConfigPath = path.join(distDir, 'project.private.config.json');
  const workspaceProjectConfigPath = path.join(workspaceRoot, 'project.config.json');
  const reportDir = path.resolve(workspaceRoot, process.env.WEAPP_E2E_REPORT_DIR || 'tests/e2e/weapp/reports');
  const autoLoginConfig = resolveAutoLoginConfig({ workspaceRoot, distDir });

  return {
    suite,
    report: report || suite === 'full',
    workspaceRoot,
    distDir,
    projectConfigPath,
    projectPrivateConfigPath,
    workspaceProjectConfigPath,
    reportDir,
    waitMs: parsePositiveInt(process.env.WEAPP_E2E_STEP_WAIT_MS, 900),
    launchTimeoutMs: parsePositiveInt(process.env.WEAPP_E2E_TIMEOUT_MS, 120000),
    token: String(process.env.WEAPP_E2E_TOKEN || '').trim(),
    extraRoutes: parseCsvRoutes(process.env.WEAPP_E2E_EXTRA_ROUTES),
    strictSelector: parseBoolean(process.env.WEAPP_E2E_STRICT_SELECTOR, false),
    failOnConsoleError: parseBoolean(process.env.WEAPP_E2E_FAIL_ON_CONSOLE_ERROR, true),
    autoLogin: parseBoolean(process.env.WEAPP_E2E_AUTO_LOGIN, true),
    keepExistingSession: parseBoolean(process.env.WEAPP_E2E_KEEP_EXISTING_SESSION, false),
    devtoolsUrlCheckEnabled: parseBoolean(process.env.WECHAT_DEVTOOLS_URL_CHECK, false),
    cliOverridePath: String(process.env.WECHAT_DEVTOOLS_CLI || '').trim(),
    autoLoginBaseUrls: autoLoginConfig.baseUrls,
    autoLoginClientId: autoLoginConfig.clientId,
    autoLoginRsaPublicKey: autoLoginConfig.rsaPublicKey,
    autoLoginUsername: String(process.env.WEAPP_E2E_AUTO_LOGIN_USERNAME || '').trim(),
    autoLoginPassword: String(process.env.WEAPP_E2E_AUTO_LOGIN_PASSWORD || '').trim(),
    autoLoginCandidates: String(process.env.WEAPP_E2E_AUTO_LOGIN_CANDIDATES || DEFAULT_LOGIN_CANDIDATES).trim()
  };
}

function parsePositiveInt(rawValue, fallback) {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

function parseBoolean(rawValue, fallback) {
  if (rawValue === undefined) {
    return fallback;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return fallback;
}

function parseCsvRoutes(rawValue) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((route) => (route.startsWith('/') ? route : `/${route}`));
}

function resolveAutoLoginConfig({ workspaceRoot, distDir }) {
  const distCompileEnv = parseDistCompileEnv(distDir);
  const fallbackEnv = parseFirstExistingEnvFile({
    workspaceRoot,
    fileNames: [
      String(process.env.WEAPP_E2E_ENV_FILE || '').trim(),
      '.env.development',
      '.env.production'
    ].filter(Boolean)
  });

  const apiOrigin = firstNonEmpty([
    process.env.WEAPP_E2E_API_ORIGIN,
    distCompileEnv.TARO_APP_API_ORIGIN,
    fallbackEnv.TARO_APP_API_ORIGIN,
    'http://127.0.0.1:8080'
  ]);

  const miniBaseApi = firstDefined([
    process.env.WEAPP_E2E_MINI_BASE_API,
    distCompileEnv.TARO_APP_MINI_BASE_API,
    fallbackEnv.TARO_APP_MINI_BASE_API,
    distCompileEnv.TARO_APP_BASE_API,
    fallbackEnv.TARO_APP_BASE_API
  ]);

  const explicitBaseUrl = String(process.env.WEAPP_E2E_BASE_URL || '').trim();
  const composedBaseUrl = composeBaseUrl(apiOrigin, miniBaseApi);
  const composedOriginOnly = composeBaseUrl(apiOrigin, '');
  const baseUrls = dedupeNonEmpty([explicitBaseUrl, composedBaseUrl, composedOriginOnly]);

  return {
    baseUrls,
    clientId: firstNonEmpty([
      process.env.WEAPP_E2E_CLIENT_ID,
      distCompileEnv.TARO_APP_CLIENT_ID,
      fallbackEnv.TARO_APP_CLIENT_ID
    ]),
    rsaPublicKey: firstNonEmpty([
      process.env.WEAPP_E2E_RSA_PUBLIC_KEY,
      distCompileEnv.TARO_APP_RSA_PUBLIC_KEY,
      fallbackEnv.TARO_APP_RSA_PUBLIC_KEY,
      DEFAULT_RSA_PUBLIC_KEY
    ])
  };
}

function composeBaseUrl(apiOrigin, baseApi) {
  const origin = String(apiOrigin || '').trim();
  if (!origin) {
    return '';
  }
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedBase = String(baseApi || '').trim();
  if (!normalizedBase) {
    return normalizedOrigin;
  }
  return `${normalizedOrigin}${normalizedBase.startsWith('/') ? normalizedBase : `/${normalizedBase}`}`;
}

function parseFirstExistingEnvFile({ workspaceRoot, fileNames }) {
  for (const fileName of fileNames) {
    const filePath = path.resolve(workspaceRoot, fileName);
    if (!existsSync(filePath)) {
      continue;
    }
    return parseEnvFile(filePath);
  }
  return {};
}

function parseEnvFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const entries = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    entries[key] = value;
  }
  return entries;
}

function parseDistCompileEnv(distDir) {
  const commonJsPath = path.join(distDir, 'common.js');
  if (!existsSync(commonJsPath)) {
    return {};
  }

  const source = readFileSync(commonJsPath, 'utf8');
  const keys = [
    'TARO_APP_API_ORIGIN',
    'TARO_APP_MINI_BASE_API',
    'TARO_APP_BASE_API',
    'TARO_APP_CLIENT_ID',
    'TARO_APP_RSA_PUBLIC_KEY'
  ];
  const env = {};

  for (const key of keys) {
    const match = source.match(new RegExp(`${key}:\"([^\"]*)\"`));
    if (match && match[1] !== undefined) {
      env[key] = decodeEscaped(match[1]);
    }
  }

  return env;
}

function decodeEscaped(value) {
  try {
    return JSON.parse(`"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  } catch {
    return value;
  }
}

function firstNonEmpty(values) {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }
  return '';
}

function firstDefined(values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }
  return '';
}

function dedupeNonEmpty(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}
