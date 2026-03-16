package cc.infoq.system.mapper;

import cc.infoq.common.utils.SpringUtils;
import cc.infoq.system.domain.entity.SysDept;
import cc.infoq.system.domain.entity.SysMenu;
import cc.infoq.system.domain.entity.SysUserRole;
import cc.infoq.system.domain.vo.SysDeptVo;
import cc.infoq.system.domain.vo.SysPostVo;
import cc.infoq.system.domain.vo.SysRoleVo;
import cc.infoq.system.domain.vo.SysUserVo;
import com.baomidou.dynamic.datasource.DynamicRoutingDataSource;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;
import static org.mockito.Answers.CALLS_REAL_METHODS;

@Tag("dev")
class MapperDefaultMethodTest {

    @Test
    @DisplayName("SysMenuMapper.selectMenuTreeAll: should delegate to selectList")
    void sysMenuMapperSelectMenuTreeAllShouldDelegate() {
        SysMenuMapper mapper = mock(SysMenuMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        List<SysMenu> menus = List.of(new SysMenu());
        when(mapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(menus);

        List<SysMenu> result = mapper.selectMenuTreeAll();

        assertSame(menus, result);
        verify(mapper).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    @DisplayName("SysPostMapper.selectPostCount: should delegate to selectCount")
    void sysPostMapperSelectPostCountShouldDelegate() {
        SysPostMapper mapper = mock(SysPostMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

        long result = mapper.selectPostCount(List.of(1L, 2L));

        assertEquals(2L, result);
        verify(mapper).selectCount(any(LambdaQueryWrapper.class));
    }

    @Test
    @DisplayName("SysPostMapper.selectPagePostList/selectPostList: should delegate to vo page/list")
    void sysPostMapperDefaultListMethodsShouldDelegate() {
        SysPostMapper mapper = mock(SysPostMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        Page<SysPostVo> pageResult = new Page<>();
        List<SysPostVo> listResult = List.of(new SysPostVo());
        Page<?> pageArg = new Page<>(1, 10);
        Wrapper<?> wrapper = mock(Wrapper.class);

        doReturn(pageResult).when(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
        doReturn(listResult).when(mapper).selectVoList(any(Wrapper.class));

        Page<SysPostVo> page = mapper.selectPagePostList((Page) pageArg, (Wrapper) wrapper);
        List<SysPostVo> list = mapper.selectPostList((Wrapper) wrapper);

        assertSame(pageResult, page);
        assertSame(listResult, list);
        verify(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
        verify(mapper).selectVoList(any(Wrapper.class));
    }

    @Test
    @DisplayName("SysRoleMapper.selectRoleCount/selectRoleById: should delegate to base mapper methods")
    void sysRoleMapperDefaultMethodsShouldDelegate() {
        SysRoleMapper mapper = mock(SysRoleMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        SysRoleVo vo = new SysRoleVo();
        when(mapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(3L);
        doReturn(vo).when(mapper).selectVoById(9L);

        long count = mapper.selectRoleCount(List.of(1L, 2L, 3L));
        SysRoleVo roleVo = mapper.selectRoleById(9L);

        assertEquals(3L, count);
        assertSame(vo, roleVo);
        verify(mapper).selectCount(any(LambdaQueryWrapper.class));
        verify(mapper).selectVoById(9L);
    }

    @Test
    @DisplayName("SysRoleMenuMapper.deleteByMenuIds: should delegate to delete")
    void sysRoleMenuMapperDeleteByMenuIdsShouldDelegate() {
        SysRoleMenuMapper mapper = mock(SysRoleMenuMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.delete(any(LambdaUpdateWrapper.class))).thenReturn(1);

        int rows = mapper.deleteByMenuIds(List.of(9L));

        assertEquals(1, rows);
        verify(mapper).delete(any(LambdaUpdateWrapper.class));
    }

    @Test
    @DisplayName("SysUserMapper.countUserById/selectUserList: should delegate to selectCount/selectVoList")
    void sysUserMapperDefaultMethodsShouldDelegate() {
        SysUserMapper mapper = mock(SysUserMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        List<SysUserVo> users = List.of(new SysUserVo());
        Wrapper<?> wrapper = mock(Wrapper.class);
        when(mapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        when(mapper.selectVoList(any(Wrapper.class))).thenReturn(users);

        long count = mapper.countUserById(100L);
        List<SysUserVo> result = mapper.selectUserList((Wrapper) wrapper);

        assertEquals(1L, count);
        assertSame(users, result);
        verify(mapper).selectCount(any(LambdaQueryWrapper.class));
        verify(mapper).selectVoList(any(Wrapper.class));
    }

    @Test
    @DisplayName("SysUserMapper.selectPageUserList: should delegate to selectVoPage")
    void sysUserMapperSelectPageUserListShouldDelegate() {
        SysUserMapper mapper = mock(SysUserMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        Page<SysUserVo> pageResult = new Page<>();
        Page<?> pageArg = new Page<>(1, 20);
        Wrapper<?> wrapper = mock(Wrapper.class);
        doReturn(pageResult).when(mapper).selectVoPage(any(Page.class), any(Wrapper.class));

        Page<SysUserVo> page = mapper.selectPageUserList((Page) pageArg, (Wrapper) wrapper);

        assertSame(pageResult, page);
        verify(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
    }

    @Test
    @DisplayName("SysDeptMapper default methods: should delegate and merge child ids")
    void sysDeptMapperDefaultMethodsShouldWork() {
        prepareDataBaseHelperContext();
        TableInfoHelper.remove(SysDept.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new Configuration(), "test"), SysDept.class);
        SysDeptMapper mapper = mock(SysDeptMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        SysDept child1 = new SysDept();
        child1.setDeptId(10L);
        SysDept child2 = new SysDept();
        child2.setDeptId(20L);
        List<SysDeptVo> deptVos = List.of(new SysDeptVo());
        Page<SysDeptVo> pageResult = new Page<>();
        Wrapper<?> wrapper = mock(Wrapper.class);
        doReturn(deptVos).when(mapper).selectVoList(any(Wrapper.class));
        doReturn(pageResult).when(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
        when(mapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);
        doReturn(List.of(child1, child2)).when(mapper).selectList(any(LambdaQueryWrapper.class));

        List<SysDeptVo> list = mapper.selectDeptList((Wrapper) wrapper);
        Page<SysDeptVo> page = mapper.selectPageDeptList((Page) new Page<>(1, 10), (Wrapper) wrapper);
        long count = mapper.countDeptById(1L);
        List<SysDept> children = mapper.selectListByParentId(1L);
        List<Long> deptIds = mapper.selectDeptAndChildById(1L);

        assertSame(deptVos, list);
        assertSame(pageResult, page);
        assertEquals(2L, count);
        assertEquals(2, children.size());
        assertEquals(List.of(10L, 20L, 1L), deptIds);
        verify(mapper).selectVoList(any(Wrapper.class));
        verify(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
        verify(mapper).selectCount(any(LambdaQueryWrapper.class));
        verify(mapper, times(2)).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    @DisplayName("SysRoleMapper.selectPageRoleList/selectRoleList: should delegate to vo page/list")
    void sysRoleMapperListMethodsShouldDelegate() {
        SysRoleMapper mapper = mock(SysRoleMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        Page<SysRoleVo> pageResult = new Page<>();
        List<SysRoleVo> listResult = List.of(new SysRoleVo());
        Wrapper<?> wrapper = mock(Wrapper.class);

        doReturn(pageResult).when(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
        doReturn(listResult).when(mapper).selectVoList(any(Wrapper.class));

        Page<SysRoleVo> page = mapper.selectPageRoleList((Page) new Page<>(1, 10), (Wrapper) wrapper);
        List<SysRoleVo> list = mapper.selectRoleList((Wrapper) wrapper);

        assertSame(pageResult, page);
        assertSame(listResult, list);
        verify(mapper).selectVoPage(any(Page.class), any(Wrapper.class));
        verify(mapper).selectVoList(any(Wrapper.class));
    }

    @Test
    @DisplayName("SysUserRoleMapper.selectUserIdsByRoleId: should delegate to selectObjs")
    void sysUserRoleMapperDefaultMethodShouldDelegate() {
        TableInfoHelper.remove(SysUserRole.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new Configuration(), "test"), SysUserRole.class);
        SysUserRoleMapper mapper = mock(SysUserRoleMapper.class, withSettings().defaultAnswer(CALLS_REAL_METHODS));
        when(mapper.selectObjs(any(LambdaQueryWrapper.class))).thenReturn(List.of(1L, 2L));

        List<Long> result = mapper.selectUserIdsByRoleId(9L);

        assertEquals(List.of(1L, 2L), result);
        verify(mapper).selectObjs(any(LambdaQueryWrapper.class));
    }

    private static void prepareDataBaseHelperContext() {
        DynamicRoutingDataSource dynamicRoutingDataSource = mock(DynamicRoutingDataSource.class);
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        DatabaseMetaData databaseMetaData = mock(DatabaseMetaData.class);

        try {
            when(dynamicRoutingDataSource.determineDataSource()).thenReturn(dataSource);
            when(dataSource.getConnection()).thenReturn(connection);
            when(connection.getMetaData()).thenReturn(databaseMetaData);
            when(databaseMetaData.getDatabaseProductName()).thenReturn("MySQL");
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }

        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(DynamicRoutingDataSource.class, () -> dynamicRoutingDataSource);
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }
}
