---
title: "MCP Servers"
description: "项目级 MCP server 配置真值与审批策略。"
outline: [2, 3]
---

> [!TIP]
> 内容真值源：[`doc/mcp-servers.md`](https://github.com/luckykuang/infoq-scaffold-ai/blob/main/doc/mcp-servers.md)
> 本页由 `infoq-scaffold-docs/scripts/sync-from-root-doc.mjs` 自动同步生成；请优先修改根 `doc/` 后再重新同步。

# 项目 MCP Server 说明

本文档说明本仓库使用的项目级 MCP server，配置文件位于 `.codex/config.toml`。文档真值以该文件为准。

## 1. 当前配置总览

| Server | 状态 | 传输方式 | 主要用途 | 是否需要额外配置 |
| --- | --- | --- | --- | --- |
| `playwright` | 已启用 | STDIO | 浏览器自动化、页面流程验证、截图、控制台检查 | 否 |
| `openai-docs` | 已启用 | HTTP | 查询 OpenAI / Codex / API 官方文档 | 否 |
| `chrome-devtools` | 已启用 | STDIO | 前端调试、Network/Console/Performance 分析 | 否 |
| `mysql` | 可选，默认禁用，只读 | STDIO | 只读查看本地 / 测试 MySQL 数据库上下文 | 需通过 `.codex/scripts/start_mysql_mcp.sh` 启动，并保证 backend `application-local.yml` 中的数据库配置可解析 |
| `redis` | 可选，默认禁用，只读 | STDIO | 只读查看本地 / 测试 Redis 缓存上下文 | 需通过 `.codex/scripts/start_redis_mcp.sh` 启动，并保证 backend `application-local.yml` 中的 Redis 配置可解析 |

当前仓库级配置里已不再维护 `context7` 和 `github` server；若后续重新引入，应先更新 `.codex/config.toml`，再同步本文件与 `README.md` 及相关 `doc/*.md`。

## 2. 工具暴露、审批与超时策略

下表只记录仓库在 `.codex/config.toml` 里显式声明的工具级约束；未出现的工具表示“仓库配置未单独覆写”，其最终行为以 MCP server 自身和客户端默认策略为准。

| Server | `enabled_tools` 白名单 | 显式 `approval_mode = "approve"` | 超时设置 |
| --- | --- | --- | --- |
| `playwright` | 未配置白名单 | 未配置工具级覆写 | `startup_timeout_sec = 20`，`tool_timeout_sec = 120` |
| `openai-docs` | 未配置白名单 | `search_openai_docs`、`fetch_openai_doc` | `tool_timeout_sec = 120` |
| `chrome-devtools` | 未配置白名单 | `take_snapshot`、`take_screenshot`、`evaluate_script`、`click` | `startup_timeout_sec = 20`，`tool_timeout_sec = 120` |
| `mysql` | `show_databases`、`list_tables`、`describe_table`、`show_create_table`、`show_indexes`、`query`、`select`、`batch_query` | 与白名单一致，上述 8 个工具均要求 `approve` | `startup_timeout_sec = 20`，`tool_timeout_sec = 120` |
| `redis` | `ping`、`info`、`keys`、`get`、`hgetall`、`lrange`、`smembers`、`ttl`、`zrange` | 与白名单一致，上述 9 个工具均要求 `approve` | `startup_timeout_sec = 20`，`tool_timeout_sec = 120` |

补充说明：

- `mysql` / `redis` 除了工具白名单，还通过 `env = { *_READONLY = "true" }` 强制只读运行。
- `mysql` / `redis` 当前虽默认禁用，但一旦启用，暴露范围仍以上表白名单为准，不会开放额外写入类工具。
- `openai-docs` 当前只对“搜索”和“抓取具体文档”显式要求 `approve`；像 `list_openai_docs`、`list_api_endpoints`、`get_openapi_spec` 这类工具没有在仓库配置中单独覆写。
- `chrome-devtools` 当前只对高交互 / 高信息量工具显式要求 `approve`；其余工具未在仓库配置中单独覆写。

## 3. 为什么这些 MCP 对本仓库重要

### `playwright`

用途：

- 驱动浏览器执行真实页面操作
- 用于登录、点击、输入、页面跳转、截图、渲染态提取、控制台错误检查
- 适合做 React/Vue 管理端运行态验证

对应仓库 skill：

- `.agents/skills/infoq-react-runtime-verification/SKILL.md`
- `.agents/skills/infoq-vue-runtime-verification/SKILL.md`
- `.agents/skills/infoq-browser-automation/SKILL.md`

### `openai-docs`

用途：

- 查询 OpenAI 开发者官方文档
- 适用于 OpenAI API、Responses API、Codex、skills、AGENTS、MCP、subagents 等问题

### `chrome-devtools`

用途：

- 直接查看 Network、Console、Performance、DOM、Lighthouse
- 更适合复杂前端问题排查和性能分析

### `mysql` / `redis`

用途：

- 在本仓库里为后端联调提供只读数据库和缓存上下文
- 适合排查接口返回、登录态、权限、缓存和测试数据问题
- 当前默认禁用，避免 fresh checkout 或未配置本地环境时触发无意义的 MCP 启动失败
- 启用前由 `.codex/scripts/start_mysql_mcp.sh` / `.codex/scripts/start_redis_mcp.sh` 从 `infoq-scaffold-backend/infoq-admin/src/main/resources/application-local.yml` 派生连接参数

## 4. 本仓库中的典型使用方式

- React 或 Vue 管理端运行态问题：先用 Playwright 或 `infoq-browser-automation`，需要深入排查再用 `chrome-devtools`
- OpenAI / AGENTS / skills / subagent 问题：优先 `openai-docs`
- 后端接口返回与缓存问题：在已完成本地配置后再启用 `mysql`、`redis`（只读）

## 5. 使用约束

- 不在仓库中存储任何真实 token、账号或本地私有路径
- `mysql` 和 `redis` 只保留只读能力
- 默认启用的仓库级 MCP 只有 `playwright`、`openai-docs`、`chrome-devtools`
- 需要真实浏览器状态时优先复用已存在的 skill，而不是在文档里发散出新的临时流程
- skill 名称与 MCP 文档名称必须跟仓库真实路径保持一致
