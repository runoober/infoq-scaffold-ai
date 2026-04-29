---
name: infoq-backend-unit-test-patterns
description: 为 infoq-scaffold-backend 项目构建可重复、可确定的后端测试，复用 service/controller/mapper-default/mapper-xml 集成/plugin/aspect 等模式，包含 @Tag(dev) 策略、mock 边界、@MybatisTest+H2 基线、mapper default 方法策略与 Maven 执行命令。适用于后端单测、覆盖率回补、分支回归、Mapper XML 校验、缺陷复现实验与 test-first 重构。
---

# Infoq 后端单测模式

## 概览

使用此技能在 `infoq-scaffold-backend/infoq-modules/infoq-system/src/test/java` 下补充稳定单测，除非必要不要引入完整运行时依赖。
对选定类型先跑通一个最小验证用例，再批量扩展到同类。

## 工作流程

1. 将目标归类为支持类型之一：`service`、`controller`、`mapper-default`、`mapper-xml-integration`、`plugin`、`aspect`。
2. 从 `references/` 复制对应模式，并替换包名/类名/方法名。
3. 类上添加 `@Tag("dev")`，因为 Maven Surefire 会按 `profiles.active` 过滤。
4. 对 `mapper-xml-integration`，优先使用共享组合注解 `cc.infoq.system.mapper.support.MapperXmlIT`，并按 mapper 类拆分断言（`mapper/xml` 下 `Sys*MapperXmlIntegrationTest`）。
5. 对 controller/service 大规模回补，先扫描类级缺口：

```bash
python3 - <<'PY'
import pathlib
root = pathlib.Path('infoq-modules/infoq-system/src/main/java/cc/infoq/system')
test_root = pathlib.Path('infoq-modules/infoq-system/src/test/java/cc/infoq/system')
tests = {p.stem[:-4] for p in test_root.rglob('*Test.java') if p.stem.endswith('Test')}
for rel in ['controller', 'service/impl']:
    classes = [p.stem for p in (root / rel).rglob('*.java')]
    missing = sorted([c for c in classes if c not in tests])
    print(rel, 'missing=', len(missing))
    if missing:
        print('  ' + ', '.join(missing))
PY
```

6. 先执行定向测试：

```bash
mvn -pl infoq-modules/infoq-system -am \
  -DskipTests=false \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=<ClassNameTest> test
```

7. 若测试暴露真实缺陷，立即修复产品代码并重跑。
8. 当前类型验证通过后，再按同类型批量补测并重跑定向套件。
9. 收尾前运行模块级全量验证与冒烟测试。

## 类型选择规则

- `service`：`service/impl` 下类，关注 mapper/service 协作与分支逻辑。
- `controller`：`controller` 下类，关注请求/结果映射与防护逻辑。
- `mapper-default`：仅针对包含 Java `default` 方法的 mapper 接口。
  mapper 接口中的纯 SQL 声明方法不属于单测目标；请迁移到 DB + MyBatis XML 的集成测试中验证。
- `mapper-xml-integration`：由 XML SQL 驱动的纯 mapper 声明方法（`abstract`）。
  使用 `@MapperXmlIT`（`@MybatisTest` + H2 + SQL fixtures），并按每个 mapper 一类测试来校验 SQL 语义。
- `plugin`：`infoq-plugin-*` 下工具类（如 `PageQuery`、`TableDataInfo`）。
- `aspect`：可在不完整代理装配情况下测试纯辅助方法的 AOP 类。

## 护栏

- 单测必须可重复、可确定；对 mapper/外部依赖使用 mock。
- 除非类初始化必须依赖 Spring 上下文，否则避免在单测中直接做运行时集成。
- 优先覆盖业务分支，不要只测 happy-path。
- 测试不得依赖环境凭据和外网。
- Redis/Redisson 相关修复必须保持 OSS 兼容；禁止通过测试默许 `getLocalCachedMapCache`、依赖 `keepAliveTime` 的 `RRateLimiter` 重载等 PRO-only API。
- 若修复的是缓存、限流、Sa-Token 或登录链路，至少补一个测试直接证明不再调用 PRO-only API。
- 禁止为“让测试/构建通过”而削弱断言、放宽 mock、压警告、抬阈值或伪造成功路径；应修复真实问题，或停止并记录经用户确认的例外。
- 若确认某段源码或测试改动错误，必须先立即回退错误代码再继续，不得留下死代码/不可达代码/无调用代码。
- `@Tag` 策略默认使用 `@Tag("dev")`，与当前 Surefire groups 对齐。
- 本项目纯单测默认避免 `@SpringBootTest`，除非在测试范围内明确提供了 `@SpringBootConfiguration`。
- 对 mapper XML 集成测试：
  - 优先复用共享 `@MapperXmlIT`，并将 SQL fixtures 放在 `src/test/resources/sql/...`。
  - 数据保持最小且可重复；默认使用共享 `mapper_it` fixtures，仅在跨 mapper 耦合导致断言不稳时再隔离 suite fixtures。
  - 通过测试属性（`mybatis.mapper-locations`）显式加载 XML 绑定。
  - 若 mapper 方法签名返回 `Page<T>`，且 `@MybatisTest` 切片中缺少分页插件，可通过 `SqlSessionTemplate.selectList(statementId, params)` 执行语句来验证 SQL 语义。
- 注意静态初始化陷阱：
  - `JsonUtils`、`RedisUtils`、`MapstructUtils` 可能间接拉起 Spring/bean 状态。
  - 若静态工具与运行时上下文耦合，鉴权策略测试优先做分支级验证（可含私有方法反射），不要强行走完整 `login` 路径。
  - 对字典/service 测试，除非确需集成装配，否则优先选择能绕开 mapper-struct 静态转换器的业务方法。

## Mapper 边界

- 必测单测：
  - 可在 mock 条件下运行、且包含 Java 侧分支/聚合/委派逻辑的 mapper `default` 方法。
- 可选/可跳过单测：
  - 纯 mapper 声明方法（XML/注解 SQL 映射的 `abstract` 方法）。
  - 这类方法更适合通过集成测试覆盖（`@MybatisTest` 或模块级集成测试）。
- 纯单测上下文中已知不稳定：
  - 未引入 MyBatis 运行时时，强制触发 lambda 列缓存解析的方法。
  - 本仓示例：`SysDeptMapper.selectDeptAndChildById`（触发内部 lambda query 路径时）、`SysUserRoleMapper.selectUserIdsByRoleId`。
  - 处理策略：只测试稳定委派默认方法，或将不稳定方法迁移到集成测试。

## 完成标准

以下检查必须全部通过：

```bash
mvn -pl infoq-modules/infoq-system -am -DskipTests=false test
mvn -pl infoq-modules/infoq-system -am clean package -P dev -DskipTests=false
bash .agents/skills/infoq-backend-smoke-test/scripts/run_smoke.sh
```

## 参考

- Service 测试模式：`references/service-pattern.md`
- Controller 测试模式：`references/controller-pattern.md`
- Mapper 测试模式：`references/mapper-pattern.md`
- Mapper XML 集成测试模式：`references/mapper-integration-pattern.md`
- Plugin/Aspect 测试模式：`references/plugin-aspect-pattern.md`
- 命令速查：`references/commands.md`

仅加载当前类型所需的参考文件，保持上下文精简。
