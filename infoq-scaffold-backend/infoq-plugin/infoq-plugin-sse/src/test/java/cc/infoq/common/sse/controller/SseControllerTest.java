package cc.infoq.common.sse.controller;

import cc.infoq.common.domain.ApiResult;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.sse.core.SseEmitterManager;
import cn.dev33.satoken.stp.StpUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class SseControllerTest {

    @Mock
    private SseEmitterManager sseEmitterManager;

    @Test
    @DisplayName("connect: should return null when current request is not logged in")
    void connectShouldReturnNullWhenNotLogin() {
        SseController controller = new SseController(sseEmitterManager);

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            stpUtil.when(StpUtil::isLogin).thenReturn(false);

            SseEmitter emitter = controller.connect();

            assertNull(emitter);
            verifyNoInteractions(sseEmitterManager);
        }
    }

    @Test
    @DisplayName("connect: should delegate to emitter manager when logged in")
    void connectShouldDelegateWhenLoggedIn() {
        SseController controller = new SseController(sseEmitterManager);
        SseEmitter emitter = new SseEmitter(1000L);
        when(sseEmitterManager.connect(1L, "token")).thenReturn(emitter);

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            stpUtil.when(StpUtil::isLogin).thenReturn(true);
            stpUtil.when(StpUtil::getTokenValue).thenReturn("token");
            loginHelper.when(LoginHelper::getUserId).thenReturn(1L);

            SseEmitter result = controller.connect();

            assertSame(emitter, result);
            verify(sseEmitterManager).connect(1L, "token");
        }
    }

    @Test
    @DisplayName("close: should disconnect current user and return success")
    void closeShouldDisconnectCurrentUser() {
        SseController controller = new SseController(sseEmitterManager);

        try (MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            stpUtil.when(StpUtil::getTokenValue).thenReturn("token");
            loginHelper.when(LoginHelper::getUserId).thenReturn(2L);

            ApiResult<Void> result = controller.close();

            verify(sseEmitterManager).disconnect(2L, "token");
            assertEquals(ApiResult.SUCCESS, result.getCode());
        }
    }

    @Test
    @DisplayName("destroy: should not throw any exception")
    void destroyShouldNotThrow() {
        SseController controller = new SseController(sseEmitterManager);
        assertDoesNotThrow(controller::destroy);
    }
}
