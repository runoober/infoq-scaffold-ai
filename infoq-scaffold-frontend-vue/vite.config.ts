import { defineConfig, loadEnv } from 'vite';
import createPlugins from './vite/plugins';
import autoprefixer from 'autoprefixer'; // css自动添加兼容性前缀
import { sharedResolve, sharedScssPreprocessorOptions } from './vite/shared';

const vueEcosystemPackages = [
  'vue',
  'vue-router',
  'pinia',
  'vue-i18n',
  '@vueuse/core',
  '@vueuse/shared',
  '@intlify/core-base',
  '@intlify/message-compiler',
  '@intlify/shared',
  '@vue/shared',
  '@vue/runtime-core',
  '@vue/runtime-dom',
  '@vue/reactivity'
];

const elementPlusPackages = ['element-plus', '@element-plus/hooks', '@element-plus/utils', '@element-plus/constants', '@element-plus/directives'];

const elementPlusDependencyPackages = [
  '@ctrl/tinycolor',
  '@floating-ui/dom',
  '@floating-ui/core',
  '@floating-ui/utils',
  '@sxzz/popperjs-es',
  'async-validator',
  'dayjs',
  'lodash',
  'lodash-es',
  'lodash-unified',
  'memoize-one',
  'normalize-wheel-es'
];

function matchesNodeModulePackage(id: string, packages: string[]) {
  return packages.some((pkg) => id.includes(`/node_modules/${pkg}/`));
}

/**
 * 如果是后端Docker部署，前端填写后端Docker名称加端口
 * 'http://infoq-scaffold-backend:8080',
 */
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.baidu.com/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.baidu.com/admin/，则设置 baseUrl 为 /admin/。
    base: env.VITE_APP_CONTEXT_PATH,
    resolve: sharedResolve,
    // https://cn.vitejs.dev/config/#resolve-extensions
    plugins: createPlugins(env, command === 'build'),
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT),
      open: true,
      proxy: {
        [env.VITE_APP_BASE_API]: {
          // 后端宿主机部署，前端填写localhost:8080
          target: 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        }
      }
    },
    css: {
      preprocessorOptions: {
        ...sharedScssPreprocessorOptions
      },
      postcss: {
        plugins: [
          // 浏览器兼容性
          autoprefixer(),
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                atRule.remove();
              }
            }
          }
        ]
      }
    },
    // 预编译
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        '@vueuse/core',
        'echarts',
        'vue-i18n',
        '@vueup/vue-quill',
        'image-conversion',
        'element-plus/es/components/**/css'
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }
            if (matchesNodeModulePackage(id, vueEcosystemPackages)) {
              return 'vendor-vue';
            }
            if (matchesNodeModulePackage(id, elementPlusPackages)) {
              return 'vendor-element-plus';
            }
            if (matchesNodeModulePackage(id, elementPlusDependencyPackages)) {
              return 'vendor-element-plus-deps';
            }
            if (id.includes('echarts')) {
              return 'vendor-echarts';
            }
            if (id.includes('@vueup/vue-quill') || id.includes('/quill/')) {
              return 'vendor-quill';
            }
            if (id.includes('@element-plus/icons-vue')) {
              return 'vendor-element-plus-icons';
            }
            if (id.includes('@highlightjs') || id.includes('highlight.js')) {
              return 'vendor-highlight';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
          }
        }
      }
    }
  };
});
