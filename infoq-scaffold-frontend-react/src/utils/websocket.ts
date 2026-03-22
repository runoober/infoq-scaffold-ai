import { getToken } from '@/utils/auth';
import { useNoticeStore } from '@/store/modules/notice';
import modal from '@/utils/modal';

let ws: WebSocket | null = null;
let heartBeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let activeUrl = '';

const clearTimers = () => {
  if (heartBeatTimer) {
    clearInterval(heartBeatTimer);
    heartBeatTimer = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (!activeUrl) {
    return;
  }
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWebSocket(activeUrl);
  }, 3000);
};

const closeSocket = () => {
  clearTimers();
  ws?.close();
  ws = null;
};

export const initWebSocket = (url: string) => {
  if (import.meta.env.VITE_APP_WEBSOCKET === 'false') {
    closeSocket();
    return;
  }

  activeUrl = url;
  const token = getToken();
  if (!token) {
    closeSocket();
    return;
  }

  closeSocket();
  const targetUrl = `${url}?Authorization=Bearer ${token}&clientid=${import.meta.env.VITE_APP_CLIENT_ID}`;
  ws = new WebSocket(targetUrl);

  ws.onopen = () => {
    heartBeatTimer = setInterval(() => {
      ws?.send(JSON.stringify({ type: 'ping' }));
    }, 10000);
  };

  ws.onmessage = (evt) => {
    if (typeof evt.data === 'string' && evt.data.includes('ping')) {
      return;
    }
    useNoticeStore.getState().addNotice({
      message: String(evt.data),
      read: false,
      time: new Date().toLocaleString()
    });
    modal.notifySuccess({
      title: '消息',
      description: String(evt.data),
      duration: 3
    });
  };

  ws.onerror = () => {
    scheduleReconnect();
  };

  ws.onclose = () => {
    clearTimers();
    scheduleReconnect();
  };
};

export const closeWebSocket = () => {
  activeUrl = '';
  closeSocket();
};
