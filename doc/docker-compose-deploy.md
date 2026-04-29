# Docker Compose 部署说明

本文档以当前仓库的 `script/docker/docker-compose.yml` 为准，只保留现有工程真正可执行的部署入口。
当前文档对应项目基线版本为 `2.1.2`。

如果你需要的是完整部署前检查或非 Docker 的手动部署流程，请先阅读：

- [项目部署前准备](./deploy-prerequisites.md)
- [手动部署说明](./manual-deploy.md)

默认宿主机根目录是 `/infoq`。如果是在 macOS 本机配合 Docker Desktop 验证，建议先设置：

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy
```

然后再执行后续脚本或 `docker compose` 命令。

## 1. 准备宿主机目录

先按 [script/docker/redis/data/README.md](../script/docker/redis/data/README.md) 创建 `${INFOQ_DEPLOY_ROOT:-/infoq}/...` 目录。

最少要有：

```text
/infoq/mysql/data
/infoq/mysql/conf
/infoq/redis/conf
/infoq/redis/data
/infoq/minio/data
/infoq/server/config
/infoq/server/logs
/infoq/server/temp
/infoq/nginx/cert
/infoq/nginx/conf
/infoq/nginx/log
/infoq/vue/logs
/infoq/react/logs
```

其中 `${INFOQ_DEPLOY_ROOT:-/infoq}/server/config/application-prod.yml` 会在首次执行 `bash script/bin/infoq.sh prepare` 时自动生成一份 Docker Compose 默认模板。
`bash script/bin/infoq.sh deploy` 会在启动 MySQL / Redis 后等待依赖就绪，并在检测到 `infoq` 库缺表时自动导入 `sql/infoq_scaffold_2.0.0.sql`。
当前仓库的 Quartz bootstrap `deploy-id` 已固定写入 `infoq-scaffold-backend/infoq-admin/src/main/resources/application-prod.yml`，因此脚本化部署不再依赖额外的环境变量拼接；如果同一版本需要再次发布，请先更新该文件中的值，再重新构建发布包。

## 2. 首次部署后端

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy
bash script/bin/infoq.sh prepare
bash script/bin/infoq.sh deploy
```

常用命令：

```bash
bash script/bin/infoq.sh status
bash script/bin/infoq.sh logs infoq-admin
bash script/bin/infoq.sh restart
bash script/bin/infoq.sh stop
```

后端服务端口：

- `infoq-admin`: `9090`

说明：

- 首次空数据目录启动时，MySQL 容器会自动执行 `sql/infoq_scaffold_2.0.0.sql`
- 如果数据目录已存在，但 `infoq` 库表未初始化，`deploy` / `start` 也会补导一次 SQL
- `deploy` 只负责准备宿主机目录、构建后端、启动依赖服务并拉起 `infoq-admin`，不会临时拼接 Quartz deploy-id
- `start` 与 `restart` 只会复用现有容器环境，不会改动生产配置中的 Quartz deploy-id
- 如果同一版本在同一天需要再次发布，请先更新 `infoq-admin` 生产配置里的 `infoq.quartz.bootstrap.deploy-id`，再重新构建和发布

## 3. 首次部署前端

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy
bash script/bin/deploy-frontend.sh prepare
bash script/bin/deploy-frontend.sh deploy
```

常用命令：

```bash
bash script/bin/deploy-frontend.sh status
bash script/bin/deploy-frontend.sh logs all
bash script/bin/deploy-frontend.sh restart
bash script/bin/deploy-frontend.sh stop
```

前端访问方式：

- 网关入口：`http://host/vue/`
- 网关入口：`http://host/react/`
- Vue 直连端口：`9091`
- React 直连端口：`9092`

前端日志目录：

- Vue：`/infoq/vue/logs`
- React：`/infoq/react/logs`
- 网关 Nginx：`/infoq/nginx/log`

## 4. 日常启动步骤

如果镜像已经构建过，且宿主机目录、数据库数据都还在，只需要执行启动命令，不必重新 `deploy`。

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy

# 先启动后端依赖与 infoq-admin
bash script/bin/infoq.sh start

# 再启动 Vue / React / nginx-web
bash script/bin/deploy-frontend.sh start
```

启动完成后可访问：

- `http://host/vue/`
- `http://host/react/`
- `http://host/prod-api/`

说明：

- `bash script/bin/infoq.sh start` 适用于“启动已有容器”，不会触发新的部署批次。
- 如果你是发布新包、希望生产环境重新执行一次受控 Quartz reconcile，应先更新 `infoq-admin` 生产配置里的 `infoq.quartz.bootstrap.deploy-id`，再重新构建和发布。

## 5. 日常停止步骤

建议先停前端和网关，再停后端与基础服务：

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy

# 先停止 Vue / React / nginx-web
bash script/bin/deploy-frontend.sh stop

# 再停止 infoq-admin / mysql / redis / minio
bash script/bin/infoq.sh stop
```

## 6. 常用运维命令

查看状态：

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy
bash script/bin/infoq.sh status
bash script/bin/deploy-frontend.sh status
```

查看日志：

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy
bash script/bin/infoq.sh logs infoq-admin
bash script/bin/deploy-frontend.sh logs all
```

重启服务：

```bash
export INFOQ_DEPLOY_ROOT=/tmp/infoq-deploy
bash script/bin/infoq.sh restart
bash script/bin/deploy-frontend.sh restart
```

## 7. 如需直接使用 docker compose

```bash
docker compose -f script/docker/docker-compose.yml up -d --build
docker compose -f script/docker/docker-compose.yml ps
docker compose -f script/docker/docker-compose.yml logs -f infoq-admin
```

直接使用 `docker compose` 时，建议保证 `${INFOQ_DEPLOY_ROOT:-/infoq}/mysql/data` 为空目录，以便 MySQL 首次启动时自动执行初始化 SQL。
如果是多节点部署，同一批节点应使用同一份 `infoq-admin` 生产配置；如果同一版本在同一天需要重复部署，请先更新 `infoq.quartz.bootstrap.deploy-id` 再重新构建和发布。
