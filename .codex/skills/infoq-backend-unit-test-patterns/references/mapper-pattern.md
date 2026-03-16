# Mapper Pattern

## Scope

Use for interfaces under:
- `infoq-core/infoq-core-data/src/main/java/cc/infoq/system/mapper`

Apply unit tests only to mapper `default` methods that contain Java-side logic or delegation.
Skip pure SQL declarations in unit tests and cover them in integration tests.

## Template (default delegation)

```java
@Tag("dev")
class MapperDefaultMethodTest {

    @Test
    void shouldDelegateToBaseMapperMethod() {
        SysMenuMapper mapper = mock(SysMenuMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        List<SysMenu> expected = List.of(new SysMenu());
        when(mapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(expected);

        List<SysMenu> actual = mapper.selectMenuTreeAll();

        assertSame(expected, actual);
        verify(mapper).selectList(any(LambdaQueryWrapper.class));
    }
}
```

## Decision Rule

- Write unit tests:
  - `default` method delegates to `selectList/selectVoList/selectVoPage/selectCount/delete/selectVoById`.
  - `default` method has Java aggregation/transform logic that can be verified with mocks.
- Do not write unit tests:
  - Interface methods without body (`abstract`) that are SQL-only mapper contracts.
  - Methods that depend on MyBatis runtime caches and are flaky in plain Mockito context.
  - For SQL-only contracts, use `references/mapper-integration-pattern.md`.

## Project-specific Notes

- Stable `default` methods are already covered in `MapperDefaultMethodTest`.
- Some methods are intentionally moved out of plain unit scope due to MyBatis lambda cache coupling and should be integration-tested.
