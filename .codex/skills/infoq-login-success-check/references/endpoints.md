# Endpoint Checklist

Login success check passes only when all items succeed:

1. `GET /auth/code`
- HTTP 200
- JSON `code = 200`
- `data.captchaEnabled = false`

2. `POST /auth/login`
- encrypted request preferred
- plain request fallback
- JSON `code = 200`
- response contains `data.access_token` or `data.accessToken`

3. `GET /system/user/getInfo`
- authenticated
- JSON `code = 200`
- response contains `data.user.userName`

4. `GET /system/menu/getRouters`
- authenticated
- JSON `code = 200`
