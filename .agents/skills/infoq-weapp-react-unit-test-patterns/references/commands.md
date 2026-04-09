# Commands

## Full Validation

```bash
cd infoq-scaffold-frontend-weapp-react
pnpm run test
pnpm run test:coverage
pnpm run build:weapp:dev
pnpm run build:weapp
```

## Targeted Test

```bash
cd infoq-scaffold-frontend-weapp-react
pnpm exec vitest --run --config vitest.config.ts tests/core/request.test.ts
```

## Coverage HTML

```bash
cd infoq-scaffold-frontend-weapp-react
pnpm run test:coverage
```

Coverage report is generated in `coverage/`.

## npm Fallback

If `pnpm` is unavailable:

```bash
cd infoq-scaffold-frontend-weapp-react
npm run test
npm run test:coverage
npm run build:weapp:dev
npm run build:weapp
```
