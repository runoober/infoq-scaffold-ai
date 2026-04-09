import Taro from '@tarojs/taro';
import { getToken, removeToken } from '@/utils/auth';
import { decryptBase64, decryptWithAes, encryptBase64, encryptWithAes, generateAesKey } from '@/utils/crypto';
import { mobileEnv } from '@/utils/env';
import { AppError, AuthError, errorCode } from '@/utils/errors';
import { tansParams } from '@/utils/helpers';
import { decrypt, encrypt } from '@/utils/rsa';

const encryptHeader = 'encrypt-key';
const runtimeClientKeyHeader = 'x-client-key';
const runtimeDeviceTypeHeader = 'x-device-type';
const duplicateRequestWindow = 500;
const recentRequests = new Map<string, number>();
const weappRuntimeType = 'weapp';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestHeaders extends Record<string, string | number | boolean | undefined> {
  isToken?: boolean;
  isEncrypt?: boolean | string;
  repeatSubmit?: boolean | string;
}

export interface RequestOptions<TData = unknown> {
  url: string;
  method?: RequestMethod;
  params?: Record<string, unknown>;
  data?: TData;
  headers?: RequestHeaders;
  timeout?: number;
}

interface UploadOptions {
  url: string;
  filePath: string;
  name?: string;
  formData?: Record<string, string>;
  headers?: RequestHeaders;
  timeout?: number;
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//.test(value);

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getRuntimeBaseApi = () => (mobileEnv.taroEnv === 'h5' ? mobileEnv.baseApi : mobileEnv.miniBaseApi);

const getBaseUrl = () => {
  const runtimeBaseApi = getRuntimeBaseApi();
  if (isAbsoluteUrl(runtimeBaseApi) || mobileEnv.taroEnv === 'h5') {
    return runtimeBaseApi;
  }
  if (!mobileEnv.apiOrigin) {
    throw new AppError('当前小程序环境缺少 TARO_APP_API_ORIGIN，请配置可访问的后端域名。', 'config');
  }
  if (!runtimeBaseApi) {
    return trimTrailingSlash(mobileEnv.apiOrigin);
  }
  return `${trimTrailingSlash(mobileEnv.apiOrigin)}${runtimeBaseApi.startsWith('/') ? runtimeBaseApi : `/${runtimeBaseApi}`}`;
};

const resolveUrl = (url: string) => {
  if (isAbsoluteUrl(url)) {
    return url;
  }
  const baseUrl = getBaseUrl();
  return `${trimTrailingSlash(baseUrl)}${url.startsWith('/') ? url : `/${url}`}`;
};

const shouldEncrypt = (headers?: RequestHeaders) => {
  const rawValue = headers?.isEncrypt;
  return rawValue === true || rawValue === 'true';
};

const shouldAttachToken = (headers?: RequestHeaders) => headers?.isToken !== false;

const shouldCheckDuplicate = (headers?: RequestHeaders) => headers?.repeatSubmit !== false && headers?.repeatSubmit !== 'false';

const getRuntimeClientKey = () => (mobileEnv.taroEnv === 'weapp' ? weappRuntimeType : '');

const getRuntimeDeviceType = () => (mobileEnv.taroEnv === 'weapp' ? weappRuntimeType : '');

const extractRequestHeaders = (headers?: RequestHeaders) => {
  const result: Record<string, string> = {};
  Object.entries(headers || {}).forEach(([key, value]) => {
    if (value === undefined || key === 'isToken' || key === 'isEncrypt' || key === 'repeatSubmit') {
      return;
    }
    result[key] = String(value);
  });
  return result;
};

const applyRuntimeHeaders = (headers: Record<string, string>) => {
  const runtimeClientKey = getRuntimeClientKey();
  const runtimeDeviceType = getRuntimeDeviceType();
  if (runtimeClientKey) {
    headers[runtimeClientKeyHeader] = runtimeClientKey;
  }
  if (runtimeDeviceType) {
    headers[runtimeDeviceTypeHeader] = runtimeDeviceType;
  }
  return headers;
};

const rememberDuplicateRequest = (url: string, method: RequestMethod, data: unknown, headers?: RequestHeaders) => {
  if (!shouldCheckDuplicate(headers) || (method !== 'POST' && method !== 'PUT')) {
    return;
  }
  const fingerprint = `${method}:${url}:${JSON.stringify(data ?? {})}`;
  const now = Date.now();
  const previous = recentRequests.get(fingerprint);
  if (previous && now - previous < duplicateRequestWindow) {
    throw new AppError('数据正在处理，请勿重复提交。', 'api');
  }
  recentRequests.set(fingerprint, now);
};

const readEncryptHeader = (headers?: Record<string, unknown>) => {
  if (!headers) {
    return '';
  }
  const targetKey = Object.keys(headers).find((key) => key.toLowerCase() === encryptHeader);
  return targetKey ? String(headers[targetKey] || '') : '';
};

const decryptPayloadIfNeeded = (payload: unknown, headers?: Record<string, unknown>) => {
  const encryptedKey = readEncryptHeader(headers);
  if (!encryptedKey) {
    return payload;
  }
  const rsaValue = decrypt(encryptedKey);
  if (!rsaValue) {
    throw new AppError('响应解密失败，请检查移动端加密配置。', 'api');
  }
  const aesKey = decryptBase64(String(rsaValue));
  const decrypted = decryptWithAes(String(payload), aesKey);
  return JSON.parse(decrypted);
};

const ensureSuccess = <T>(payload: any): T => {
  const code = payload?.code ?? 200;
  if (code === 401) {
    removeToken();
    throw new AuthError(payload?.msg || errorCode['401'], 401);
  }
  if (code !== 200) {
    throw new AppError(errorCode[String(code)] || payload?.msg || errorCode.default, 'api', code);
  }
  return payload as T;
};

const normalizeFailure = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  if (message.includes('timeout')) {
    return new AppError('系统接口请求超时。', 'network');
  }
  if (message.includes('fail')) {
    return new AppError('后端接口连接异常。', 'network');
  }
  if (error instanceof AppError) {
    return error;
  }
  return new AppError(message || '请求失败，请稍后重试。', 'network');
};

export const request = async <T, TData = unknown>(options: RequestOptions<TData>) => {
  const method = (options.method || 'GET').toUpperCase() as RequestMethod;
  const headers = extractRequestHeaders(options.headers);
  const url = resolveUrl(options.url);
  const requestHeaders = applyRuntimeHeaders({
    clientid: mobileEnv.clientId,
    ...headers
  });

  if (shouldAttachToken(options.headers) && getToken()) {
    requestHeaders.Authorization = `Bearer ${getToken()}`;
  }

  let finalUrl = url;
  if (method === 'GET' && options.params) {
    const queryString = tansParams(options.params);
    if (queryString) {
      finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString.slice(0, -1)}`;
    }
  }

  let data = options.data;
  if ((method === 'POST' || method === 'PUT') && shouldEncrypt(options.headers) && mobileEnv.encrypt) {
    const aesKey = generateAesKey();
    const encryptedAesKey = encrypt(encryptBase64(aesKey));
    if (!encryptedAesKey) {
      throw new AppError('请求加密失败，请检查移动端公钥配置。', 'config');
    }
    requestHeaders[encryptHeader] = encryptedAesKey;
    data = encryptWithAes(typeof options.data === 'string' ? options.data : JSON.stringify(options.data ?? {}), aesKey) as TData;
  }

  rememberDuplicateRequest(finalUrl, method, data, options.headers);

  try {
    const response = await Taro.request({
      url: finalUrl,
      method,
      data: method === 'GET' ? undefined : data,
      timeout: options.timeout || 50000,
      header: requestHeaders
    });
    const payload = decryptPayloadIfNeeded(response.data, response.header as Record<string, unknown>);
    return ensureSuccess<T>(payload);
  } catch (error) {
    throw normalizeFailure(error);
  }
};

export const uploadFile = async <T>(options: UploadOptions) => {
  const headers = extractRequestHeaders(options.headers);
  const requestHeaders = applyRuntimeHeaders({
    clientid: mobileEnv.clientId,
    ...headers
  });

  if (shouldAttachToken(options.headers) && getToken()) {
    requestHeaders.Authorization = `Bearer ${getToken()}`;
  }

  try {
    const response = await Taro.uploadFile({
      url: resolveUrl(options.url),
      filePath: options.filePath,
      name: options.name || 'file',
      timeout: options.timeout || 50000,
      header: requestHeaders,
      formData: options.formData || {}
    });

    const rawPayload = JSON.parse(response.data || '{}');
    const payload = decryptPayloadIfNeeded(rawPayload, (response as unknown as { header?: Record<string, unknown>; headers?: Record<string, unknown> }).header
      || (response as unknown as { headers?: Record<string, unknown> }).headers);

    return ensureSuccess<T>(payload);
  } catch (error) {
    throw normalizeFailure(error);
  }
};
