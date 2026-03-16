# Plugin Matrix (Quick Reference)

## Fixed Base Plugins

- `infoq-plugin-web`
- `infoq-plugin-security`
- `infoq-plugin-satoken`
- `infoq-plugin-mybatis`
- `infoq-plugin-redis`
- `infoq-plugin-jackson`
- `infoq-plugin-oss` (fixed by project decision)

## Reusable Common Plugins

- `infoq-plugin-translation`
- `infoq-plugin-sensitive`
- `infoq-plugin-excel`
- `infoq-plugin-log`

Usage model:
- Keep plugin implementation reusable.
- Business modules opt in by adding dependency in their own `pom.xml`.

## Configurable (Soft Toggle) Plugins

- `infoq-plugin-encrypt`
- `infoq-plugin-mail`
- `infoq-plugin-sse`
- `infoq-plugin-websocket`
- `infoq-plugin-doc`

Default policy:
- Keep dependency, default disabled via backend config.
- Pair frontend env toggle when client behavior is involved.

## Toggle Keys

Backend:
- `api-decrypt.enabled`
- `mybatis-encryptor.enable`
- `mail.enabled`
- `sse.enabled`
- `websocket.enabled`
- `springdoc.api-docs.enabled`

Frontend:
- `VITE_APP_ENCRYPT`
- `VITE_APP_SSE`
- `VITE_APP_WEBSOCKET`
