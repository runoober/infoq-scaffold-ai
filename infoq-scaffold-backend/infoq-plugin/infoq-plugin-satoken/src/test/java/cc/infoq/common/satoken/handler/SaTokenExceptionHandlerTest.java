package cc.infoq.common.satoken.handler;

import cc.infoq.common.domain.ApiResult;
import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import cn.dev33.satoken.exception.NotRoleException;
import cn.hutool.http.HttpStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Tag("dev")
class SaTokenExceptionHandlerTest {

    @Test
    @DisplayName("handleNotPermissionException: should return 403 result")
    void handleNotPermissionExceptionShouldReturnForbidden() {
        SaTokenExceptionHandler handler = new SaTokenExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/system/user/list");

        ApiResult<Void> result = handler.handleNotPermissionException(
            new NotPermissionException("system:user:list"), request
        );

        assertEquals(HttpStatus.HTTP_FORBIDDEN, result.getCode());
        assertEquals("没有访问权限，请联系管理员授权", result.getMsg());
    }

    @Test
    @DisplayName("handleNotRoleException: should return 403 result")
    void handleNotRoleExceptionShouldReturnForbidden() {
        SaTokenExceptionHandler handler = new SaTokenExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/system/role/list");

        ApiResult<Void> result = handler.handleNotRoleException(
            new NotRoleException("admin"), request
        );

        assertEquals(HttpStatus.HTTP_FORBIDDEN, result.getCode());
        assertEquals("没有访问权限，请联系管理员授权", result.getMsg());
    }

    @Test
    @DisplayName("handleNotLoginException: should return 401 result")
    void handleNotLoginExceptionShouldReturnUnauthorized() {
        SaTokenExceptionHandler handler = new SaTokenExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/system/auth");

        ApiResult<Void> result = handler.handleNotLoginException(
            NotLoginException.newInstance("sys_user", "-100", "未登录", "token"),
            request
        );

        assertEquals(HttpStatus.HTTP_UNAUTHORIZED, result.getCode());
        assertEquals("认证失败，无法访问系统资源", result.getMsg());
    }
}
