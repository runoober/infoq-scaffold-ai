# infoq-scaffold-docs

`infoq-scaffold-docs` 是 `infoq-scaffold-ai` 的文档站展示层项目。

## 约定

- 根 `doc/` 是正文真值源。
- 本工作区负责站点导航、主题、同步脚本、构建和部署。
- 在修改正文前，优先修改根 `doc/`，再运行同步命令。
- 站点发布目标域名为 `https://doc.infoq.cc`。

## 常用命令

```bash
pnpm install
pnpm run docs:sync
pnpm run docs:dev
pnpm run docs:check-links
pnpm run build
pnpm run docs:build
pnpm run docs:preview
```
