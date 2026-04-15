# Commands

## Full Validation

```bash
cd infoq-scaffold-frontend-weapp-vue
pnpm run test
pnpm run test:coverage
pnpm run build:weapp:dev
pnpm run build:weapp
```

## Targeted Test

```bash
cd infoq-scaffold-frontend-weapp-vue
pnpm exec vitest --run --config vitest.config.ts tests/core/request.test.ts
```

## Coverage HTML

```bash
cd infoq-scaffold-frontend-weapp-vue
pnpm run test:coverage
```

Coverage report is generated in `coverage/`.

## npm Fallback

If `pnpm` is unavailable:

```bash
cd infoq-scaffold-frontend-weapp-vue
npm run test
npm run test:coverage
npm run build:weapp:dev
npm run build:weapp
```

## Troubleshooting (Project Proven)

```bash
# Symptom: tests/core/request.test.ts hangs or never resolves
# Cause: uni.request / uni.uploadFile mock returns Promise while source waits callback only
# Fix: keep request wrapper compatible with both callback and Promise styles
cd infoq-scaffold-frontend-weapp-vue
pnpm exec vitest --run --config vitest.config.ts tests/core/request.test.ts
```
