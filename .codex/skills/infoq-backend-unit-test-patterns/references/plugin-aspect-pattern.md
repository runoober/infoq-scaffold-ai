# Plugin And Aspect Pattern

## Scope

Use for `infoq-plugin-*` utility/aspect classes that can be tested without full runtime wiring.

## Plugin Utility Template

```java
@Tag("dev")
class PageAndTableDataInfoTest {

    @Test
    void pageQueryBuildShouldUseDefaults() {
        PageQuery query = new PageQuery(null, null);
        Page<String> page = query.build();
        assertEquals(PageQuery.DEFAULT_PAGE_NUM, page.getCurrent());
    }
}
```

## Aspect Helper Template

```java
@Tag("dev")
class RepeatSubmitAspectTest {

    private final RepeatSubmitAspect aspect = new RepeatSubmitAspect();

    @Test
    void isFilterObjectShouldReturnTrueForMultipart() {
        MultipartFile file = mock(MultipartFile.class);
        assertTrue(aspect.isFilterObject(file));
    }
}
```

## Checklist

- Prefer pure method coverage (`build`, helper predicates, formatter methods).
- For AOP pointcut logic depending on runtime context, isolate helper methods first.
- Add integration tests only when helper-level tests cannot cover core risk.
