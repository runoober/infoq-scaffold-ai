package cc.infoq.common.sse.config;

import cc.infoq.common.sse.controller.SseController;
import cc.infoq.common.sse.core.SseEmitterManager;
import cc.infoq.common.sse.listener.SseTopicListener;
import cc.infoq.common.utils.SpringUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;

import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Tag("dev")
class SseAutoConfigurationTest {

    private static final GenericApplicationContext CONTEXT = new GenericApplicationContext();

    static {
        ScheduledExecutorService executor = mock(ScheduledExecutorService.class);
        when(executor.scheduleWithFixedDelay(any(Runnable.class), eq(60L), eq(60L), eq(TimeUnit.SECONDS)))
            .thenReturn(mock(ScheduledFuture.class));
        CONTEXT.registerBean(ScheduledExecutorService.class, () -> executor);
        CONTEXT.refresh();
        new SpringUtils().setApplicationContext(CONTEXT);
    }

    @AfterAll
    static void closeContext() {
        CONTEXT.close();
    }

    @Test
    @DisplayName("beans: should create manager/listener/controller")
    void beanMethodsShouldCreateInstances() {
        SseAutoConfiguration configuration = new SseAutoConfiguration();
        SseEmitterManager manager = configuration.sseEmitterManager();
        SseTopicListener listener = configuration.sseTopicListener();
        SseController controller = configuration.sseController(manager);

        assertNotNull(manager);
        assertNotNull(listener);
        assertNotNull(controller);
    }
}
