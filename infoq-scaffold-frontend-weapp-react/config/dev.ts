import type { UserConfigExport } from "@tarojs/cli"

export default {
  mini: {},
  h5: {
    devServer: {
      host: '0.0.0.0',
      port: 10101,
      proxy: {
        '/dev-api': {
          target: process.env.TARO_APP_API_ORIGIN || 'http://localhost:8080',
          changeOrigin: true
        }
      }
    }
  }
} satisfies UserConfigExport<'vite'>
