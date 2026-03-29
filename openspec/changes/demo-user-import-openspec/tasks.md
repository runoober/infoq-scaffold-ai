# Tasks: demo-user-import-openspec

## Planning

- [x] Seed a complete OpenSpec demo change for the user-import capability
- [x] Capture the acceptance contract and demo-only scope in `proposal.md`
- [x] Add a user-import spec delta under `specs/user-management/spec.md`

## Backend

- [x] Confirm backend reference path: `infoq-scaffold-backend/infoq-modules/infoq-system/src/main/java/cc/infoq/system/controller/system/SysUserController.java`
- [x] Record existing API references for demo purposes:
  - `POST /system/user/importData`
  - `POST /system/user/importTemplate`
- [x] State that this demo does not modify backend code
- [ ] For a real implementation change, run targeted backend tests and implement any required adjustments

## React

- [x] Confirm React reference path: `infoq-scaffold-frontend-react/src/pages/system/user/index.tsx`
- [x] Record that the user import dialog, template download, and `updateSupport` behavior remain the reference UX
- [x] State that this demo does not modify React code
- [ ] For a real implementation change, run `pnpm test` and `pnpm build` after code changes

## Vue

- [x] Confirm Vue reference path: `infoq-scaffold-frontend-vue/src/views/system/user/index.vue`
- [x] Record that the current `el-upload` dialog flow remains the reference UX
- [x] State that this demo does not modify Vue code
- [ ] For a real implementation change, run `pnpm test:unit` and `pnpm run build:prod` after code changes

## Materials

- [x] Capture mock data, placeholder copy, icon guidance, and feedback copy in `materials.md`
- [x] State which placeholders must be replaced before any production implementation

## Verification

- [x] Define main-flow verification expectations:
  - template download
  - file upload
  - `updateSupport` toggle
  - success and failure feedback
- [x] Define targeted test commands:
  - `cd infoq-scaffold-backend && mvn test -pl infoq-modules/infoq-system -DskipTests=false`
  - `cd infoq-scaffold-frontend-react && pnpm test && pnpm build`
  - `cd infoq-scaffold-frontend-vue && pnpm test:unit && pnpm run build:prod`
- [x] Record that this demo intentionally does not execute the above checks
- [x] Record residual blockers in `review.md` so the change is not mistaken for an archive-ready implementation
