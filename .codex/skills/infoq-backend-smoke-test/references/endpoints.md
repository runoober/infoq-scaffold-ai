# Endpoint Checklist

## Public

- `GET /`
  - Expect: HTTP 200, response contains `infoq-scaffold-backend`.
- `GET /auth/code`
  - Expect: JSON `code=200` (`captchaEnabled` can be true or false).

## Login

- `POST /auth/login`
  - Prefer encrypted login payload (`encrypt-key` + AES body).
  - Fallback to plain JSON payload if encrypted path is unavailable.
  - Expect: JSON `code=200` and non-empty token (`access_token` or `accessToken`).

## Protected

- `GET /system/menu/getRouters`
  - Expect: JSON `code=200`.
- `GET /system/menu/roleMenuTreeselect/{roleId}`
  - Expect: JSON `code=200`.
- `GET /system/role/deptTree/{roleId}`
  - Expect: JSON `code=200`.
- `GET /system/dict/data/type/{dictType}`
  - Expect: JSON `code=200`.
- `POST /system/user/export`
  - Expect: HTTP 200 + Excel response (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) + non-empty bytes.
