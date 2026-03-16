# 前端构建阶段：使用 Node 20.20.1 构建
FROM node:20.20.1 AS builder

LABEL maintainer="Pontus"

WORKDIR /infoq/react

# 允许在构建镜像时覆盖 Vite 生产环境变量
ARG VITE_APP_CONTEXT_PATH=/
ARG VITE_APP_BASE_API=/prod-api
ARG VITE_APP_PORT=80

ENV VITE_APP_CONTEXT_PATH=${VITE_APP_CONTEXT_PATH} \
    VITE_APP_BASE_API=${VITE_APP_BASE_API} \
    VITE_APP_PORT=${VITE_APP_PORT}

RUN corepack enable pnpm >/dev/null 2>&1 || true

COPY package.json ./

RUN if command -v pnpm >/dev/null 2>&1; then \
      pnpm install --no-frozen-lockfile; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . ./

RUN if command -v pnpm >/dev/null 2>&1; then \
      pnpm run build:prod; \
    else \
      npm run build:prod; \
    fi

# 运行阶段：使用 nginx 1.28.2 构建
FROM nginx:1.28.2

ENV TZ=Asia/Shanghai \
    NGINX_PORT=80

RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone

COPY --from=builder /infoq/react/dist/ /usr/share/nginx/html/

# 默认容器监听 80，部署时可通过 -e NGINX_PORT=8081 -p 8081:8081 覆盖
EXPOSE 80

CMD ["sh", "-c", "printf '%s\n' 'server {' \"    listen ${NGINX_PORT};\" '    server_name _;' '    root /usr/share/nginx/html;' '    index index.html;' '' '    location / {' '        try_files $uri $uri/ /index.html;' '    }' '}' > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
