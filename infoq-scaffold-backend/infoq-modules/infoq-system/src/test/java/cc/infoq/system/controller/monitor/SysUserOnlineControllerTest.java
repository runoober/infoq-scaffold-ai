package cc.infoq.system.controller.monitor;

import cc.infoq.common.constant.CacheConstants;
import cc.infoq.common.domain.ApiResult;
import cc.infoq.common.domain.dto.UserOnlineDTO;
import cc.infoq.common.mybatis.core.page.TableDataInfo;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.system.domain.entity.SysUserOnline;
import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.stp.StpLogic;
import cn.dev33.satoken.stp.StpUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.redisson.api.RedissonClient;
import org.springframework.context.support.GenericApplicationContext;
import org.mockito.MockedStatic;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

@Tag("dev")
class SysUserOnlineControllerTest {

    private GenericApplicationContext context;

    private StpLogic originalStpLogic;

    @BeforeEach
    void initSpringContext() {
        originalStpLogic = StpUtil.stpLogic;
        context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> mock(RedissonClient.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @AfterEach
    void tearDown() {
        if (context != null) {
            context.close();
        }
        StpUtil.setStpLogic(originalStpLogic);
    }

    @Test
    @DisplayName("forceLogout: should swallow NotLoginException and still return success")
    void forceLogoutShouldSwallowNotLoginException() {
        SysUserOnlineController controller = new SysUserOnlineController();

        try (MockedStatic<StpUtil> mocked = mockStatic(StpUtil.class)) {
            mocked.when(() -> StpUtil.kickoutByTokenValue("token"))
                .thenThrow(new NotLoginException("KICK_OUT", "default", "ignored"));

            ApiResult<Void> result = controller.forceLogout("token");

            assertEquals(ApiResult.SUCCESS, result.getCode());
        }
    }

    @Test
    @DisplayName("remove: should kick out token when token belongs to current login")
    void removeShouldKickoutMatchedToken() {
        SysUserOnlineController controller = new SysUserOnlineController();

        try (MockedStatic<StpUtil> mocked = mockStatic(StpUtil.class)) {
            mocked.when(StpUtil::getLoginIdAsString).thenReturn("100");
            mocked.when(() -> StpUtil.getTokenValueListByLoginId("100")).thenReturn(List.of("ta", "tb"));

            ApiResult<Void> result = controller.remove("tb");

            assertEquals(ApiResult.SUCCESS, result.getCode());
            mocked.verify(() -> StpUtil.kickoutByTokenValue("tb"));
        }
    }

    @Test
    @DisplayName("remove: should swallow NotLoginException and still return success")
    void removeShouldSwallowNotLoginException() {
        SysUserOnlineController controller = new SysUserOnlineController();

        try (MockedStatic<StpUtil> mocked = mockStatic(StpUtil.class)) {
            mocked.when(StpUtil::getLoginIdAsString)
                .thenThrow(new NotLoginException("NOT_LOGIN", "default", "ignored"));

            ApiResult<Void> result = controller.remove("any");

            assertEquals(ApiResult.SUCCESS, result.getCode());
        }
    }

    @Test
    @DisplayName("list: should include only active tokens and apply ip+username filter")
    void listShouldIncludeActiveTokensAndApplyFilters() {
        SysUserOnlineController controller = new SysUserOnlineController();

        StpLogic stpLogic = mock(StpLogic.class);
        when(stpLogic.getTokenActiveTimeoutByToken("t1")).thenReturn(120L);
        when(stpLogic.getTokenActiveTimeoutByToken("t2")).thenReturn(-2L);
        StpUtil.setStpLogic(stpLogic);

        UserOnlineDTO dto = new UserOnlineDTO();
        dto.setTokenId("t1");
        dto.setUserName("admin");
        dto.setIpaddr("127.0.0.1");

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.keys(CacheConstants.ONLINE_TOKEN_KEY + "*"))
                .thenReturn(List.of(CacheConstants.ONLINE_TOKEN_KEY + "t1", CacheConstants.ONLINE_TOKEN_KEY + "t2"));
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t1")).thenReturn(dto);
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t2")).thenReturn(null);

            TableDataInfo<SysUserOnline> result = controller.list("127.0.0.1", "admin");

            assertEquals(1, result.getRows().size());
            assertEquals("admin", result.getRows().get(0).getUserName());
        }
    }

    @Test
    @DisplayName("list: should filter by ip only when username is empty")
    void listShouldFilterByIpOnly() {
        SysUserOnlineController controller = new SysUserOnlineController();

        StpLogic stpLogic = mock(StpLogic.class);
        when(stpLogic.getTokenActiveTimeoutByToken("t1")).thenReturn(120L);
        when(stpLogic.getTokenActiveTimeoutByToken("t2")).thenReturn(120L);
        StpUtil.setStpLogic(stpLogic);

        UserOnlineDTO dto1 = new UserOnlineDTO();
        dto1.setTokenId("t1");
        dto1.setUserName("admin");
        dto1.setIpaddr("127.0.0.1");
        UserOnlineDTO dto2 = new UserOnlineDTO();
        dto2.setTokenId("t2");
        dto2.setUserName("guest");
        dto2.setIpaddr("10.0.0.5");

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.keys(CacheConstants.ONLINE_TOKEN_KEY + "*"))
                .thenReturn(List.of(CacheConstants.ONLINE_TOKEN_KEY + "t1", CacheConstants.ONLINE_TOKEN_KEY + "t2"));
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t1")).thenReturn(dto1);
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t2")).thenReturn(dto2);

            TableDataInfo<SysUserOnline> result = controller.list("127.0.0.1", null);

            assertEquals(1, result.getRows().size());
            assertEquals("admin", result.getRows().get(0).getUserName());
        }
    }

    @Test
    @DisplayName("list: should filter by username only when ip is empty")
    void listShouldFilterByUsernameOnly() {
        SysUserOnlineController controller = new SysUserOnlineController();

        StpLogic stpLogic = mock(StpLogic.class);
        when(stpLogic.getTokenActiveTimeoutByToken("t1")).thenReturn(120L);
        when(stpLogic.getTokenActiveTimeoutByToken("t2")).thenReturn(120L);
        StpUtil.setStpLogic(stpLogic);

        UserOnlineDTO dto1 = new UserOnlineDTO();
        dto1.setTokenId("t1");
        dto1.setUserName("admin");
        dto1.setIpaddr("127.0.0.1");
        UserOnlineDTO dto2 = new UserOnlineDTO();
        dto2.setTokenId("t2");
        dto2.setUserName("guest");
        dto2.setIpaddr("10.0.0.5");

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.keys(CacheConstants.ONLINE_TOKEN_KEY + "*"))
                .thenReturn(List.of(CacheConstants.ONLINE_TOKEN_KEY + "t1", CacheConstants.ONLINE_TOKEN_KEY + "t2"));
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t1")).thenReturn(dto1);
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t2")).thenReturn(dto2);

            TableDataInfo<SysUserOnline> result = controller.list(null, "guest");

            assertEquals(1, result.getRows().size());
            assertEquals("guest", result.getRows().get(0).getUserName());
        }
    }

    @Test
    @DisplayName("getInfo: should keep active tokens only and ignore null cache values")
    void getInfoShouldKeepActiveTokensOnlyAndIgnoreNullCacheValues() {
        SysUserOnlineController controller = new SysUserOnlineController();

        StpLogic stpLogic = mock(StpLogic.class);
        when(stpLogic.getTokenActiveTimeoutByToken("t1")).thenReturn(120L);
        when(stpLogic.getTokenActiveTimeoutByToken("t2")).thenReturn(-2L);
        when(stpLogic.getTokenActiveTimeoutByToken("t3")).thenReturn(60L);
        StpUtil.setStpLogic(stpLogic);

        UserOnlineDTO dto = new UserOnlineDTO();
        dto.setTokenId("t1");
        dto.setUserName("admin");
        dto.setIpaddr("127.0.0.1");

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class);
             MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            stpUtil.when(StpUtil::getLoginIdAsString).thenReturn("100");
            stpUtil.when(() -> StpUtil.getTokenValueListByLoginId("100")).thenReturn(List.of("t1", "t2", "t3"));
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t1")).thenReturn(dto);
            redisUtils.when(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t3")).thenReturn(null);

            TableDataInfo<SysUserOnline> result = controller.getInfo();

            assertEquals(1, result.getRows().size());
            assertEquals("admin", result.getRows().get(0).getUserName());
            redisUtils.verify(() -> RedisUtils.getCacheObject(CacheConstants.ONLINE_TOKEN_KEY + "t2"), never());
        }
    }
}
