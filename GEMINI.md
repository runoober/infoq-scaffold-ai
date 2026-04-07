# GEMINI.md - InfoQ Scaffold AI

This file provides the foundational context and instructions for AI agents working in the `infoq-scaffold-ai` repository. It complements the existing `AGENTS.md` files by providing a high-level overview of the project's structure, technology stack, and operational workflows.

## Project Overview

`infoq-scaffold-ai` is a comprehensive full-stack development scaffold designed for AI-assisted software engineering. It integrates Spring Boot 3, Vue 3 (Element Plus), and React 19 (Ant Design) into a unified workspace.

The project emphasizes an **AI-first workflow** using:
- **`AGENTS.md`**: Hierarchical rules for AI behavior (Root, Backend, Vue, React).
- **`.agents/skills/`**: Scripted Standard Operating Procedures (SOPs) for common tasks.
- **`OpenSpec`**: A specification-driven development process (specs in `openspec/specs/`, changes in `openspec/changes/`).
- **MCP (Model Context Protocol)**: Integrated tools like Playwright, Chrome DevTools, and OpenAI Docs.

## Workspace Structure

- `infoq-scaffold-backend/`: Spring Boot 3.5 multi-module backend.
    - `infoq-admin/`: Entry point and API aggregation.
    - `infoq-modules/`: Business modules (e.g., `infoq-system`).
    - `infoq-plugin/`: Pluggable capabilities (OSS, Mail, Excel, etc.).
    - `infoq-core/`: Core BOM, common utils, and data access.
- `infoq-scaffold-frontend-vue/`: Vue 3.5 + Element Plus 2.x + Vite 6 admin interface.
- `infoq-scaffold-frontend-react/`: React 19 + Ant Design 6 + Vite 7 admin interface.
- `openspec/`: Truth specifications and active change records.
- `.agents/skills/`: Repository-level automation skills and scripts.
- `script/`: Deployment (Docker Compose) and utility scripts.
- `sql/`: Database initialization scripts.

## Core Workflows

### 1. Feature Delivery (OpenSpec)
For any new feature or behavior change:
1.  **Initialize Change**: Create/locate `openspec/changes/<change-id>/`.
2.  **Define Specs**: Update `proposal.md`, `design.md`, and `tasks.md` in the change directory.
3.  **Implement**: Follow the agreed-upon design across backend and frontend(s).
4.  **Validate**: Run verification loops (Main flow -> Tests -> Lint/Build -> Review).
5.  **Archive**: Use `infoq-openspec-delivery` or subagents to finalize the change.

### 2. Building and Running

| Component | Command |
| :--- | :--- |
| **Backend** | `cd infoq-scaffold-backend && mvn spring-boot:run -pl infoq-admin` |
| **Vue Dev** | `cd infoq-scaffold-frontend-vue && pnpm run dev` |
| **React Dev** | `cd infoq-scaffold-frontend-react && pnpm run dev` |
| **Vue Stack** | `bash .agents/skills/infoq-vue-run-dev-stack/scripts/start_vue_dev_stack.sh` |
| **React Stack**| `bash .agents/skills/infoq-react-run-dev-stack/scripts/start_react_dev_stack.sh` |

### 3. Testing and Validation

| Component | Command |
| :--- | :--- |
| **Backend** | `mvn -pl <module> -am -DskipTests=false test` |
| **Vue Tests** | `pnpm run test:unit` |
| **React Tests**| `pnpm run test` |
| **Smoke Tests**| `infoq-backend-smoke-test` or `infoq-login-success-check` |

## Engineering Standards

- **Language & Encoding**: All code and docs MUST use **UTF-8**.
- **Package Manager**: Use **pnpm** for all frontend work.
- **Backend Architecture**: Follow `Controller -> Service -> Mapper -> Entity`.
- **Frontend Consistency**: Respect the local style of each frontend (Vue vs. React); do not force patterns across them.
- **AI Constraints**:
    - **Retrieval First**: Always read local files/specs before relying on general pre-trained knowledge.
    - **Minimal Edits**: Prefer surgical updates over large file rewrites.
    - **Explicit Failure**: Avoid silent fallbacks; errors must be explicit and documented.
- **Security**: Never hardcode secrets. Use parameterized queries. Validate inputs at boundaries.

## Reference Documentation

- [Project README](./README.md)
- [AGENTS.md Rules](./AGENTS.md)
- [Skills Guide](./doc/skills-guide.md)
- [Deployment Guide](./doc/manual-deploy.md)
- [Plugin Catalog](./doc/plugin-catalog.md)

---
*This file is managed by AI agents. Do not modify manually unless correcting factual errors.*
