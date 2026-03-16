# Service Pattern

## Scope

Use for `cc.infoq.system.service.impl.*` classes when logic is mapper/service collaboration with branch conditions.

## Template

```java
@ExtendWith(MockitoExtension.class)
@Tag("dev")
class XxxServiceImplTest {

    @Mock
    private XxxMapper xxxMapper;

    @InjectMocks
    private XxxServiceImpl service;

    @Test
    void shouldReturnNullWhenMissing() {
        when(xxxMapper.selectVoById(1L)).thenReturn(null);
        assertNull(service.queryById(1L));
    }

    @Test
    void shouldHandleBranch() {
        when(xxxMapper.exists(any())).thenReturn(true);
        assertFalse(service.checkUnique(...));
    }
}
```

## Checklist

- Cover at least one normal branch and one exception/empty branch.
- Verify mapper interaction only when behavior depends on it.
- If a test reveals `NullPointerException` or branch leakage, patch service code and rerun.
