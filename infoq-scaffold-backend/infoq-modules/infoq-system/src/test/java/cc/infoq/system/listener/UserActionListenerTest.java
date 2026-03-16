package cc.infoq.system.listener;

import cc.infoq.common.constant.CacheConstants;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.common.utils.ServletUtils;
import cc.infoq.common.utils.ip.AddressUtils;
import cc.infoq.common.satoken.utils.LoginHelper;
import cn.dev33.satoken.stp.parameter.SaLoginParameter;
import cc.infoq.system.service.SysLoginService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.redisson.api.RedissonClient;
import org.springframework.context.support.GenericApplicationContext;

import jakarta.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class UserActionListenerTest {

    @BeforeEach
    void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> org.mockito.Mockito.mock(RedissonClient.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @Test
    @DisplayName("no-op callbacks: should execute without exceptions")
    void noOpCallbacksShouldExecuteWithoutExceptions() {
        UserActionListener listener = new UserActionListener(mock(SysLoginService.class));

        assertDoesNotThrow(() -> {
            listener.doDisable("login", 1L, "service", 1, 60L);
            listener.doUntieDisable("login", 1L, "service");
            listener.doOpenSafe("login", "token", "service", 60L);
            listener.doCloseSafe("login", "token", "service");
            listener.doCreateSession("sid");
            listener.doLogoutSession("sid");
            listener.doRenewTimeout("login", 1L, "token", 60L);
        });
    }

    @Test
    @DisplayName("logout/kickout/replaced: should remove token cache key")
    void logoutCallbacksShouldDeleteOnlineTokenCache() {
        UserActionListener listener = new UserActionListener(mock(SysLoginService.class));

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            listener.doLogout("login", 1L, "t1");
            listener.doKickout("login", 1L, "t2");
            listener.doReplaced("login", 1L, "t3");

            redisUtils.verify(() -> RedisUtils.deleteObject(CacheConstants.ONLINE_TOKEN_KEY + "t1"));
            redisUtils.verify(() -> RedisUtils.deleteObject(CacheConstants.ONLINE_TOKEN_KEY + "t2"));
            redisUtils.verify(() -> RedisUtils.deleteObject(CacheConstants.ONLINE_TOKEN_KEY + "t3"));
        }
    }

    @Test
    @DisplayName("doLogin: should record login info for user and publish login event")
    void doLoginShouldRecordLoginInfoForUserAndPublishEvent() {
        SysLoginService loginService = mock(SysLoginService.class);
        UserActionListener listener = new UserActionListener(loginService);
        SaLoginParameter parameter = new SaLoginParameter();
        parameter.setDeviceType("pc");
        parameter.setTimeout(120L);
        parameter.setExtra(LoginHelper.USER_NAME_KEY, "admin");
        parameter.setExtra(LoginHelper.CLIENT_KEY, "admin-client");
        parameter.setExtra(LoginHelper.DEPT_NAME_KEY, "研发中心");
        parameter.setExtra(LoginHelper.USER_KEY, 100L);

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("User-Agent"))
            .thenReturn("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");

        try (MockedStatic<ServletUtils> servletUtils = mockStatic(ServletUtils.class);
             MockedStatic<AddressUtils> addressUtils = mockStatic(AddressUtils.class);
             MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            servletUtils.when(ServletUtils::getRequest).thenReturn(request);
            servletUtils.when(ServletUtils::getClientIP).thenReturn("127.0.0.1");
            addressUtils.when(() -> AddressUtils.getRealAddressByIP("127.0.0.1")).thenReturn("内网IP");

            listener.doLogin("login", 100L, "token-abc", parameter);

            verify(loginService).recordLoginInfo(100L, "127.0.0.1");
            redisUtils.verify(() -> RedisUtils.setCacheObject(org.mockito.ArgumentMatchers.eq(CacheConstants.ONLINE_TOKEN_KEY + "token-abc"),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()));
        }
    }
}
