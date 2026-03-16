# Mock Patterns

## 1) API module mock

```ts
vi.mock('@/api/login', () => ({
  login: vi.fn(),
  logout: vi.fn(() => Promise.resolve()),
  getInfo: vi.fn()
}));
```

## 2) FileSaver mock

```ts
vi.mock('file-saver', () => ({
  default: { saveAs: vi.fn() }
}));
```

## 3) Element Plus message mock (in setup)

```ts
vi.mock('element-plus/es', () => ({
  ElMessage: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() }),
  ElNotification: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() }),
  ElMessageBox: { confirm: vi.fn(() => Promise.resolve()), alert: vi.fn(() => Promise.resolve()), prompt: vi.fn(() => Promise.resolve()) },
  ElLoading: { service: vi.fn(() => ({ close: vi.fn() })) }
}));

vi.mock('element-plus', () => ({
  ElMessage: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() }),
  ElNotification: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() }),
  ElMessageBox: { confirm: vi.fn(() => Promise.resolve()), alert: vi.fn(() => Promise.resolve()), prompt: vi.fn(() => Promise.resolve()) },
  ElLoading: { service: vi.fn(() => ({ close: vi.fn() })) }
}));
```

## 4) Pinia store baseline

```ts
beforeEach(() => {
  setActivePinia(createPinia());
});
```

## 5) Request interceptor access

```ts
const req = (service as any).interceptors.request.handlers[0].fulfilled;
const resp = (service as any).interceptors.response.handlers[0].fulfilled;
const respErr = (service as any).interceptors.response.handlers[0].rejected;
```

## 6) Route object helper for tagsView

```ts
const route = {
  path: '/system/user',
  name: 'SysUser',
  meta: { title: '用户管理' },
  matched: [],
  fullPath: '/system/user',
  hash: '',
  query: {},
  params: {},
  redirectedFrom: undefined,
  href: '/system/user'
} as unknown as RouteLocationNormalized;
```

## 7) Router + tagsView plugin mock (tab.ts)

```ts
const tabMocks = vi.hoisted(() => ({
  store: {
    delCachedView: vi.fn(),
    delView: vi.fn(),
    delAllViews: vi.fn(),
    delLeftTags: vi.fn(),
    delRightTags: vi.fn(),
    delOthersViews: vi.fn(),
    updateVisitedView: vi.fn()
  },
  router: {
    currentRoute: { value: { path: '/system/user', query: {}, matched: [] } },
    replace: vi.fn(),
    push: vi.fn()
  }
}));

vi.mock('@/router', () => ({ default: tabMocks.router }));
vi.mock('@/store/modules/tagsView', () => ({ useTagsViewStore: vi.fn(() => tabMocks.store) }));
```

## 8) SSE / WebSocket mock (@vueuse/core)

```ts
const wsMocks = vi.hoisted(() => ({
  useEventSource: vi.fn(),
  useWebSocket: vi.fn(),
  getToken: vi.fn(),
  addNotice: vi.fn()
}));

vi.mock('@vueuse/core', () => ({
  useEventSource: wsMocks.useEventSource,
  useWebSocket: wsMocks.useWebSocket
}));
vi.mock('@/utils/auth', () => ({ getToken: wsMocks.getToken }));
vi.mock('@/store/modules/notice', () => ({ useNoticeStore: vi.fn(() => ({ addNotice: wsMocks.addNotice })) }));
```

## 9) Business bug regression example (websocket ping)

```ts
initWebSocket('/ws/notice');
const [, options] = wsMocks.useWebSocket.mock.calls[0] as [string, any];
options.onMessage({}, { data: 'ping' });
expect(wsMocks.addNotice).not.toHaveBeenCalled();
```

## 10) getCurrentInstance proxy injection (views/401)

```ts
mount(Error401View, {
  global: {
    config: {
      globalProperties: {
        $route: { query: { noGoBack: true } },
        $router: { push: vi.fn(), go: vi.fn() }
      }
    }
  }
});
```

## 11) requestAnimationFrame + fake timers (scroll-to)

```ts
vi.useFakeTimers();
vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
  return window.setTimeout(() => cb(), 0);
});
scrollTo(120, 40, done);
vi.runAllTimers();
```

## 12) Class-style constructor mock resilient to mockReset (jsencrypt)

```ts
vi.mock('jsencrypt', () => {
  class MockJSEncrypt {
    setPublicKey(key: string) { setPublicKeySpy(key); }
    encrypt(txt: string) { return encryptSpy(txt); }
    setPrivateKey(key: string) { setPrivateKeySpy(key); }
    decrypt(txt: string) { return decryptSpy(txt); }
  }
  return { default: MockJSEncrypt };
});
```

## 13) Directive stubs for complex pages (`v-loading`, `v-hasPermi`)

```ts
mount(ViewComp, {
  global: {
    directives: {
      loading: {},
      hasPermi: {}
    }
  }
});
```

## 14) Inject `proxy.animate` dependency for transition bindings

```ts
mount(ViewComp, {
  global: {
    config: {
      globalProperties: {
        animate: {
          searchAnimate: { enter: '', leave: '' }
        }
      }
    }
  }
});
```

## 15) `el-card` named-slot stub (`header` + `default`)

```ts
const ElCardStub = defineComponent({
  name: 'ElCard',
  setup(_, { slots }) {
    return () => h('div', [slots.header?.(), slots.default?.()]);
  }
});
```

## 16) `el-table` + `el-table-column` scoped slot bridge (provide/inject)

```ts
const TABLE_DATA_SYMBOL = Symbol('table-data');

const ElTableStub = defineComponent({
  name: 'ElTable',
  props: { data: { type: Array, default: () => [] } },
  setup(props, { slots }) {
    provide(TABLE_DATA_SYMBOL, computed(() => props.data as any[]));
    return () => h('div', slots.default?.());
  }
});

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  setup(_, { slots }) {
    const rows = inject(TABLE_DATA_SYMBOL, computed(() => [] as any[]));
    return () => h('div', (slots.default && slots.default({ row: rows.value[0] || {}, $index: 0 })) || []);
  }
});
```

## 17) Force-replace local import component (`vue-cropper`) at module level

```ts
const mocks = vi.hoisted(() => ({
  getCropBlob: vi.fn()
}));

vi.mock('vue-cropper', () => ({
  VueCropper: {
    name: 'VueCropper',
    setup(_: unknown, { expose }: { expose: (obj: Record<string, unknown>) => void }) {
      expose({ getCropBlob: mocks.getCropBlob });
      return () => null;
    }
  }
}));
```

## 18) Child dialog ref/expose mock (`openDialog`/`closeDialog`)

```ts
const mocks = vi.hoisted(() => ({
  openDialog: vi.fn()
}));

vi.mock('@/views/monitor/operLog/oper-info-dialog.vue', () => ({
  default: defineComponent({
    name: 'OperInfoDialog',
    setup(_, { expose }) {
      expose({ openDialog: mocks.openDialog });
      return () => h('div');
    }
  })
}));
```

## 19) ECharts module mock for monitor dashboards

```ts
const chartMocks = vi.hoisted(() => ({
  init: vi.fn(),
  setOption: vi.fn(),
  resize: vi.fn()
}));

vi.mock('echarts', () => ({ init: chartMocks.init }));

chartMocks.init.mockReturnValue({
  setOption: chartMocks.setOption,
  resize: chartMocks.resize
});
```

## 20) Table-column fallback row for optional fields

```ts
const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  setup(_, { slots }) {
    const rows = inject(TABLE_DATA_SYMBOL, computed(() => [] as any[]));
    return () =>
      h(
        'div',
        (slots.default &&
          slots.default({
            row: rows.value[0] || { fileSuffix: '', url: '', createTime: '' },
            $index: 0
          })) ||
          []
      );
  }
});
```
