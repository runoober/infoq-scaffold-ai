package cc.infoq.system.service.impl;

import cc.infoq.common.constant.SystemConstants;
import cc.infoq.common.domain.dto.RoleDTO;
import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.mybatis.core.page.PageQuery;
import cc.infoq.common.mybatis.core.page.TableDataInfo;
import cc.infoq.common.utils.MapstructUtils;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.system.domain.bo.SysRoleBo;
import cc.infoq.system.domain.entity.SysRole;
import cc.infoq.system.domain.entity.SysRoleDept;
import cc.infoq.system.domain.entity.SysRoleMenu;
import cc.infoq.system.domain.entity.SysUserRole;
import cc.infoq.system.domain.vo.SysRoleVo;
import cc.infoq.system.mapper.SysRoleDeptMapper;
import cc.infoq.system.mapper.SysRoleMapper;
import cc.infoq.system.mapper.SysRoleMenuMapper;
import cc.infoq.system.mapper.SysUserRoleMapper;
import cn.dev33.satoken.stp.StpLogic;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.github.linpeilie.Converter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.GenericApplicationContext;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class SysRoleServiceImplTest {

    @Mock
    private SysRoleMapper sysRoleMapper;

    @Mock
    private SysRoleMenuMapper sysRoleMenuMapper;

    @Mock
    private SysUserRoleMapper sysUserRoleMapper;

    @Mock
    private SysRoleDeptMapper sysRoleDeptMapper;

    @BeforeEach
    void setUp() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(Converter.class, () -> mock(Converter.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @Test
    @DisplayName("selectRolePermissionByUserId: should split role keys into permission set")
    void selectRolePermissionByUserIdShouldSplitKeys() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleVo roleA = new SysRoleVo();
        roleA.setRoleKey("system:user:list,system:user:add");
        SysRoleVo roleB = new SysRoleVo();
        roleB.setRoleKey("system:role:list");
        when(sysRoleMapper.selectRolesByUserId(10L)).thenReturn(List.of(roleA, roleB));

        Set<String> perms = service.selectRolePermissionByUserId(10L);

        assertEquals(Set.of("system:user:list", "system:user:add", "system:role:list"), perms);
    }

    @Test
    @DisplayName("checkRoleAllowed: should reject reserved role keys for new role")
    void checkRoleAllowedShouldRejectReservedRoleKey() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(null);
        bo.setRoleKey("admin");

        assertThrows(ServiceException.class, () -> service.checkRoleAllowed(bo));
    }

    @Test
    @DisplayName("checkRoleAllowed: should allow normal custom role key")
    void checkRoleAllowedShouldAllowNormalRoleKey() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(null);
        bo.setRoleKey("ops_manager");

        assertDoesNotThrow(() -> service.checkRoleAllowed(bo));
    }

    @Test
    @DisplayName("selectRolesAuthByUserId: should mark owned roles with flag=true")
    void selectRolesAuthByUserIdShouldMarkOwnedRoles() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleVo owned = new SysRoleVo();
        owned.setRoleId(1L);
        owned.setRoleName("管理员");
        SysRoleVo all1 = new SysRoleVo();
        all1.setRoleId(1L);
        all1.setRoleName("管理员");
        SysRoleVo all2 = new SysRoleVo();
        all2.setRoleId(2L);
        all2.setRoleName("审计员");
        when(sysRoleMapper.selectRolesByUserId(10L)).thenReturn(List.of(owned));
        when(sysRoleMapper.selectRoleList(any())).thenReturn(List.of(all1, all2));

        List<SysRoleVo> list = service.selectRolesAuthByUserId(10L);

        assertEquals(2, list.size());
        assertTrue(list.get(0).isFlag());
        assertFalse(list.get(1).isFlag());
    }

    @Test
    @DisplayName("selectPageRoleList/selectRoleListByUserId: should delegate and map ids")
    void selectPageRoleListAndRoleIdsShouldWork() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleName("系统");
        bo.setRoleKey("system");
        bo.setStatus("0");
        bo.getParams().put("beginTime", "2026-03-01 00:00:00");
        bo.getParams().put("endTime", "2026-03-31 23:59:59");

        SysRoleVo vo = new SysRoleVo();
        vo.setRoleId(5L);
        Page<SysRoleVo> page = new Page<>();
        page.setRecords(List.of(vo));
        page.setTotal(1);
        when(sysRoleMapper.selectPageRoleList(any(), any())).thenReturn(page);
        when(sysRoleMapper.selectRolesByUserId(10L)).thenReturn(List.of(vo));

        TableDataInfo<SysRoleVo> result = service.selectPageRoleList(bo, new PageQuery(10, 1));
        List<Long> ids = service.selectRoleListByUserId(10L);

        assertEquals(1, result.getTotal());
        assertEquals(List.of(5L), ids);
    }

    @Test
    @DisplayName("checkRoleNameUnique/checkRoleKeyUnique: should reflect mapper exists")
    void checkRoleUniqueShouldReflectMapperExists() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(8L);
        bo.setRoleName("测试角色");
        bo.setRoleKey("tester");

        when(sysRoleMapper.exists(any())).thenReturn(true).thenReturn(false);

        assertFalse(service.checkRoleNameUnique(bo));
        assertTrue(service.checkRoleKeyUnique(bo));
    }

    @Test
    @DisplayName("checkRoleDataScope: should throw when part of roles out of scope")
    void checkRoleDataScopeShouldThrowWhenPartOutOfScope() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        when(sysRoleMapper.selectRoleCount(List.of(1L, 2L))).thenReturn(1L);

        ServiceException ex = assertThrows(ServiceException.class, () -> service.checkRoleDataScope(List.of(1L, 2L)));

        assertTrue(ex.getMessage().contains("没有权限访问部分角色数据"));
    }

    @Test
    @DisplayName("deleteRoleById: should clear role-menu/role-dept then delete role")
    void deleteRoleByIdShouldDeleteRelationsAndRole() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        when(sysRoleMapper.deleteById(6L)).thenReturn(1);

        int rows = service.deleteRoleById(6L);

        assertEquals(1, rows);
        verify(sysRoleMenuMapper).delete(any());
        verify(sysRoleDeptMapper).delete(any());
    }

    @Test
    @DisplayName("deleteRoleByIds: should remove role relations then delete roles when unassigned")
    void deleteRoleByIdsShouldDeleteRelationsAndRolesWhenUnassigned() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRole role = new SysRole();
        role.setRoleId(9L);
        role.setRoleName("自定义角色");
        role.setRoleKey("custom_role");
        when(sysRoleMapper.selectRoleCount(List.of(9L))).thenReturn(1L);
        when(sysRoleMapper.selectByIds(List.of(9L))).thenReturn(List.of(role));
        when(sysRoleMapper.selectById(9L)).thenReturn(role);
        when(sysUserRoleMapper.selectCount(any())).thenReturn(0L);
        when(sysRoleMapper.deleteByIds(List.of(9L))).thenReturn(1);

        int rows = service.deleteRoleByIds(List.of(9L));

        assertEquals(1, rows);
        verify(sysRoleMenuMapper).delete(any());
        verify(sysRoleDeptMapper).delete(any());
    }

    @Test
    @DisplayName("selectRoleByIds: should delegate and return rows")
    void selectRoleByIdsShouldDelegateAndReturnRows() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleVo vo = new SysRoleVo();
        vo.setRoleId(6L);
        vo.setRoleName("运维");
        when(sysRoleMapper.selectRoleList(any())).thenReturn(List.of(vo));

        List<SysRoleVo> rows = service.selectRoleByIds(List.of(6L));

        assertEquals(1, rows.size());
        assertEquals(6L, rows.get(0).getRoleId());
    }

    @Test
    @DisplayName("selectRoleNamesByIds: should return empty map for empty input")
    void selectRoleNamesByIdsShouldReturnMappedResult() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        assertEquals(Collections.emptyMap(), service.selectRoleNamesByIds(List.of()));
    }

    @Test
    @DisplayName("updateRoleStatus: should throw when disabling assigned role")
    void updateRoleStatusShouldThrowWhenDisablingAssignedRole() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        when(sysUserRoleMapper.selectCount(any())).thenReturn(1L);

        ServiceException ex = assertThrows(ServiceException.class,
            () -> service.updateRoleStatus(7L, "1"));

        assertTrue(ex.getMessage().contains("角色已分配，不能禁用"));
    }

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("insertRoleMenu(private): should insert menu relations and return inserted count")
    void insertRoleMenuShouldInsertMenuRelations() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(8L);
        bo.setMenuIds(new Long[]{10L, 11L});
        when(sysRoleMenuMapper.insertBatch(any())).thenReturn(true);

        int rows = invokePrivateIntMethod(service, "insertRoleMenu", bo);

        assertEquals(2, rows);
        ArgumentCaptor<List<SysRoleMenu>> captor = ArgumentCaptor.forClass(List.class);
        verify(sysRoleMenuMapper).insertBatch(captor.capture());
        assertEquals(2, captor.getValue().size());
    }

    @Test
    @DisplayName("insertRoleMenu(private): should return one when menu ids empty")
    void insertRoleMenuShouldReturnOneWhenMenuIdsEmpty() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(8L);
        bo.setMenuIds(new Long[]{});

        int rows = invokePrivateIntMethod(service, "insertRoleMenu", bo);

        assertEquals(1, rows);
    }

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("insertRoleDept(private): should insert dept relations and return inserted count")
    void insertRoleDeptShouldInsertDeptRelations() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(8L);
        bo.setDeptIds(new Long[]{20L, 21L});
        when(sysRoleDeptMapper.insertBatch(any())).thenReturn(true);

        int rows = invokePrivateIntMethod(service, "insertRoleDept", bo);

        assertEquals(2, rows);
        ArgumentCaptor<List<SysRoleDept>> captor = ArgumentCaptor.forClass(List.class);
        verify(sysRoleDeptMapper).insertBatch(captor.capture());
        assertEquals(2, captor.getValue().size());
    }

    @Test
    @DisplayName("insertRoleDept(private): should return one when dept ids empty")
    void insertRoleDeptShouldReturnOneWhenDeptIdsEmpty() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(8L);
        bo.setDeptIds(new Long[]{});

        int rows = invokePrivateIntMethod(service, "insertRoleDept", bo);

        assertEquals(1, rows);
    }

    @Test
    @DisplayName("deleteAuthUser: should throw when modifying current user role")
    void deleteAuthUserShouldThrowWhenModifyingCurrentUserRole() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysUserRole userRole = new SysUserRole();
        userRole.setRoleId(2L);
        userRole.setUserId(88L);
        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getUserId).thenReturn(88L);
            ServiceException ex = assertThrows(ServiceException.class, () -> service.deleteAuthUser(userRole));
            assertTrue(ex.getMessage().contains("不允许修改当前用户角色"));
        }
    }

    @Test
    @DisplayName("deleteAuthUsers: should delete and cleanup when rows > 0")
    void deleteAuthUsersShouldDeleteAndCleanup() {
        SysRoleServiceImpl service = spy(new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper));
        doNothing().when(service).cleanOnlineUser(anyList());
        when(sysUserRoleMapper.delete(any())).thenReturn(2);
        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getUserId).thenReturn(1L);
            int rows = service.deleteAuthUsers(9L, new Long[]{2L, 3L});
            assertEquals(2, rows);
            verify(service).cleanOnlineUser(List.of(2L, 3L));
        }
    }

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("insertAuthUsers: should insert role users and cleanup online users")
    void insertAuthUsersShouldInsertAndCleanup() {
        SysRoleServiceImpl service = spy(new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper));
        doNothing().when(service).cleanOnlineUser(anyList());
        when(sysUserRoleMapper.insertBatch(any())).thenReturn(true);
        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getUserId).thenReturn(1L);
            int rows = service.insertAuthUsers(8L, new Long[]{2L, 3L});
            assertEquals(2, rows);
            ArgumentCaptor<List<SysUserRole>> captor = ArgumentCaptor.forClass(List.class);
            verify(sysUserRoleMapper).insertBatch(captor.capture());
            assertEquals(2, captor.getValue().size());
            verify(service).cleanOnlineUser(List.of(2L, 3L));
        }
    }

    @Test
    @DisplayName("insertAuthUsers: should throw when includes current user")
    void insertAuthUsersShouldThrowWhenContainsCurrentUser() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getUserId).thenReturn(3L);
            ServiceException ex = assertThrows(ServiceException.class,
                () -> service.insertAuthUsers(8L, new Long[]{2L, 3L}));
            assertTrue(ex.getMessage().contains("不允许修改当前用户角色"));
        }
    }

    @Test
    @DisplayName("cleanOnlineUserByRole: should return immediately when role has no users")
    void cleanOnlineUserByRoleShouldReturnWhenNoUserBinding() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        when(sysUserRoleMapper.selectCount(any())).thenReturn(0L);

        service.cleanOnlineUserByRole(6L);

        verify(sysUserRoleMapper, times(1)).selectCount(any());
    }

    @Test
    @DisplayName("cleanOnlineUser: should return immediately when no online token exists")
    void cleanOnlineUserShouldReturnWhenNoOnlineTokenExists() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(() -> StpUtil.searchTokenValue("", 0, -1, false)).thenReturn(List.of());

            service.cleanOnlineUser(List.of(1L, 2L));

            stpUtil.verify(() -> StpUtil.searchTokenValue("", 0, -1, false));
        }
    }

    @Test
    @DisplayName("cleanOnlineUserByRole: should logout tokens when user has matched role")
    void cleanOnlineUserByRoleShouldLogoutMatchedRoleUsers() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        when(sysUserRoleMapper.selectCount(any())).thenReturn(1L);

        StpLogic originalStpLogic = StpUtil.stpLogic;
        StpLogic stpLogic = mock(StpLogic.class);
        when(stpLogic.getTokenActiveTimeoutByToken("token-1")).thenReturn(120L);
        StpUtil.setStpLogic(stpLogic);

        LoginUser loginUser = new LoginUser();
        RoleDTO role = new RoleDTO();
        role.setRoleId(6L);
        loginUser.setRoles(List.of(role));
        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            stpUtil.when(() -> StpUtil.searchTokenValue("", 0, -1, false))
                .thenReturn(List.of("satoken:token-1"));
            loginHelper.when(() -> LoginHelper.getLoginUser("token-1")).thenReturn(loginUser);

            service.cleanOnlineUserByRole(6L);

            stpUtil.verify(() -> StpUtil.logoutByTokenValue("token-1"));
        } finally {
            StpUtil.setStpLogic(originalStpLogic);
        }
    }

    @Test
    @DisplayName("cleanOnlineUser: should logout matched user token when token active")
    void cleanOnlineUserShouldLogoutMatchedUserTokenWhenActive() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);

        StpLogic originalStpLogic = StpUtil.stpLogic;
        StpLogic stpLogic = mock(StpLogic.class);
        when(stpLogic.getTokenActiveTimeoutByToken("token-2")).thenReturn(60L);
        StpUtil.setStpLogic(stpLogic);

        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(100L);
        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            stpUtil.when(() -> StpUtil.searchTokenValue("", 0, -1, false))
                .thenReturn(List.of("satoken:token-2"));
            loginHelper.when(() -> LoginHelper.getLoginUser("token-2")).thenReturn(loginUser);

            service.cleanOnlineUser(List.of(100L, 200L));

            stpUtil.verify(() -> StpUtil.logoutByTokenValue("token-2"));
        } finally {
            StpUtil.setStpLogic(originalStpLogic);
        }
    }

    @Test
    @DisplayName("selectRoleById/selectRolesByUserId/checkRoleDataScope(Long): should delegate and validate")
    void selectRoleByIdAndRolesByUserIdAndCheckRoleDataScopeByLongShouldWork() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleVo vo = new SysRoleVo();
        vo.setRoleId(5L);
        vo.setRoleName("运营角色");
        when(sysRoleMapper.selectRoleById(5L)).thenReturn(vo);
        when(sysRoleMapper.selectRolesByUserId(99L)).thenReturn(List.of(vo));
        when(sysRoleMapper.selectRoleCount(List.of(5L))).thenReturn(1L);

        SysRoleVo byId = service.selectRoleById(5L);
        List<SysRoleVo> byUser = service.selectRolesByUserId(99L);
        service.checkRoleDataScope(5L);
        service.checkRoleDataScope((Long) null);

        assertEquals("运营角色", byId.getRoleName());
        assertEquals(1, byUser.size());
        verify(sysRoleMapper).selectRoleCount(List.of(5L));
    }

    @Test
    @DisplayName("insertRole: should convert role, persist and insert role menus")
    void insertRoleShouldConvertPersistAndInsertRoleMenus() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setMenuIds(new Long[]{10L, 11L});
        SysRole role = new SysRole();
        role.setRoleId(66L);
        role.setRoleName("审计角色");
        when(sysRoleMapper.insert(role)).thenReturn(1);
        when(sysRoleMenuMapper.insertBatch(any())).thenReturn(true);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysRole.class)).thenReturn(role);

            int rows = service.insertRole(bo);

            assertEquals(2, rows);
            assertEquals(66L, bo.getRoleId());
            verify(sysRoleMapper).insert(role);
            verify(sysRoleMenuMapper).insertBatch(any());
        }
    }

    @Test
    @DisplayName("updateRole: should throw when disabling a role that has assigned users")
    void updateRoleShouldThrowWhenDisablingAssignedRole() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo bo = new SysRoleBo();
        bo.setRoleId(66L);
        bo.setStatus(SystemConstants.DISABLE);
        bo.setMenuIds(new Long[]{10L});
        SysRole role = new SysRole();
        role.setRoleId(66L);
        role.setStatus(SystemConstants.DISABLE);
        when(sysUserRoleMapper.selectCount(any())).thenReturn(1L);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(bo, SysRole.class)).thenReturn(role);

            assertThrows(ServiceException.class, () -> service.updateRole(bo));

            verify(sysRoleMapper, never()).updateById(any(SysRole.class));
        }
    }

    @Test
    @DisplayName("updateRole/authDataScope: should update role and rebuild related mappings")
    void updateRoleAndAuthDataScopeShouldUpdateRoleAndRebuildMappings() {
        SysRoleServiceImpl service = new SysRoleServiceImpl(sysRoleMapper, sysRoleMenuMapper, sysUserRoleMapper, sysRoleDeptMapper);
        SysRoleBo roleBo = new SysRoleBo();
        roleBo.setRoleId(66L);
        roleBo.setStatus(SystemConstants.NORMAL);
        roleBo.setMenuIds(new Long[]{10L, 11L});
        SysRole role = new SysRole();
        role.setRoleId(66L);
        role.setStatus(SystemConstants.NORMAL);
        when(sysRoleMapper.updateById(role)).thenReturn(1);
        when(sysRoleMenuMapper.insertBatch(any())).thenReturn(true);

        SysRoleBo dataScopeBo = new SysRoleBo();
        dataScopeBo.setRoleId(77L);
        dataScopeBo.setDeptIds(new Long[]{20L, 21L});
        SysRole dataScopeRole = new SysRole();
        dataScopeRole.setRoleId(77L);
        when(sysRoleMapper.updateById(dataScopeRole)).thenReturn(1);
        when(sysRoleDeptMapper.insertBatch(any())).thenReturn(true);

        try (MockedStatic<MapstructUtils> mapstructUtils = mockStatic(MapstructUtils.class)) {
            mapstructUtils.when(() -> MapstructUtils.convert(roleBo, SysRole.class)).thenReturn(role);
            mapstructUtils.when(() -> MapstructUtils.convert(dataScopeBo, SysRole.class)).thenReturn(dataScopeRole);

            int updateRows = service.updateRole(roleBo);
            int scopeRows = service.authDataScope(dataScopeBo);

            assertEquals(2, updateRows);
            assertEquals(2, scopeRows);
            verify(sysRoleMenuMapper).delete(any());
            verify(sysRoleDeptMapper).delete(any());
            verify(sysRoleMenuMapper).insertBatch(any());
            verify(sysRoleDeptMapper).insertBatch(any());
        }
    }

    private static int invokePrivateIntMethod(SysRoleServiceImpl service, String methodName, SysRoleBo bo) {
        try {
            Method method = SysRoleServiceImpl.class.getDeclaredMethod(methodName, SysRoleBo.class);
            method.setAccessible(true);
            return (int) method.invoke(service, bo);
        } catch (InvocationTargetException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new RuntimeException(cause);
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }
}
