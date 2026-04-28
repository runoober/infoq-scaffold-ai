---
title: "小程序手册"
description: "移动端请求封装、AppID、域名与 e2e 入口。"
outline: [2, 3]
---

> [!TIP]
> 内容真值源：[`doc/weapp-handbook.md`](https://github.com/luckykuang/infoq-scaffold-ai/blob/main/doc/weapp-handbook.md)
> 本页由 `infoq-scaffold-docs/scripts/sync-from-root-doc.mjs` 自动同步生成；请优先修改根 `doc/` 后再重新同步。

# 小程序端手册

本仓库同时维护两套移动端实现：

- `infoq-scaffold-frontend-weapp-vue`：uni-app + Vue 3
- `infoq-scaffold-frontend-weapp-react`：Taro + React

两边共享同一套后端接口和业务语义，但构建工具、页面配置文件和运行时封装有所不同。

## 1. 小程序端承担什么角色

当前小程序端不是“展示型 H5”，而是移动管理入口。页面覆盖已经包括：

- 首页
- 管理台
- 登录
- 公告列表 / 详情 / 编辑
- 个人中心 / 编辑资料
- 用户、角色、部门、岗位、菜单、字典
- 在线用户、登录日志、操作日志、缓存概览

## 2. 共通机制

### 2.1 环境变量

两边都会从 `.env.*` 读取这些关键变量：

- `TARO_APP_ID`
- `TARO_APP_BASE_API`
- `TARO_APP_MINI_BASE_API`
- `TARO_APP_API_ORIGIN`
- `TARO_APP_ENCRYPT`
- `TARO_APP_RSA_PUBLIC_KEY`
- `TARO_APP_RSA_PRIVATE_KEY`
- `TARO_APP_CLIENT_ID`

### 2.2 请求封装

两边的移动端请求层都在 `src/api/request.ts`，核心行为包括：

- 自动带 token
- 自动加 `x-client-key`、`x-device-type`
- POST / PUT 的重复提交防护
- 根据加密开关做 RSA + AES 加解密
- 自动识别 H5 和微信小程序环境，决定 base URL

### 2.3 base URL 规则

运行时大致遵循这套规则：

1. H5 环境优先使用 `TARO_APP_BASE_API`。
2. 小程序环境优先使用 `TARO_APP_MINI_BASE_API`。
3. 如果 `TARO_APP_MINI_BASE_API` 不是绝对 URL，则必须额外提供 `TARO_APP_API_ORIGIN`。

如果缺少 `TARO_APP_API_ORIGIN`，构建或运行时会直接显式失败，而不是静默 fallback。

## 3. React 小程序端

### 3.1 关键文件

| 文件 | 作用 |
| --- | --- |
| `config/index.ts` | Taro 构建配置入口，注入编译期环境变量 |
| `src/app.config.ts` | 小程序页面清单 |
| `src/api/request.ts` | 请求封装 |
| `src/utils/auth.ts` | token 工具 |
| `src/utils/navigation.ts` | 页面跳转工具 |

### 3.2 页面清单

`src/app.config.ts` 当前声明了这些页面：

- `pages/home/index`
- `pages/admin/index`
- `pages/login/index`
- `pages/notices/index`
- `pages/notice-detail/index`
- `pages/notice-form/index`
- `pages/profile/index`
- `pages/profile-edit/index`
- `pages/system-users/index`
- `pages/system-users/form/index`
- `pages/system-roles/index`
- `pages/system-roles/form/index`
- `pages/system-depts/index`
- `pages/system-depts/form/index`
- `pages/system-posts/index`
- `pages/system-posts/form/index`
- `pages/system-menus/index`
- `pages/system-menus/form/index`
- `pages/system-dicts/index`
- `pages/system-dicts/data/index`
- `pages/monitor-online/index`
- `pages/monitor-login-info/index`
- `pages/monitor-oper-log/index`
- `pages/monitor-cache/index`

### 3.3 常用命令

```bash
cd infoq-scaffold-frontend-weapp-react
pnpm install
pnpm run test
pnpm run lint
pnpm run build:weapp:dev
pnpm run test:e2e:weapp:smoke
pnpm run verify:local
```

## 4. Vue 小程序端

### 4.1 关键文件

| 文件 | 作用 |
| --- | --- |
| `vite.config.ts` | uni-app / Vite 构建入口，并对环境变量做前置校验 |
| `src/pages.json` | 页面清单 |
| `src/api/request.ts` | 请求封装 |
| `src/composables/use-auth-guard.ts` | 登录态守卫 |
| `src/utils/navigation.ts` | 页面跳转工具 |

### 4.2 页面清单

`src/pages.json` 当前声明的页面和 React 小程序端基本一致：

- 首页、管理台、登录
- 公告列表 / 详情 / 编辑
- 个人中心 / 编辑资料
- 用户、角色、部门、岗位、菜单、字典
- 在线用户、登录日志、操作日志、缓存概览

### 4.3 构建前校验

Vue 小程序端在 `vite.config.ts` 里会校验：

- `TARO_APP_CLIENT_ID` 是否存在
- 当 `TARO_APP_ENCRYPT=true` 时，RSA 公钥 / 私钥是否齐全
- 当 `TARO_APP_MINI_BASE_API` 不是绝对 URL 时，`TARO_APP_API_ORIGIN` 是否存在

缺任意一项会直接报错，不会隐式跳过。

### 4.4 常用命令

```bash
cd infoq-scaffold-frontend-weapp-vue
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build:weapp:dev
pnpm run test:e2e:weapp:smoke
pnpm run verify:local
```

## 5. `build-open-weapp` 脚本到底做了什么

两边最终都会调用 `script/build-open-wechat-devtools.mjs`。这个脚本会：

1. 解析 `--workspace`、`--framework`、`--mode` 和 `--appid`。
2. 从命令行、环境变量或 `.env.<mode>` 读取 `TARO_APP_ID`。
3. 如果 AppID 为空或等于 `touristappid`，直接失败。
4. 先执行构建，再定位生成的 `project.config.json`。
5. 补写项目配置，控制 `urlCheck` 等设置。
6. 调用微信开发者工具 CLI 打开构建产物。

这意味着：

- “能 build 成功”和“能在 DevTools 正常打开”是两件事。
- AppID、开发者工具 CLI 和域名校验是小程序端最常见的三类问题。

## 6. 小程序联调建议

### H5 预览

如果只是调接口和交互逻辑，优先用 H5 能更快发现问题：

- React 小程序：`pnpm run dev:h5` 或 `pnpm run build:h5`
- Vue 小程序：`pnpm run dev:h5` 或 `pnpm run build:h5`

### 微信开发者工具

如果要验证真实小程序环境，再走：

```bash
pnpm --dir infoq-scaffold-frontend-weapp-react build-open:weapp:dev
pnpm --dir infoq-scaffold-frontend-weapp-vue build-open:weapp:dev
```

## 7. 小程序端最常见的问题

### 7.1 AppID 报错

排查顺序：

1. `.env.development` 里的 `TARO_APP_ID`
2. 命令行是否传了 `--appid`
3. 开发者工具 CLI 是否能被脚本发现

### 7.2 合法域名报错

先看：

- `TARO_APP_API_ORIGIN`
- `TARO_APP_MINI_BASE_API`
- 微信开发者工具当前项目的 `urlCheck`
- 目标域名是否真的加进了小程序后台的合法域名

### 7.3 登录失败

先看：

- `TARO_APP_CLIENT_ID`
- `TARO_APP_ENCRYPT`
- RSA 密钥
- `/auth/code`、`/auth/login` 是否正常

## 8. 相关文档

- 快速开始：[`quick-start.md`](/guide/quick-start)
- 管理端手册：[`admin-handbook.md`](/admin/handbook)
- FAQ：[`faq.md`](/guide/faq)
