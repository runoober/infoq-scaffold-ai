import { getToken } from '@/utils/auth';
import { ElNotification } from 'element-plus';
import { useNoticeStore } from '@/store/modules/notice';

let stopErrorWatch: (() => void) | null = null;
let stopDataWatch: (() => void) | null = null;
let closeEventSource: (() => void) | null = null;
let activeUrl = '';

const isSSEEnabled = () => import.meta.env.VITE_APP_SSE === 'true';

const buildSSEUrl = (baseUrl: string) => {
  return `${baseUrl}?Authorization=Bearer ${getToken()}&clientid=${import.meta.env.VITE_APP_CLIENT_ID}`;
};

const clearSSEWatchers = () => {
  stopErrorWatch?.();
  stopDataWatch?.();
  stopErrorWatch = null;
  stopDataWatch = null;
};

/**
 * 主动关闭当前SSE连接，避免登录切换后残留旧连接。
 */
export const closeSSE = () => {
  clearSSEWatchers();
  closeEventSource?.();
  closeEventSource = null;
  activeUrl = '';
};

// 初始化
export const initSSE = (baseUrl: string) => {
  if (!isSSEEnabled()) {
    closeSSE();
    return;
  }

  const token = getToken();
  if (!token) {
    closeSSE();
    return;
  }

  const nextUrl = buildSSEUrl(baseUrl);
  if (activeUrl === nextUrl && closeEventSource) {
    // 连接已存在，避免重复初始化
    return;
  }

  // 切换账号/重登时，先关闭旧连接再建立新连接
  closeSSE();

  const { data, error, close } = useEventSource(nextUrl, [], {
    autoReconnect: {
      retries: 5,
      delay: 5000,
      onFailed() {
        console.log('Failed to connect after 5 retries');
      }
    }
  });

  activeUrl = nextUrl;
  closeEventSource = close;

  stopErrorWatch = watch(error, () => {
    const currentError = error.value;
    if (!currentError) return;
    console.log('SSE connection error:', currentError);
    error.value = null;
  });

  stopDataWatch = watch(data, () => {
    if (!data.value) return;
    useNoticeStore().addNotice({
      message: data.value,
      read: false,
      time: new Date().toLocaleString()
    });
    ElNotification({
      title: '消息',
      message: data.value,
      type: 'success',
      duration: 3000
    });
    data.value = null;
  });
};
