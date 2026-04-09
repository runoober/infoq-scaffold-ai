import Taro from '@tarojs/taro';
import type { DictDataVO, DictOption, TableResponse } from '@/api/types';

const normalizeCaptchaBase64 = (img: string) => (img.startsWith('data:') ? img : `data:image/gif;base64,${img}`);

const sanitizeCaptchaCacheKey = (value?: string) => (value || 'latest').replace(/[^a-zA-Z0-9_-]/g, '') || 'latest';

const resolveWeappUserDataPath = () => {
  const runtime = globalThis as { wx?: { env?: { USER_DATA_PATH?: string } } };
  return runtime.wx?.env?.USER_DATA_PATH || '';
};

export const parseStrEmpty = (value: unknown) => {
  if (value === undefined || value === null || value === 'undefined' || value === 'null') {
    return '';
  }
  return String(value);
};

export const tansParams = (params: Record<string, unknown>) => {
  let result = '';
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === null || value === '' || value === undefined) {
      return;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value as Record<string, unknown>).forEach((subKey) => {
        const subValue = (value as Record<string, unknown>)[subKey];
        if (subValue === null || subValue === '' || subValue === undefined) {
          return;
        }
        result += `${encodeURIComponent(`${key}[${subKey}]`)}=${encodeURIComponent(String(subValue))}&`;
      });
      return;
    }
    result += `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}&`;
  });
  return result;
};

export const asCaptchaImage = async (img?: string, cacheKey?: string) => {
  if (!img) {
    return '';
  }
  const dataUrl = normalizeCaptchaBase64(img);
  const userDataPath = resolveWeappUserDataPath();
  const taroApi = Taro as unknown as {
    base64ToArrayBuffer?: (value: string) => ArrayBuffer;
    getFileSystemManager?: () => {
      writeFile: (options: {
        filePath: string;
        data: ArrayBuffer;
        success?: () => void;
        fail?: (error: unknown) => void;
      }) => void;
    };
  };
  if (userDataPath && taroApi.base64ToArrayBuffer && taroApi.getFileSystemManager) {
    try {
      const filePath = `${userDataPath}/captcha-${sanitizeCaptchaCacheKey(cacheKey)}.gif`;
      const fs = taroApi.getFileSystemManager();
      const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const buffer = taroApi.base64ToArrayBuffer(base64);
      await new Promise<void>((resolve, reject) => {
        fs.writeFile({
          filePath,
          data: buffer,
          success: resolve,
          fail: reject
        });
      });
      return filePath;
    } catch (error) {
      console.warn('[infoq-weapp] Failed to materialize captcha image for weapp, fallback to data URL.', error);
    }
  }
  return dataUrl;
};

export const stripHtml = (value?: string) => {
  if (!value) {
    return '';
  }
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const normalizeDateInput = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.replace(/-/g, '/');
  }
  return value;
};

export const formatDateTime = (value?: string | number | Date) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const date = value instanceof Date
    ? new Date(value)
    : typeof value === 'number'
      ? new Date(value)
      : new Date(normalizeDateInput(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const part = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}`;
};

export const toDictOptions = (items?: DictDataVO[]) =>
  (items || []).map<DictOption>((item) => ({
    label: item.dictLabel,
    value: item.dictValue,
    cssClass: item.cssClass,
    listClass: item.listClass
  }));

export const getDictLabel = (items: DictOption[], value?: string) =>
  items.find((item) => item.value === value)?.label || value || '';

export type FlatTreeItem<T> = T & { _depth: number };

export const flattenTree = <T extends { children?: T[] }>(items?: T[], depth = 0): Array<FlatTreeItem<T>> => {
  const result: Array<FlatTreeItem<T>> = [];
  (items || []).forEach((item) => {
    result.push({ ...item, _depth: depth });
    if (item.children?.length) {
      result.push(...flattenTree(item.children, depth + 1));
    }
  });
  return result;
};

export const resolveTableTotal = <T>(value?: TableResponse<T>) => value?.total ?? value?.rows?.length ?? 0;
