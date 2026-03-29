# InfoQ Scaffold AI Project Context

## Objective

`infoq-scaffold-ai` is an AI-first full-stack scaffold. The `infoq` prefix is framework branding, not a project-specific customization flag. Keep it when naming shared framework capabilities, skills, and docs.

## Workspace Map

- `infoq-scaffold-backend`: Spring Boot multi-module backend
- `infoq-scaffold-frontend-react`: React 19 + Ant Design admin app
- `infoq-scaffold-frontend-vue`: Vue 3 + Element Plus admin app
- `script`: deployment and environment scripts
- `sql`: bootstrap SQL
- `doc`: reference docs and usage guides

## Architecture Defaults

- Backend flow: `Controller -> Service -> Mapper -> Entity`
- Frontend work must preserve each workspace's local architecture instead of forcing one frontend's style onto the other
- Prefer explicit failure paths over silent fallbacks
- Prefer minimal edits over broad rewrites

## Delivery Defaults

- For any new feature, behavior change, or cross-workspace delivery, create or locate `openspec/changes/<change-id>/` before code edits
- Active change planning lives in `openspec/changes/<change-id>/`
- Current truth specs live in `openspec/specs/`
- Use `proposal.md`, `tasks.md`, and relevant spec deltas as the execution source of truth
- Use one acceptance contract per change
- Validate in this order: main-flow verification -> targeted tests -> lint/build -> diff review

## Tooling Defaults

- Prefer `pnpm` for frontend commands
- Use `mvn` for backend build and tests
- Use `infoq-openspec-delivery` for feature delivery and OpenSpec artifact orchestration
- Use repo skills for repeated validation flows
- Use subagents only when the user explicitly asks for subagents or multi-expert execution
