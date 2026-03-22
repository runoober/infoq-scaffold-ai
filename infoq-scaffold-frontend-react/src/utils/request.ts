import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import FileSaver from 'file-saver';
import { HttpStatus } from '@/enums/RespEnum';
import { errorCode } from '@/utils/errorCode';
import { blobValidate, tansParams } from '@/utils/scaffold';
import cache from '@/utils/cache';
import { getLanguage } from '@/lang';
import { getToken } from '@/utils/auth';
import { decryptBase64, decryptWithAes, encryptBase64, encryptWithAes, generateAesKey } from '@/utils/crypto';
import { decrypt, encrypt } from '@/utils/jsencrypt';
import { navigateTo } from '@/utils/router-utils';
import { useUserStore } from '@/store/modules/user';
import modal from '@/utils/modal';

const encryptHeader = 'encrypt-key';

export const isRelogin = { show: false };

type RequestInstance = {
  <T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<T>;
  request<T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<T>;
  get<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  delete<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  head<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  options<T = unknown, D = unknown>(url: string, config?: AxiosRequestConfig<D>): Promise<T>;
  post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
} & Omit<AxiosInstance, 'request' | 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch'>;

export const globalHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  clientid: import.meta.env.VITE_APP_CLIENT_ID
});

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: {
    clientid: import.meta.env.VITE_APP_CLIENT_ID
  },
  transitional: {
    clarifyTimeoutError: true
  }
});

const request = service as RequestInstance;

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers['Content-Language'] = getLanguage();

    const isToken = config.headers?.isToken === false;
    const isRepeatSubmit = config.headers?.repeatSubmit === false;
    const isEncrypt = config.headers?.isEncrypt === 'true';

    if (getToken() && !isToken) {
      config.headers.Authorization = `Bearer ${getToken()}`;
    }
    if (!config.headers.clientid) {
      config.headers.clientid = import.meta.env.VITE_APP_CLIENT_ID;
    }

    if (config.method === 'get' && config.params) {
      let url = `${config.url}?${tansParams(config.params)}`;
      url = url.slice(0, -1);
      config.params = {};
      config.url = url;
    }

    if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
      const requestObj = {
        url: config.url,
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
        time: Date.now()
      };
      const sessionObj = cache.session.getJSON<{ url: string; data: string; time: number }>('sessionObj');
      if (sessionObj) {
        const interval = 500;
        if (sessionObj.data === requestObj.data && requestObj.time - sessionObj.time < interval && sessionObj.url === requestObj.url) {
          return Promise.reject(new Error('数据正在处理，请勿重复提交'));
        }
      }
      cache.session.setJSON('sessionObj', requestObj);
    }

    if (import.meta.env.VITE_APP_ENCRYPT === 'true' && isEncrypt && (config.method === 'post' || config.method === 'put')) {
      const aesKey = generateAesKey();
      config.headers[encryptHeader] = encrypt(encryptBase64(aesKey));
      config.data = typeof config.data === 'object' ? encryptWithAes(JSON.stringify(config.data), aesKey) : encryptWithAes(config.data, aesKey);
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

service.interceptors.response.use(
  (res: AxiosResponse) => {
    if (import.meta.env.VITE_APP_ENCRYPT === 'true') {
      const keyStr = res.headers[encryptHeader];
      if (keyStr) {
        const base64Str = decrypt(keyStr);
        const aesKey = decryptBase64(base64Str.toString());
        const decryptData = decryptWithAes(res.data, aesKey);
        res.data = JSON.parse(decryptData);
      }
    }

    const code = res.data.code || HttpStatus.SUCCESS;
    const msg = errorCode[code] || res.data.msg || errorCode.default;

    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data;
    }

    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        modal.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录').then(async (ok) => {
          if (!ok) {
            isRelogin.show = false;
            return;
          }
          isRelogin.show = false;
          await useUserStore.getState().logout();
          navigateTo('/login');
        });
      }
      return Promise.reject(new Error('无效的会话，或者会话已过期，请重新登录。'));
    }

    if (code === HttpStatus.SERVER_ERROR || code === HttpStatus.WARN) {
      modal.msgError(msg);
      return Promise.reject(new Error(msg));
    }

    if (code !== HttpStatus.SUCCESS) {
      modal.notifyError({ title: msg });
      return Promise.reject(new Error('error'));
    }

    return Promise.resolve(res.data);
  },
  (error: AxiosError) => {
    let messageText = error.message || '请求失败';
    if (messageText === 'Network Error') {
      messageText = '后端接口连接异常';
    } else if (messageText.includes('timeout')) {
      messageText = '系统接口请求超时';
    } else if (messageText.includes('Request failed with status code')) {
      messageText = '系统接口' + messageText.slice(-3) + '异常';
    }
    modal.msgError(messageText);
    return Promise.reject(error);
  }
);

export function download(url: string, params: Record<string, unknown>, fileName: string) {
  return request
    .post<Blob>(url, params, {
      transformRequest: [
        (body: Record<string, unknown>) => {
          return tansParams(body);
        }
      ],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob'
    })
    .then(async (blob) => {
      const isBlob = blobValidate(blob);
      if (isBlob) {
        FileSaver.saveAs(new Blob([blob]), fileName);
      } else {
        const resText = await new Blob([blob]).text();
        const rspObj = JSON.parse(resText);
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode.default;
        modal.msgError(errMsg);
      }
    })
    .catch(() => {
      modal.msgError('下载文件出现错误，请联系管理员！');
    });
}

export default request;
