import path from 'node:path'
import { defineConfig, type UserConfigExport } from '@tarojs/cli'

import devConfig from './dev'
import prodConfig from './prod'

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'vite'>(async (merge) => {
  const compileTimeMobileEnv = {
    TARO_APP_TITLE: process.env.TARO_APP_TITLE ?? '',
    TARO_APP_COPYRIGHT: process.env.TARO_APP_COPYRIGHT ?? '',
    TARO_APP_BASE_API: process.env.TARO_APP_BASE_API ?? '',
    TARO_APP_MINI_BASE_API: process.env.TARO_APP_MINI_BASE_API ?? '',
    TARO_APP_API_ORIGIN: process.env.TARO_APP_API_ORIGIN ?? '',
    TARO_APP_ENCRYPT: process.env.TARO_APP_ENCRYPT ?? '',
    TARO_APP_RSA_PUBLIC_KEY: process.env.TARO_APP_RSA_PUBLIC_KEY ?? '',
    TARO_APP_RSA_PRIVATE_KEY: process.env.TARO_APP_RSA_PRIVATE_KEY ?? '',
    TARO_APP_CLIENT_ID: process.env.TARO_APP_CLIENT_ID ?? '',
    TARO_ENV: process.env.TARO_ENV ?? ''
  }

  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'infoq-scaffold-frontend-weapp-react',
    date: '2026-3-30',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    alias: {
      '@': path.resolve(__dirname, '../src')
    },
    defineConstants: {
      __INFOQ_COMPILE_ENV__: JSON.stringify(compileTimeMobileEnv)
    },
    copy: {
      patterns: [
      ],
      options: {
      }
    },
    framework: 'react',
    compiler: 'vite',
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {

          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      esnextModules: ['taro-ui'],

      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
    },
  }


  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig)
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig)
})
