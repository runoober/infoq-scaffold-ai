import { afterEach, vi } from 'vitest';

const storage = new Map<string, unknown>();

const uniMock = {
  getStorageSync: vi.fn((key: string) => storage.get(key)),
  setStorageSync: vi.fn((key: string, value: unknown) => {
    storage.set(key, value);
  }),
  removeStorageSync: vi.fn((key: string) => {
    storage.delete(key);
  }),
  showToast: vi.fn(async () => ({ errMsg: 'showToast:ok' })),
  showModal: vi.fn(async () => ({ confirm: true, cancel: false })),
  reLaunch: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  request: vi.fn(),
  uploadFile: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({ theme: 'light', uniPlatform: 'mp-weixin' })),
  onThemeChange: vi.fn(),
  offThemeChange: vi.fn(),
  base64ToArrayBuffer: vi.fn((value: string) => new TextEncoder().encode(value).buffer),
  getFileSystemManager: vi.fn(() => ({
    writeFile: ({ success }: { success?: () => void }) => {
      success?.();
    }
  }))
};

Object.defineProperty(globalThis, 'uni', {
  value: uniMock,
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'getCurrentPages', {
  value: vi.fn(() => []),
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'wx', {
  value: {
    env: {
      USER_DATA_PATH: '/tmp'
    }
  },
  writable: true,
  configurable: true
});

afterEach(() => {
  storage.clear();
  vi.clearAllMocks();
});
