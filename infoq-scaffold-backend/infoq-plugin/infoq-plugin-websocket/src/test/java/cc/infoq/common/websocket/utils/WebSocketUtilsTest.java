package cc.infoq.common.websocket.utils;

import cc.infoq.common.utils.SpringUtils;
import cc.infoq.common.websocket.dto.WebSocketMessageDto;
import cc.infoq.common.websocket.holder.WebSocketSessionHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class WebSocketUtilsTest {

    private static RedissonClient redissonClient;
    private static RTopic topic;

    @BeforeAll
    static void initSpringContext() {
        redissonClient = mock(RedissonClient.class);
        topic = mock(RTopic.class);
        when(redissonClient.getTopic(anyString())).thenReturn(topic);

        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> redissonClient);
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @BeforeEach
    void resetRedisMocks() {
        reset(redissonClient, topic);
        when(redissonClient.getTopic(anyString())).thenReturn(topic);
    }

    @AfterEach
    void clearSessions() {
        List<Long> keys = new ArrayList<>(WebSocketSessionHolder.getSessionsAll());
        keys.forEach(WebSocketSessionHolder::removeSession);
    }

    @Test
    @DisplayName("sendMessage(sessionKey): should delegate to session and send text message")
    void sendMessageBySessionKeyShouldDelegateToSession() throws IOException {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.isOpen()).thenReturn(true);
        WebSocketSessionHolder.addSession(1L, session);

        WebSocketUtils.sendMessage(1L, "hello");

        verify(session).sendMessage(Mockito.argThat((WebSocketMessage<?> message) ->
            message instanceof TextMessage text && "hello".equals(text.getPayload())));
    }

    @Test
    @DisplayName("sendMessage/sendPongMessage: should tolerate closed session and io exception")
    void sendMessageShouldTolerateClosedSessionAndIoException() throws IOException {
        WebSocketSession closed = mock(WebSocketSession.class);
        when(closed.isOpen()).thenReturn(false);
        assertDoesNotThrow(() -> WebSocketUtils.sendMessage(closed, "ignore"));

        WebSocketSession broken = mock(WebSocketSession.class);
        when(broken.isOpen()).thenReturn(true);
        Mockito.doThrow(new IOException("network down")).when(broken).sendMessage(any(TextMessage.class));
        assertDoesNotThrow(() -> WebSocketUtils.sendMessage(broken, "payload"));

        WebSocketSession pongSession = mock(WebSocketSession.class);
        when(pongSession.isOpen()).thenReturn(true);
        WebSocketUtils.sendPongMessage(pongSession);
        verify(pongSession).sendMessage(any(PongMessage.class));
    }

    @Test
    @DisplayName("publishMessage: should send local sessions and publish unsent sessions")
    void publishMessageShouldSendLocalAndPublishUnsent() throws IOException {
        WebSocketSession local = mock(WebSocketSession.class);
        when(local.isOpen()).thenReturn(true);
        WebSocketSessionHolder.addSession(1L, local);

        WebSocketMessageDto dto = new WebSocketMessageDto();
        dto.setMessage("broadcast");
        dto.setSessionKeys(List.of(1L, 2L));

        WebSocketUtils.publishMessage(dto);

        verify(local).sendMessage(Mockito.argThat((WebSocketMessage<?> message) ->
            message instanceof TextMessage text && "broadcast".equals(text.getPayload())));

        ArgumentCaptor<WebSocketMessageDto> publishCaptor = ArgumentCaptor.forClass(WebSocketMessageDto.class);
        verify(topic).publish(publishCaptor.capture());
        assertEquals(List.of(2L), publishCaptor.getValue().getSessionKeys());
        assertEquals("broadcast", publishCaptor.getValue().getMessage());
    }

    @Test
    @DisplayName("publishAll/subscribeMessage: should delegate to redis utilities")
    void publishAllAndSubscribeMessageShouldDelegateToRedisUtils() {
        @SuppressWarnings("unchecked")
        Consumer<WebSocketMessageDto> consumer = mock(Consumer.class);

        WebSocketUtils.publishAll("all");
        WebSocketUtils.subscribeMessage(consumer);

        ArgumentCaptor<WebSocketMessageDto> publishCaptor = ArgumentCaptor.forClass(WebSocketMessageDto.class);
        verify(topic).publish(publishCaptor.capture());
        assertEquals("all", publishCaptor.getValue().getMessage());
        verify(topic).addListener(Mockito.eq(WebSocketMessageDto.class), any());
    }
}
