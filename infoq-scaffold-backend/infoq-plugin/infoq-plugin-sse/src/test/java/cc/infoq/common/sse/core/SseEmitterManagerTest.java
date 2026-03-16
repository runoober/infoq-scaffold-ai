package cc.infoq.common.sse.core;

import cc.infoq.common.sse.dto.SseMessageDto;
import cc.infoq.common.utils.SpringUtils;
import cn.hutool.extra.spring.SpringUtil;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.ArgumentCaptor;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.redisson.api.listener.MessageListener;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class SseEmitterManagerTest {

    private static GenericApplicationContext context;
    private static RedissonClient redissonClient;
    private static RTopic topic;

    @BeforeAll
    static void initRedisContext() {
        redissonClient = mock(RedissonClient.class);
        topic = mock(RTopic.class);
        when(redissonClient.getTopic("global:sse")).thenReturn(topic);

        context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> redissonClient);
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @AfterAll
    static void closeContext() {
        if (context != null) {
            context.close();
        }
    }

    @AfterEach
    void clearEmitterStore() {
        emitterStore().clear();
    }

    @Test
    @DisplayName("connect: should replace old emitter for same token")
    void connectShouldReplaceOldEmitter() {
        SseEmitterManager manager = newManager();
        SseEmitter oldEmitter = mock(SseEmitter.class);
        emitterStore().put(1L, new ConcurrentHashMap<>(Map.of("t1", oldEmitter)));

        SseEmitter newEmitter = manager.connect(1L, "t1");

        verify(oldEmitter).complete();
        assertSame(newEmitter, emitterStore().get(1L).get("t1"));
    }

    @Test
    @DisplayName("connect: should remove token when initial send fails")
    void connectShouldRemoveTokenWhenSendFails() throws IOException {
        SseEmitterManager manager = newManager();
        try (MockedConstruction<SseEmitter> construction = org.mockito.Mockito.mockConstruction(
            SseEmitter.class,
            (mock, context) -> doThrow(new IOException("io")).when(mock).send(any(SseEmitter.SseEventBuilder.class))
        )) {
            manager.connect(2L, "tk");
            assertTrue(construction.constructed().size() == 1);
            assertFalse(emitterStore().get(2L).containsKey("tk"));
        }
    }

    @Test
    @DisplayName("connect callbacks: should cleanup token on completion/timeout/error")
    void connectCallbacksShouldCleanupTokenOnLifecycleEvents() {
        SseEmitterManager manager = newManager();
        List<Runnable> completionCallbacks = new ArrayList<>();
        List<Runnable> timeoutCallbacks = new ArrayList<>();
        List<Consumer<Throwable>> errorCallbacks = new ArrayList<>();

        try (MockedConstruction<SseEmitter> construction = org.mockito.Mockito.mockConstruction(
            SseEmitter.class,
            (mock, context) -> {
                doAnswer(invocation -> {
                    completionCallbacks.add(invocation.getArgument(0));
                    return null;
                }).when(mock).onCompletion(any(Runnable.class));
                doAnswer(invocation -> {
                    timeoutCallbacks.add(invocation.getArgument(0));
                    return null;
                }).when(mock).onTimeout(any(Runnable.class));
                doAnswer(invocation -> {
                    errorCallbacks.add(invocation.getArgument(0));
                    return null;
                }).when(mock).onError(any());
            }
        )) {
            manager.connect(100L, "c1");
            manager.connect(101L, "t1");
            manager.connect(102L, "e1");

            completionCallbacks.get(0).run();
            timeoutCallbacks.get(1).run();
            errorCallbacks.get(2).accept(new RuntimeException("boom"));

            assertFalse(emitterStore().get(100L).containsKey("c1"));
            assertFalse(emitterStore().get(101L).containsKey("t1"));
            assertFalse(emitterStore().get(102L).containsKey("e1"));
            verify(construction.constructed().get(0)).complete();
            verify(construction.constructed().get(1)).complete();
            verify(construction.constructed().get(2)).complete();
        }
    }

    @Test
    @DisplayName("disconnect: should send disconnected event and remove token")
    void disconnectShouldCloseAndRemoveEmitter() throws IOException {
        SseEmitterManager manager = newManager();
        SseEmitter emitter = mock(SseEmitter.class);
        emitterStore().put(1L, new ConcurrentHashMap<>(Map.of("tk", emitter)));

        manager.disconnect(1L, "tk");

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter).complete();
        assertFalse(emitterStore().get(1L).containsKey("tk"));
    }

    @Test
    @DisplayName("disconnect: should remove empty user map and tolerate null inputs")
    void disconnectShouldHandleEmptyOrNullInputs() {
        SseEmitterManager manager = newManager();
        emitterStore().put(3L, new ConcurrentHashMap<>());

        manager.disconnect(3L, "tk");
        manager.disconnect(null, "tk");
        manager.disconnect(3L, null);

        assertFalse(emitterStore().containsKey(3L));
    }

    @Test
    @DisplayName("sseMonitor: should heartbeat valid emitters and cleanup failed/empty users")
    void sseMonitorShouldCleanupInvalidEmitters() throws IOException {
        SseEmitterManager manager = newManager();

        SseEmitter okEmitter = mock(SseEmitter.class);
        SseEmitter badEmitter = mock(SseEmitter.class);
        doThrow(new IOException("broken")).when(badEmitter).send(any(SseEmitter.SseEventBuilder.class));

        emitterStore().put(1L, new ConcurrentHashMap<>()); // empty user map -> remove
        emitterStore().put(2L, new ConcurrentHashMap<>(Map.of("ok", okEmitter)));
        emitterStore().put(3L, new ConcurrentHashMap<>(Map.of("bad", badEmitter)));

        manager.sseMonitor();

        verify(okEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(badEmitter).complete();
        assertFalse(emitterStore().containsKey(1L));
        assertTrue(emitterStore().containsKey(2L));
        assertFalse(emitterStore().containsKey(3L));
    }

    @Test
    @DisplayName("sendMessage(user): should send and cleanup failed emitters")
    void sendMessageToUserShouldCleanupFailedEmitters() throws IOException {
        SseEmitterManager manager = newManager();
        SseEmitter okEmitter = mock(SseEmitter.class);
        SseEmitter badEmitter = mock(SseEmitter.class);
        doThrow(new IOException("broken")).when(badEmitter).send(any(SseEmitter.SseEventBuilder.class));
        emitterStore().put(10L, new ConcurrentHashMap<>(Map.of("ok", okEmitter, "bad", badEmitter)));

        manager.sendMessage(10L, "hello");

        verify(okEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(badEmitter).complete();
        assertTrue(emitterStore().get(10L).containsKey("ok"));
        assertFalse(emitterStore().get(10L).containsKey("bad"));
    }

    @Test
    @DisplayName("sendMessage(all): should broadcast to all connected users")
    void sendMessageAllShouldBroadcast() throws IOException {
        SseEmitterManager manager = newManager();
        SseEmitter emitter1 = mock(SseEmitter.class);
        SseEmitter emitter2 = mock(SseEmitter.class);
        emitterStore().put(1L, new ConcurrentHashMap<>(Map.of("a", emitter1)));
        emitterStore().put(2L, new ConcurrentHashMap<>(Map.of("b", emitter2)));

        manager.sendMessage("broadcast");

        verify(emitter1).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter2).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("subscribeMessage: should subscribe to global topic")
    void subscribeMessageShouldDelegateToRedis() {
        SseEmitterManager manager = newManager();
        AtomicReference<SseMessageDto> messageRef = new AtomicReference<>();
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            MessageListener<SseMessageDto> listener = invocation.getArgument(1);
            SseMessageDto dto = new SseMessageDto();
            dto.setMessage("payload");
            listener.onMessage("global:sse", dto);
            return 1;
        }).when(topic).addListener(eq(SseMessageDto.class), any(MessageListener.class));

        manager.subscribeMessage(messageRef::set);

        assertEquals("payload", messageRef.get().getMessage());
        verify(topic).addListener(eq(SseMessageDto.class), any(MessageListener.class));
    }

    @Test
    @DisplayName("publishMessage/publishAll: should publish converted dto to redis topic")
    void publishMethodsShouldDelegateToRedis() {
        SseEmitterManager manager = newManager();
        SseMessageDto dto = new SseMessageDto();
        dto.setMessage("hello");
        dto.setUserIds(List.of(1L, 2L));

        manager.publishMessage(dto);
        manager.publishAll("all-message");

        ArgumentCaptor<SseMessageDto> captor = ArgumentCaptor.forClass(SseMessageDto.class);
        verify(topic, times(2)).publish(captor.capture());
        List<SseMessageDto> published = captor.getAllValues();
        assertEquals(List.of(1L, 2L), published.get(0).getUserIds());
        assertEquals("hello", published.get(0).getMessage());
        assertEquals("all-message", published.get(1).getMessage());
    }

    private SseEmitterManager newManager() {
        ScheduledExecutorService scheduledExecutorService = mock(ScheduledExecutorService.class);
        when(scheduledExecutorService.scheduleWithFixedDelay(any(Runnable.class), eq(60L), eq(60L), eq(TimeUnit.SECONDS)))
            .thenAnswer(invocation -> mock(ScheduledFuture.class));
        try (MockedStatic<SpringUtil> springUtil = mockStatic(SpringUtil.class)) {
            springUtil.when(() -> SpringUtil.getBean(ScheduledExecutorService.class)).thenReturn(scheduledExecutorService);
            return new SseEmitterManager();
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<Long, Map<String, SseEmitter>> emitterStore() {
        try {
            Field field = SseEmitterManager.class.getDeclaredField("USER_TOKEN_EMITTERS");
            field.setAccessible(true);
            return (Map<Long, Map<String, SseEmitter>>) field.get(null);
        } catch (Exception e) {
            throw new AssertionError("failed to read USER_TOKEN_EMITTERS", e);
        }
    }
}
