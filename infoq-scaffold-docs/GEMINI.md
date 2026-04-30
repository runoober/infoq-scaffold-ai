# GEMINI.md
|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any project tasks. Read repository files before relying on framework pretraining data.
|概览:infoq-scaffold-docs 是基于 VitePress 的文档展示层。
|核心原则:根目录 `doc/` 是正文唯一真值源|严禁在本项目直接修改正文。
|同步规则:修改根 `doc/` -> 运行 `pnpm run docs:sync`。
|允许修改:`docs/index.md`|`docs/*/index.md`|`docs/.vitepress/**`|`scripts/**`|`site-map.mjs`|`package.json`。
|验证顺序:`pnpm run docs:sync -> pnpm run docs:check-links -> pnpm run docs:build`。
|命令:install=pnpm install|sync=pnpm run docs:sync|check=pnpm run docs:check-links|dev=pnpm run docs:dev|build=pnpm run build|docs:build=pnpm run docs:build|preview=pnpm run docs:preview。
