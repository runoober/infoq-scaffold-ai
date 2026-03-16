import { ElNotification } from 'element-plus';

const websocketMocks = vi.hoisted(() => {
  return {
    useWebSocket: vi.fn(),
    getToken: vi.fn(),
    addNotice: vi.fn()
  };
});

vi.mock('@vueuse/core', () => ({
  useWebSocket: websocketMocks.useWebSocket
}));

vi.mock('@/utils/auth', () => ({
  getToken: websocketMocks.getToken
}));

vi.mock('@/store/modules/notice', () => ({
  useNoticeStore: vi.fn(() => ({
    addNotice: websocketMocks.addNotice
  }))
}));

import { initWebSocket } from '@/utils/websocket';

describe('utils/websocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (import.meta.env as any).VITE_APP_CLIENT_ID = 'test-client-id';
    (import.meta.env as any).VITE_APP_WEBSOCKET = 'true';
  });

  it('skips websocket init when feature switch is disabled', () => {
    (import.meta.env as any).VITE_APP_WEBSOCKET = 'false';
    initWebSocket('/ws/notice');
    expect(websocketMocks.useWebSocket).not.toHaveBeenCalled();
  });

  it('initializes websocket and handles message callback', () => {
    websocketMocks.getToken.mockReturnValue('ws-token');
    websocketMocks.useWebSocket.mockReturnValue({});

    initWebSocket('/ws/notice');

    expect(websocketMocks.useWebSocket).toHaveBeenCalledTimes(1);
    const [url, options] = websocketMocks.useWebSocket.mock.calls[0] as [string, any];
    expect(url).toBe('/ws/notice?Authorization=Bearer ws-token&clientid=test-client-id');
    expect(options).toEqual(
      expect.objectContaining({
        autoReconnect: expect.objectContaining({ retries: 3, delay: 1000 }),
        heartbeat: expect.objectContaining({ interval: 10000, pongTimeout: 2000 })
      })
    );

    options.onMessage({}, { data: '业务通知' });
    expect(websocketMocks.addNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '业务通知',
        read: false
      })
    );
    expect(ElNotification as any).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '业务通知',
        type: 'success'
      })
    );
  });

  it('ignores websocket ping messages', () => {
    websocketMocks.getToken.mockReturnValue('ws-token');
    websocketMocks.useWebSocket.mockReturnValue({});

    initWebSocket('/ws/notice');
    const [, options] = websocketMocks.useWebSocket.mock.calls[0] as [string, any];

    options.onMessage({}, { data: 'ping' });

    expect(websocketMocks.addNotice).not.toHaveBeenCalled();
    expect(ElNotification as any).not.toHaveBeenCalled();
  });

  it('logs lifecycle callbacks for reconnect and connection state', () => {
    websocketMocks.getToken.mockReturnValue('ws-token');
    websocketMocks.useWebSocket.mockReturnValue({});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    initWebSocket('/ws/notice');
    const [, options] = websocketMocks.useWebSocket.mock.calls[0] as [string, any];

    options.autoReconnect.onFailed();
    options.onConnected();
    options.onDisconnected();

    expect(consoleLogSpy).toHaveBeenCalledWith('websocket重连失败');
    expect(consoleLogSpy).toHaveBeenCalledWith('websocket已经连接');
    expect(consoleLogSpy).toHaveBeenCalledWith('websocket已经断开');
  });
});
