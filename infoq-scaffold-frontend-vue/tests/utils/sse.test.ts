import { nextTick, ref } from 'vue';
import { ElNotification } from 'element-plus';

const sseMocks = vi.hoisted(() => {
  return {
    useEventSource: vi.fn(),
    getToken: vi.fn(),
    addNotice: vi.fn()
  };
});

vi.mock('@vueuse/core', () => ({
  useEventSource: sseMocks.useEventSource
}));

vi.mock('@/utils/auth', () => ({
  getToken: sseMocks.getToken
}));

vi.mock('@/store/modules/notice', () => ({
  useNoticeStore: vi.fn(() => ({
    addNotice: sseMocks.addNotice
  }))
}));

import { closeSSE, initSSE } from '@/utils/sse';

describe('utils/sse', () => {
  beforeEach(() => {
    closeSSE();
    vi.clearAllMocks();
    (import.meta.env as any).VITE_APP_SSE = 'true';
    (import.meta.env as any).VITE_APP_CLIENT_ID = 'test-client-id';
  });

  afterEach(() => {
    closeSSE();
  });

  it('skips initialization when sse switch is disabled or token is missing', () => {
    (import.meta.env as any).VITE_APP_SSE = 'false';
    sseMocks.getToken.mockReturnValue('token-a');
    initSSE('/system/sse');
    expect(sseMocks.useEventSource).not.toHaveBeenCalled();

    (import.meta.env as any).VITE_APP_SSE = 'true';
    sseMocks.getToken.mockReturnValue('');
    initSSE('/system/sse');
    expect(sseMocks.useEventSource).not.toHaveBeenCalled();
  });

  it('initializes sse and handles incoming data/error watchers', async () => {
    const data = ref<string | null>(null);
    const error = ref<any>(null);
    const close = vi.fn();
    sseMocks.getToken.mockReturnValue('token-a');
    sseMocks.useEventSource.mockReturnValue({
      data,
      error,
      close
    });

    initSSE('/system/sse');

    expect(sseMocks.useEventSource).toHaveBeenCalledWith(
      '/system/sse?Authorization=Bearer token-a&clientid=test-client-id',
      [],
      expect.objectContaining({
        autoReconnect: expect.objectContaining({
          retries: 5,
          delay: 5000
        })
      })
    );
    const connectOptions = sseMocks.useEventSource.mock.calls[0][2] as {
      autoReconnect: { onFailed: () => void };
    };
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    connectOptions.autoReconnect.onFailed();
    expect(logSpy).toHaveBeenCalledWith('Failed to connect after 5 retries');

    data.value = '系统消息';
    await nextTick();
    expect(sseMocks.addNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '系统消息',
        read: false
      })
    );
    expect(ElNotification as any).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '系统消息',
        type: 'success'
      })
    );
    expect(data.value).toBeNull();

    error.value = new Error('sse-error');
    await nextTick();
    expect(error.value).toBeNull();
    logSpy.mockRestore();

    closeSSE();
    expect(close).toHaveBeenCalled();
  });

  it('reuses existing connection for same url and reconnects when token changes', () => {
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    let currentToken = 'token-a';
    sseMocks.getToken.mockImplementation(() => currentToken);
    sseMocks.useEventSource
      .mockReturnValueOnce({ data: ref(null), error: ref(null), close: firstClose })
      .mockReturnValueOnce({ data: ref(null), error: ref(null), close: secondClose });

    initSSE('/system/sse');
    initSSE('/system/sse');
    expect(sseMocks.useEventSource).toHaveBeenCalledTimes(1);

    currentToken = 'token-b';
    initSSE('/system/sse');
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(sseMocks.useEventSource).toHaveBeenCalledTimes(2);
  });
});
