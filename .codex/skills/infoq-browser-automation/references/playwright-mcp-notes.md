# Playwright MCP Notes

## Minimal sequence

1. `start`
2. `navigate` to frontend URL
3. `evaluate` to inject token or read page state
4. `navigate` target route
5. `screenshot`
6. `console_messages`
7. `close`

## Expression-only evaluate

In this environment, `evaluate` is wrapped as `() => (yourScript)`. Use expression style.

Recommended:

```text
(a=1,b=2,a+b)
```

Avoid:

```text
(() => { ... })()
```

## Login bypass pattern

When captcha blocks UI automation, use API login to get token and inject:

```text
(localStorage.setItem('Admin-Token','<jwt>'),location.href='/index','ok')
```

## Route accuracy

Do not guess route casing. Pull routes from `/system/menu/getRouters` and navigate with exact path.
