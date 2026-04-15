import crypto from 'node:crypto';

const REQUEST_TIMEOUT_MS = 10000;

export async function autoLoginWithBackend(runtime, logger = () => {}) {
  const clientId = String(runtime.autoLoginClientId || '').trim();
  const rsaPublicKey = String(runtime.autoLoginRsaPublicKey || '').trim();
  if (!clientId) {
    throw new Error('Auto login requires WEAPP_E2E_CLIENT_ID or TARO_APP_CLIENT_ID in current build env.');
  }
  if (!rsaPublicKey) {
    throw new Error('Auto login requires WEAPP_E2E_RSA_PUBLIC_KEY or TARO_APP_RSA_PUBLIC_KEY in current build env.');
  }

  const candidates = buildLoginCandidates({
    preferredUsername: runtime.autoLoginUsername,
    preferredPassword: runtime.autoLoginPassword,
    rawCandidates: runtime.autoLoginCandidates
  });
  if (candidates.length === 0) {
    throw new Error('Auto login has no credentials. Configure WEAPP_E2E_AUTO_LOGIN_USERNAME/WEAPP_E2E_AUTO_LOGIN_PASSWORD or WEAPP_E2E_AUTO_LOGIN_CANDIDATES.');
  }

  const baseUrls = Array.isArray(runtime.autoLoginBaseUrls) ? runtime.autoLoginBaseUrls : [];
  if (baseUrls.length === 0) {
    throw new Error('Auto login has no backend base URL. Configure WEAPP_E2E_BASE_URL or WEAPP_E2E_API_ORIGIN.');
  }

  const attemptErrors = [];
  for (const baseUrl of baseUrls) {
    logger(`Auto login probing backend: ${baseUrl}`);
    const captchaCheck = await queryCaptchaFlag(baseUrl);
    if (!captchaCheck.ok) {
      attemptErrors.push(`${baseUrl} -> ${captchaCheck.message}`);
      continue;
    }

    if (captchaCheck.captchaEnabled) {
      throw new Error(
        `Auto login blocked: ${baseUrl}/auth/code reports captchaEnabled=true. `
        + 'For smoke tests, start infoq-scaffold-backend with temporary override `--captcha.enable=false`.'
      );
    }

    for (const account of candidates) {
      const encryptedResult = await loginEncrypted({
        baseUrl,
        clientId,
        rsaPublicKey,
        username: account.username,
        password: account.password
      });
      if (encryptedResult.ok) {
        return {
          token: encryptedResult.token,
          username: account.username,
          mode: 'encrypted',
          baseUrl
        };
      }

      const plainResult = await loginPlain({
        baseUrl,
        clientId,
        username: account.username,
        password: account.password
      });
      if (plainResult.ok) {
        return {
          token: plainResult.token,
          username: account.username,
          mode: 'plain',
          baseUrl
        };
      }

      attemptErrors.push(
        `${baseUrl} user=${account.username} encrypted(${encryptedResult.message}) plain(${plainResult.message})`
      );
    }
  }

  throw new Error(`Auto login failed. ${attemptErrors.join(' || ')}`);
}

async function queryCaptchaFlag(baseUrl) {
  const endpoint = `${trimTrailingSlash(baseUrl)}/auth/code`;
  try {
    const response = await fetchWithTimeout(endpoint, { method: 'GET' });
    const body = await parseJson(response);
    if (response.status !== 200) {
      return {
        ok: false,
        message: `GET /auth/code http=${response.status}`
      };
    }
    if (body?.code !== 200) {
      return {
        ok: false,
        message: `GET /auth/code code=${body?.code}, msg=${body?.msg || ''}`
      };
    }
    return {
      ok: true,
      captchaEnabled: Boolean(body?.data?.captchaEnabled)
    };
  } catch (error) {
    return {
      ok: false,
      message: `GET /auth/code error=${formatError(error)}`
    };
  }
}

async function loginEncrypted({ baseUrl, clientId, rsaPublicKey, username, password }) {
  const endpoint = `${trimTrailingSlash(baseUrl)}/auth/login`;
  const payload = JSON.stringify({
    clientId,
    grantType: 'password',
    username,
    password
  });
  const aesKey = randomAesKey();
  const encryptedKey = encryptHeaderKey(aesKey, rsaPublicKey);
  const encryptedBody = encryptWithAesEcbPkcs7(payload, aesKey);

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        clientid: clientId,
        'encrypt-key': encryptedKey
      },
      body: encryptedBody
    });
    const body = await parseJson(response);
    const token = extractToken(body);
    if (response.status === 200 && body?.code === 200 && token) {
      return { ok: true, token };
    }
    return {
      ok: false,
      message: `http=${response.status}, code=${body?.code}, msg=${body?.msg || ''}`
    };
  } catch (error) {
    return { ok: false, message: `error=${formatError(error)}` };
  }
}

async function loginPlain({ baseUrl, clientId, username, password }) {
  const endpoint = `${trimTrailingSlash(baseUrl)}/auth/login`;
  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        clientid: clientId
      },
      body: JSON.stringify({
        clientId,
        grantType: 'password',
        username,
        password
      })
    });
    const body = await parseJson(response);
    const token = extractToken(body);
    if (response.status === 200 && body?.code === 200 && token) {
      return { ok: true, token };
    }
    return {
      ok: false,
      message: `http=${response.status}, code=${body?.code}, msg=${body?.msg || ''}`
    };
  } catch (error) {
    return { ok: false, message: `error=${formatError(error)}` };
  }
}

async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function extractToken(body) {
  return body?.data?.access_token || body?.data?.accessToken || '';
}

function buildLoginCandidates({ preferredUsername, preferredPassword, rawCandidates }) {
  const candidates = [];

  if (preferredUsername && preferredPassword) {
    candidates.push({
      username: String(preferredUsername).trim(),
      password: String(preferredPassword)
    });
  }

  for (const item of String(rawCandidates || '').split(',')) {
    const [username, password] = item.split(':');
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');
    if (!normalizedUsername || !normalizedPassword) {
      continue;
    }
    if (candidates.some((candidate) => candidate.username === normalizedUsername && candidate.password === normalizedPassword)) {
      continue;
    }
    candidates.push({
      username: normalizedUsername,
      password: normalizedPassword
    });
  }

  return candidates;
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function randomAesKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
}

function encryptWithAesEcbPkcs7(plainText, aesKey) {
  const cipher = crypto.createCipheriv('aes-256-ecb', Buffer.from(aesKey, 'utf8'), null);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]).toString('base64');
}

function encryptHeaderKey(aesKey, publicKeyBase64) {
  const base64Aes = Buffer.from(aesKey, 'utf8').toString('base64');
  return crypto.publicEncrypt(
    { key: toPem(publicKeyBase64), padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(base64Aes, 'utf8')
  ).toString('base64');
}

function toPem(base64Key) {
  const lines = (String(base64Key || '').match(/.{1,64}/g) || []).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----\n`;
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
