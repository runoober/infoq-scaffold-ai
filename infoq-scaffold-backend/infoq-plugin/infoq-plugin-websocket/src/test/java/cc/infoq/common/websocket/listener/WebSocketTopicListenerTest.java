package cc.infoq.common.websocket.listener;

import cc.infoq.common.websocket.dto.WebSocketMessageDto;
import cc.infoq.common.websocket.holder.WebSocketSessionHolder;
import cc.infoq.common.websocket.utils.WebSocketUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.ApplicationArguments;

import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@Tag("dev")
class WebSocketTopicListenerTest {

    @Test
    @DisplayName("run: should route targeted websocket message only to existing sessions")
    void runShouldRouteTargetedMessageToExistingSessions() throws Exception {
        AtomicReference<Consumer<WebSocketMessageDto>> consumerRef = new AtomicReference<>();

        try (MockedStatic<WebSocketUtils> webSocketUtils = mockStatic(WebSocketUtils.class);
             MockedStatic<WebSocketSessionHolder> sessionHolder = mockStatic(WebSocketSessionHolder.class)) {

            webSocketUtils.when(() -> WebSocketUtils.subscribeMessage(any())).thenAnswer(invocation -> {
                Consumer<WebSocketMessageDto> consumer = invocation.getArgument(0);
                consumerRef.set(consumer);
                return null;
            });
            sessionHolder.when(() -> WebSocketSessionHolder.existSession(1L)).thenReturn(true);
            sessionHolder.when(() -> WebSocketSessionHolder.existSession(2L)).thenReturn(false);

            WebSocketTopicListener listener = new WebSocketTopicListener();
            listener.run(mock(ApplicationArguments.class));

            Consumer<WebSocketMessageDto> consumer = consumerRef.get();
            assertNotNull(consumer);

            WebSocketMessageDto dto = new WebSocketMessageDto();
            dto.setSessionKeys(List.of(1L, 2L));
            dto.setMessage("hello");
            consumer.accept(dto);

            webSocketUtils.verify(() -> WebSocketUtils.sendMessage(1L, "hello"));
            webSocketUtils.verify(() -> WebSocketUtils.sendMessage(2L, "hello"), never());
        }
    }

    @Test
    @DisplayName("run: should broadcast websocket message when session keys are empty")
    void runShouldBroadcastWhenSessionKeysEmpty() throws Exception {
        AtomicReference<Consumer<WebSocketMessageDto>> consumerRef = new AtomicReference<>();

        try (MockedStatic<WebSocketUtils> webSocketUtils = mockStatic(WebSocketUtils.class);
             MockedStatic<WebSocketSessionHolder> sessionHolder = mockStatic(WebSocketSessionHolder.class)) {

            webSocketUtils.when(() -> WebSocketUtils.subscribeMessage(any())).thenAnswer(invocation -> {
                Consumer<WebSocketMessageDto> consumer = invocation.getArgument(0);
                consumerRef.set(consumer);
                return null;
            });
            sessionHolder.when(WebSocketSessionHolder::getSessionsAll).thenReturn(Set.of(10L, 11L));

            WebSocketTopicListener listener = new WebSocketTopicListener();
            listener.run(mock(ApplicationArguments.class));

            Consumer<WebSocketMessageDto> consumer = consumerRef.get();
            assertNotNull(consumer);

            WebSocketMessageDto dto = new WebSocketMessageDto();
            dto.setMessage("broadcast");
            consumer.accept(dto);

            webSocketUtils.verify(() -> WebSocketUtils.sendMessage(10L, "broadcast"));
            webSocketUtils.verify(() -> WebSocketUtils.sendMessage(11L, "broadcast"));
            assertEquals(-1, listener.getOrder());
        }
    }
}
