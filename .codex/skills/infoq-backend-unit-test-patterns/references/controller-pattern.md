# Controller Pattern

## Scope

Use for `cc.infoq.system.controller.*` classes when testing `ApiResult` mapping and guard clauses.

## Template

```java
@ExtendWith(MockitoExtension.class)
@Tag("dev")
class XxxControllerTest {

    @Mock
    private XxxService service;

    @InjectMocks
    private XxxController controller;

    @Test
    void addShouldFailWhenDuplicate() {
        when(service.checkUnique(any())).thenReturn(false);
        ApiResult<Void> result = controller.add(bo);
        assertEquals(ApiResult.FAIL, result.getCode());
    }

    @Test
    void addShouldSucceed() {
        when(service.checkUnique(any())).thenReturn(true);
        when(service.insertByBo(any())).thenReturn(true);
        ApiResult<Void> result = controller.add(bo);
        assertEquals(ApiResult.SUCCESS, result.getCode());
    }
}
```

## Checklist

- Assert both `code` and critical `msg` fragments for failure cases.
- Cover at least one success and one failure route per endpoint family.
- Keep controller tests lightweight (no full `@SpringBootTest` by default).
