import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import Uni from '@uni-helper/plugin-uni';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const compileTimeMobileEnv = {
    TARO_APP_TITLE: env.TARO_APP_TITLE ?? process.env.TARO_APP_TITLE ?? '',
    TARO_APP_COPYRIGHT: env.TARO_APP_COPYRIGHT ?? process.env.TARO_APP_COPYRIGHT ?? '',
    TARO_APP_BASE_API: env.TARO_APP_BASE_API ?? process.env.TARO_APP_BASE_API ?? '',
    TARO_APP_MINI_BASE_API: env.TARO_APP_MINI_BASE_API ?? process.env.TARO_APP_MINI_BASE_API ?? '',
    TARO_APP_API_ORIGIN: env.TARO_APP_API_ORIGIN ?? process.env.TARO_APP_API_ORIGIN ?? '',
    TARO_APP_ENCRYPT: env.TARO_APP_ENCRYPT ?? process.env.TARO_APP_ENCRYPT ?? '',
    TARO_APP_RSA_PUBLIC_KEY: env.TARO_APP_RSA_PUBLIC_KEY ?? process.env.TARO_APP_RSA_PUBLIC_KEY ?? '',
    TARO_APP_RSA_PRIVATE_KEY: env.TARO_APP_RSA_PRIVATE_KEY ?? process.env.TARO_APP_RSA_PRIVATE_KEY ?? '',
    TARO_APP_CLIENT_ID: env.TARO_APP_CLIENT_ID ?? process.env.TARO_APP_CLIENT_ID ?? '',
    TARO_ENV: env.TARO_ENV ?? process.env.TARO_ENV ?? ''
  };

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    plugins: [Uni()],
    define: {
      __INFOQ_COMPILE_ENV__: JSON.stringify(compileTimeMobileEnv)
    }
  };
});
