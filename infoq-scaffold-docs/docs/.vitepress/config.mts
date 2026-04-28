import {defineConfig} from 'vitepress';
import {navItems, repoUrl, sidebar} from '../../site-map.mjs';

export default defineConfig({
  lang: 'zh-CN',
  title: 'InfoQ Docs',
  description: 'InfoQ Scaffold AI 项目的工程文档站，内容真值源仍位于仓库根 doc/。',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: [/^\/examples\//, /^\/images\//],
  head: [
    ['meta', { name: 'theme-color', content: '#409eff' }],
    ['meta', { name: 'keywords', content: 'InfoQ, Scaffold, Docs, VitePress, OpenSpec, AGENTS' }]
  ],
  themeConfig: {
    nav: navItems,
    sidebar,
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: repoUrl }
    ],
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdated: {
      text: '最近更新'
    },
    footer: {
      message: '正文真值源位于仓库根 doc/；文档站由 infoq-scaffold-docs 构建。',
      copyright: 'MIT Licensed | InfoQ Scaffold AI'
    }
  }
});
