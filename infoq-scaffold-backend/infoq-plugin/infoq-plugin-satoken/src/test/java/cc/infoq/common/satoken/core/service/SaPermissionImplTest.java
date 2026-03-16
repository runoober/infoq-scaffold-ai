package cc.infoq.common.satoken.core.service;

import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.service.PermissionService;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.SpringUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.context.support.GenericApplicationContext;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@Tag("dev")
class SaPermissionImplTest {

    private final SaPermissionImpl permission = new SaPermissionImpl();

    @Test
    @DisplayName("getPermissionList/getRoleList: should use current login user's permissions when loginId matches")
    void shouldReturnCurrentUserPermissionsWhenLoginIdMatches() {
        LoginUser loginUser = buildLoginUser("sys_user", 100L, Set.of("sys:menu:list"), Set.of("admin"));

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(loginUser);

            List<String> menu = permission.getPermissionList("sys_user:100", "pc");
            List<String> role = permission.getRoleList("sys_user:100", "pc");

            assertIterableEquals(List.of("sys:menu:list"), menu);
            assertIterableEquals(List.of("admin"), role);
        }
    }

    @Test
    @DisplayName("getPermissionList/getRoleList: should query PermissionService when login user is absent")
    void shouldQueryPermissionServiceWhenCurrentLoginUserMissing() {
        PermissionService permissionService = mock(PermissionService.class);
        when(permissionService.getMenuPermission(200L)).thenReturn(Set.of("sys:user:add", "sys:user:edit"));
        when(permissionService.getRolePermission(200L)).thenReturn(Set.of("operator"));
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(PermissionService.class, () -> permissionService);
        context.refresh();
        new SpringUtils().setApplicationContext(context);

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(null);

            List<String> menu = permission.getPermissionList("sys_user:200", "pc");
            List<String> role = permission.getRoleList("sys_user:200", "pc");

            assertEquals(2, menu.size());
            assertEquals("operator", role.get(0));
        } finally {
            context.close();
        }
    }

    @Test
    @DisplayName("getPermissionList/getRoleList: should throw ServiceException when PermissionService is unavailable")
    void shouldThrowWhenPermissionServiceUnavailable() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.refresh();
        new SpringUtils().setApplicationContext(context);

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(null);

            ServiceException permissionEx = assertThrows(ServiceException.class,
                () -> permission.getPermissionList("sys_user:300", "pc"));
            ServiceException roleEx = assertThrows(ServiceException.class,
                () -> permission.getRoleList("sys_user:300", "pc"));

            assertEquals("PermissionService 实现类不存在", permissionEx.getMessage());
            assertEquals("PermissionService 实现类不存在", roleEx.getMessage());
        } finally {
            context.close();
        }
    }

    @Test
    @DisplayName("getPermissionList/getRoleList: should return empty list when current login user has no permissions")
    void shouldReturnEmptyListWhenCurrentUserHasNoPermissionSet() {
        LoginUser loginUser = buildLoginUser("app_user", 101L, null, null);

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(loginUser);

            List<String> menu = permission.getPermissionList("app_user:101", "mobile");
            List<String> role = permission.getRoleList("app_user:101", "mobile");

            assertEquals(0, menu.size());
            assertEquals(0, role.size());
        }
    }

    private static LoginUser buildLoginUser(String userType, Long userId, Set<String> menus, Set<String> roles) {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserType(userType);
        loginUser.setUserId(userId);
        loginUser.setMenuPermission(menus);
        loginUser.setRolePermission(roles);
        return loginUser;
    }
}
