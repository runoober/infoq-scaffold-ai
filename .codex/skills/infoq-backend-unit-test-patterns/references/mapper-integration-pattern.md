# Mapper XML Integration Pattern

## Scope

Use for declaration-only mapper methods under:
- `infoq-core/infoq-core-data/src/main/java/cc/infoq/system/mapper`

These methods are SQL contracts backed by XML and should be validated with integration tests, not Mockito-only unit tests.

## Dependencies

Add test dependencies in `infoq-modules/infoq-system/pom.xml`:

```xml
<dependency>
  <groupId>com.h2database</groupId>
  <artifactId>h2</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.mybatis.spring.boot</groupId>
  <artifactId>mybatis-spring-boot-starter</artifactId>
  <version>3.0.4</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.mybatis.spring.boot</groupId>
  <artifactId>mybatis-spring-boot-starter-test</artifactId>
  <version>3.0.4</version>
  <scope>test</scope>
</dependency>
```

## Template

```java
// src/test/java/cc/infoq/system/mapper/support/MapperXmlIT.java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Tag("dev")
@MybatisTest
@Import(MapperXmlIT.MapperXmlScanConfig.class)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:mapper_it;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "mybatis.mapper-locations=classpath*:mapper/system/*Mapper.xml",
    "mybatis.configuration.map-underscore-to-camel-case=true",
    "mybatis-plus.mapper-locations=classpath*:mapper/system/*Mapper.xml",
    "mybatis-plus.configuration.map-underscore-to-camel-case=true"
})
@Sql(
    scripts = {
        "classpath:sql/mapper-it/schema.sql",
        "classpath:sql/mapper-it/data.sql"
    },
    executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD
)
public @interface MapperXmlIT {

    @TestConfiguration(proxyBeanMethods = false)
    @MapperScan("cc.infoq.system.mapper")
    class MapperXmlScanConfig {
    }
}
```

```java
// src/test/java/cc/infoq/system/mapper/xml/SysDictDataMapperXmlIntegrationTest.java
@MapperXmlIT
class SysDictDataMapperXmlIntegrationTest {

    @Autowired
    private SysDictDataMapper sysDictDataMapper;

    @Test
    void selectDictDataByTypeShouldReturnSortedRows() {
        List<SysDictDataVo> rows = sysDictDataMapper.selectDictDataByType("sys_yes_no");

        assertThat(rows).hasSize(2);
        assertThat(rows).extracting(SysDictDataVo::getDictValue).containsExactly("Y", "N");
    }
}
```

## Naming And Split Rules

- Put mapper XML integration tests under `src/test/java/cc/infoq/system/mapper/xml`.
- Use one class per mapper contract: `Sys<Domain>MapperXmlIntegrationTest`.
- Keep assertions focused on that mapper (or a tightly coupled mapper pair in one class if a query spans both mappers).

## SQL Fixture Rules

- Create isolated test scripts:
  - `src/test/resources/sql/<suite>/schema.sql`
  - `src/test/resources/sql/<suite>/data.sql`
- Keep only required tables/columns for target queries.
- Seed only necessary rows to prove filter, sort, join, and null/empty branch behavior.
- In this project, default fixture path is `sql/mapper-it/{schema.sql,data.sql}` via `@MapperXmlIT`; switch to dedicated suite fixtures only when assertions conflict.

## Page Return Methods

For XML statements whose mapper signature returns `Page<T>`, `@MybatisTest` slice may miss MyBatis-Plus pagination runtime behavior.
In this case, verify SQL semantics via `SqlSessionTemplate`:

```java
List<SysUserVo> rows = sqlSessionTemplate.selectList(
    "cc.infoq.system.mapper.SysUserMapper.selectAllocatedList",
    Map.of("ew", wrapper)
);
```

This validates XML SQL and wrapper behavior without binding to runtime pagination interceptors.
