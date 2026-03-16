package cc.infoq.common.websocket.interceptor;

import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.ServletUtils;
import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.stp.StpUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

import static cc.infoq.common.websocket.constant.WebSocketConstants.LOGIN_USER_KEY;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@Tag("dev")
class PlusWebSocketInterceptorTest {

    @Test
    @DisplayName("beforeHandshake: should put login user when client id matches")
    void beforeHandshakeShouldSucceedWhenClientIdMatches() {
        PlusWebSocketInterceptor interceptor = new PlusWebSocketInterceptor();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(8L);
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getHeader(LoginHelper.CLIENT_KEY)).thenReturn("pc");
        Map<String, Object> attributes = new HashMap<>();

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class);
             MockedStatic<ServletUtils> servletUtils = mockStatic(ServletUtils.class);
             MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(loginUser);
            servletUtils.when(ServletUtils::getRequest).thenReturn(servletRequest);
            servletUtils.when(() -> ServletUtils.getParameter(LoginHelper.CLIENT_KEY)).thenReturn(null);
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.CLIENT_KEY)).thenReturn("pc");

            boolean ok = interceptor.beforeHandshake(
                mock(ServerHttpRequest.class), mock(ServerHttpResponse.class), mock(WebSocketHandler.class), attributes);

            assertTrue(ok);
            assertEquals(loginUser, attributes.get(LOGIN_USER_KEY));
        }
    }

    @Test
    @DisplayName("beforeHandshake: should return false when client id mismatched")
    void beforeHandshakeShouldReturnFalseWhenClientIdMismatched() {
        PlusWebSocketInterceptor interceptor = new PlusWebSocketInterceptor();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(9L);
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getHeader(LoginHelper.CLIENT_KEY)).thenReturn("pc-a");
        Map<String, Object> attributes = new HashMap<>();

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class);
             MockedStatic<ServletUtils> servletUtils = mockStatic(ServletUtils.class);
             MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(loginUser);
            servletUtils.when(ServletUtils::getRequest).thenReturn(servletRequest);
            servletUtils.when(() -> ServletUtils.getParameter(LoginHelper.CLIENT_KEY)).thenReturn("pc-b");
            stpUtil.when(() -> StpUtil.getExtra(LoginHelper.CLIENT_KEY)).thenReturn("pc-c");
            stpUtil.when(StpUtil::getLoginType).thenReturn("login");
            stpUtil.when(StpUtil::getTokenValue).thenReturn("tk");

            boolean ok = interceptor.beforeHandshake(
                mock(ServerHttpRequest.class), mock(ServerHttpResponse.class), mock(WebSocketHandler.class), attributes);

            assertFalse(ok);
            assertTrue(attributes.isEmpty());
        }
    }

    @Test
    @DisplayName("beforeHandshake: should return false when login info unavailable")
    void beforeHandshakeShouldReturnFalseWhenLoginUnavailable() {
        PlusWebSocketInterceptor interceptor = new PlusWebSocketInterceptor();
        NotLoginException ex = NotLoginException.newInstance("login", "-100", "not login", "token");

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenThrow(ex);
            boolean ok = interceptor.beforeHandshake(
                mock(ServerHttpRequest.class), mock(ServerHttpResponse.class), mock(WebSocketHandler.class), new HashMap<>());
            assertFalse(ok);
        }
    }

    @Test
    @DisplayName("afterHandshake: should be no-op")
    void afterHandshakeShouldBeNoOp() {
        PlusWebSocketInterceptor interceptor = new PlusWebSocketInterceptor();
        assertDoesNotThrow(() -> interceptor.afterHandshake(
            mock(ServerHttpRequest.class), mock(ServerHttpResponse.class), mock(WebSocketHandler.class), null));
    }
}
