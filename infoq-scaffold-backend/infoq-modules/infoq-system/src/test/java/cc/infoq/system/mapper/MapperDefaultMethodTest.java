package cc.infoq.system.mapper;

import cc.infoq.system.domain.entity.SysMenu;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@Tag("dev")
class MapperDefaultMethodTest {

    @Test
    @DisplayName("SysMenuMapper.selectMenuTreeAll: should delegate to selectList")
    void sysMenuMapperSelectMenuTreeAllShouldDelegate() {
        SysMenuMapper mapper = mock(SysMenuMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        List<SysMenu> menus = List.of(new SysMenu());
        when(mapper.selectList(anyLambdaQueryWrapper())).thenReturn(menus);

        List<SysMenu> result = mapper.selectMenuTreeAll();

        assertSame(menus, result);
        verify(mapper).selectList(anyLambdaQueryWrapper());
    }

    @Test
    @DisplayName("SysPostMapper.selectPostCount: should delegate to selectCount")
    void sysPostMapperSelectPostCountShouldDelegate() {
        SysPostMapper mapper = mock(SysPostMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.selectCount(anyLambdaQueryWrapper())).thenReturn(2L);

        long result = mapper.selectPostCount(List.of(1L, 2L));

        assertEquals(2L, result);
        verify(mapper).selectCount(anyLambdaQueryWrapper());
    }

    @Test
    @DisplayName("SysRoleMapper.selectRoleCount: should delegate to selectCount")
    void sysRoleMapperSelectRoleCountShouldDelegate() {
        SysRoleMapper mapper = mock(SysRoleMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.selectCount(anyLambdaQueryWrapper())).thenReturn(3L);

        long result = mapper.selectRoleCount(List.of(1L, 2L, 3L));

        assertEquals(3L, result);
        verify(mapper).selectCount(anyLambdaQueryWrapper());
    }

    @Test
    @DisplayName("SysRoleMenuMapper.deleteByMenuIds: should delegate to delete")
    void sysRoleMenuMapperDeleteByMenuIdsShouldDelegate() {
        SysRoleMenuMapper mapper = mock(SysRoleMenuMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.delete(anyLambdaUpdateWrapper())).thenReturn(1);

        int rows = mapper.deleteByMenuIds(List.of(9L));

        assertEquals(1, rows);
        verify(mapper).delete(anyLambdaUpdateWrapper());
    }

    @Test
    @DisplayName("SysUserMapper.countUserById: should delegate to selectCount")
    void sysUserMapperCountUserByIdShouldDelegate() {
        SysUserMapper mapper = mock(SysUserMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.selectCount(anyLambdaQueryWrapper())).thenReturn(1L);

        long count = mapper.countUserById(100L);

        assertEquals(1L, count);
        verify(mapper).selectCount(anyLambdaQueryWrapper());
    }

    private static <T> LambdaQueryWrapper<T> anyLambdaQueryWrapper() {
        return any();
    }

    private static <T> LambdaUpdateWrapper<T> anyLambdaUpdateWrapper() {
        return any();
    }

}
