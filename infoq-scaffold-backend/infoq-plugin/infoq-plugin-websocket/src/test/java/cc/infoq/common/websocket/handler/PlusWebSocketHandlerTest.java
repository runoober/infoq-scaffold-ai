package cc.infoq.common.websocket.handler;

import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.websocket.dto.WebSocketMessageDto;
import cc.infoq.common.websocket.holder.WebSocketSessionHolder;
import cc.infoq.common.websocket.utils.WebSocketUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Map;

import static cc.infoq.common.websocket.constant.WebSocketConstants.LOGIN_USER_KEY;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class PlusWebSocketHandlerTest {

    @AfterEach
    void clearSessions() {
        new ArrayList<>(WebSocketSessionHolder.getSessionsAll()).forEach(WebSocketSessionHolder::removeSession);
    }

    @Test
    @DisplayName("afterConnectionEstablished: should close invalid session")
    void afterConnectionEstablishedShouldCloseInvalidSession() throws Exception {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("s-1");
        when(session.getAttributes()).thenReturn(Map.of());

        handler.afterConnectionEstablished(session);

        verify(session).close(CloseStatus.BAD_DATA);
    }

    @Test
    @DisplayName("afterConnectionEstablished: should register valid user session")
    void afterConnectionEstablishedShouldRegisterSession() throws Exception {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(100L);
        loginUser.setUserType("sys_user");
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("s-2");
        when(session.getAttributes()).thenReturn(Map.of(LOGIN_USER_KEY, loginUser));
        when(session.isOpen()).thenReturn(true);

        handler.afterConnectionEstablished(session);

        assertTrue(WebSocketSessionHolder.existSession(100L));
    }

    @Test
    @DisplayName("handleTextMessage: should publish payload to websocket topic")
    void handleTextMessageShouldPublishPayload() throws Exception {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(200L);
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getAttributes()).thenReturn(Map.of(LOGIN_USER_KEY, loginUser));
        TextMessage textMessage = new TextMessage("hello");

        try (MockedStatic<WebSocketUtils> webSocketUtils = mockStatic(WebSocketUtils.class)) {
            invokeProtected(handler, "handleTextMessage", session, textMessage);

            ArgumentCaptor<WebSocketMessageDto> captor = ArgumentCaptor.forClass(WebSocketMessageDto.class);
            webSocketUtils.verify(() -> WebSocketUtils.publishMessage(captor.capture()));
            assertEquals("hello", captor.getValue().getMessage());
            assertEquals(java.util.List.of(200L), captor.getValue().getSessionKeys());
        }
    }

    @Test
    @DisplayName("handlePongMessage: should delegate to WebSocketUtils")
    void handlePongMessageShouldDelegateToUtils() throws Exception {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        WebSocketSession session = mock(WebSocketSession.class);
        PongMessage pongMessage = new PongMessage();
        try (MockedStatic<WebSocketUtils> webSocketUtils = mockStatic(WebSocketUtils.class)) {
            invokeProtected(handler, "handlePongMessage", session, pongMessage);
            webSocketUtils.verify(() -> WebSocketUtils.sendPongMessage(session));
        }
    }

    @Test
    @DisplayName("handleBinaryMessage: should support binary messages without throwing")
    void handleBinaryMessageShouldNotThrow() throws Exception {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        WebSocketSession session = mock(WebSocketSession.class);
        BinaryMessage binaryMessage = new BinaryMessage(new byte[]{1, 2, 3});

        assertDoesNotThrow(() -> invokeProtected(handler, "handleBinaryMessage", session, binaryMessage));
    }

    @Test
    @DisplayName("afterConnectionClosed: should remove existing session")
    void afterConnectionClosedShouldRemoveExistingSession() throws Exception {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(300L);
        loginUser.setUserType("sys_user");
        WebSocketSession oldSession = mock(WebSocketSession.class);
        when(oldSession.isOpen()).thenReturn(true);
        WebSocketSessionHolder.addSession(300L, oldSession);

        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("s-3");
        when(session.getAttributes()).thenReturn(Map.of(LOGIN_USER_KEY, loginUser));

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        assertFalse(WebSocketSessionHolder.existSession(300L));
    }

    @Test
    @DisplayName("afterConnectionClosed/handleTransportError: should tolerate invalid session")
    void afterConnectionClosedShouldTolerateInvalidSession() {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("s-4");
        when(session.getAttributes()).thenReturn(Map.of());

        assertDoesNotThrow(() -> handler.afterConnectionClosed(session, CloseStatus.NORMAL));
        assertDoesNotThrow(() -> handler.handleTransportError(session, new RuntimeException("transport")));
    }

    @Test
    @DisplayName("supportsPartialMessages: should return false")
    void supportsPartialMessagesShouldReturnFalse() {
        PlusWebSocketHandler handler = new PlusWebSocketHandler();
        assertFalse(handler.supportsPartialMessages());
    }

    private static void invokeProtected(PlusWebSocketHandler handler, String method, Object... args) throws Exception {
        Class<?>[] types = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) {
            types[i] = args[i].getClass();
            if (args[i] instanceof WebSocketSession) {
                types[i] = WebSocketSession.class;
            }
            if (args[i] instanceof TextMessage) {
                types[i] = TextMessage.class;
            }
            if (args[i] instanceof PongMessage) {
                types[i] = PongMessage.class;
            }
            if (args[i] instanceof BinaryMessage) {
                types[i] = BinaryMessage.class;
            }
        }
        Method target = PlusWebSocketHandler.class.getDeclaredMethod(method, types);
        target.setAccessible(true);
        target.invoke(handler, args);
    }
}
