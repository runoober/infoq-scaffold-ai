type RuntimeEnv = Record<string, string | undefined>;
declare const __INFOQ_COMPILE_ENV__: RuntimeEnv | undefined;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

declare module 'aes-js';
