package cc.infoq.common.satoken.utils;

import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.enums.UserType;
import cn.dev33.satoken.session.SaSession;
import cn.dev33.satoken.stp.StpUtil;
import cn.dev33.satoken.stp.parameter.SaLoginParameter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class LoginHelperTest {

    @Test
    @DisplayName("login/getLoginUser: should write user into token session and read it back")
    void loginAndGetLoginUserShouldWork() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserType("sys_user");
        loginUser.setUserId(100L);
        loginUser.setUsername("admin");
        loginUser.setDeptId(10L);
        loginUser.setDeptName("ops");
        loginUser.setDeptCategory("A");

        SaSession tokenSession = mock(SaSession.class);
        when(tokenSession.get(LoginHelper.LOGIN_USER_KEY)).thenReturn(loginUser);

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(StpUtil::getTokenSession).thenReturn(tokenSession);
            stpUtil.when(() -> StpUtil.getTokenSessionByToken("t1")).thenReturn(tokenSession);

            assertDoesNotThrow(() -> LoginHelper.login(loginUser, new SaLoginParameter()));
            verify(tokenSession).set(LoginHelper.LOGIN_USER_KEY, loginUser);

            assertEquals(loginUser, LoginHelper.getLoginUser());
            assertEquals(loginUser, LoginHelper.getLoginUser("t1"));
        }
    }

    @Test
    @DisplayName("extra/userType/isLogin: should read fields from stp context and handle exceptions")
    void extraAndLoginStatusShouldWork() {
        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.USER_KEY)).thenReturn("100");
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.USER_NAME_KEY)).thenReturn("admin");
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.DEPT_KEY)).thenReturn("200");
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.DEPT_NAME_KEY)).thenReturn("ops");
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.DEPT_CATEGORY_KEY)).thenReturn("A");
            stpUtil.when(StpUtil::getLoginIdAsString).thenReturn("sys_user:100");

            assertEquals(100L, LoginHelper.getUserId());
            assertEquals("100", LoginHelper.getUserIdStr());
            assertEquals("admin", LoginHelper.getUsername());
            assertEquals(200L, LoginHelper.getDeptId());
            assertEquals("ops", LoginHelper.getDeptName());
            assertEquals("A", LoginHelper.getDeptCategory());
            assertEquals(UserType.SYS_USER, LoginHelper.getUserType());
            assertTrue(LoginHelper.isLogin());
        }

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(StpUtil::checkLogin).thenThrow(new RuntimeException("not login"));
            assertFalse(LoginHelper.isLogin());
        }
    }

    @Test
    @DisplayName("superAdmin and null session: should support static helper branches")
    void superAdminAndNullSessionShouldWork() {
        assertTrue(LoginHelper.isSuperAdmin(1L));
        assertFalse(LoginHelper.isSuperAdmin(2L));

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.USER_KEY)).thenReturn("1");
            assertTrue(LoginHelper.isSuperAdmin());
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.USER_KEY)).thenReturn("2");
            assertFalse(LoginHelper.isSuperAdmin());
        }

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(StpUtil::getTokenSession).thenReturn(null);
            stpUtil.when(() -> StpUtil.getTokenSessionByToken("none")).thenReturn(null);
            assertNull(LoginHelper.getLoginUser());
            assertNull(LoginHelper.getLoginUser("none"));
        }
    }
}
