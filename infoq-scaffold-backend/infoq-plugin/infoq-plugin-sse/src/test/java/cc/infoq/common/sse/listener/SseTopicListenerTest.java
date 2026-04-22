package cc.infoq.common.sse.listener;

import cc.infoq.common.sse.core.SseEmitterManager;
import cc.infoq.common.sse.dto.SseMessageDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class SseTopicListenerTest {

    @Mock
    private SseEmitterManager sseEmitterManager;

    @Mock
    private ApplicationArguments applicationArguments;
    @Captor
    private ArgumentCaptor<Consumer<SseMessageDto>> messageConsumerCaptor;

    @Test
    @DisplayName("run: should route targeted message to each user id")
    void runShouldRouteTargetedMessage() throws Exception {
        SseTopicListener listener = new SseTopicListener();
        ReflectionTestUtils.setField(listener, "sseEmitterManager", sseEmitterManager);

        listener.run(applicationArguments);

        verify(sseEmitterManager).subscribeMessage(messageConsumerCaptor.capture());

        SseMessageDto message = new SseMessageDto();
        message.setUserIds(List.of(1L, 2L));
        message.setMessage("hello");
        messageConsumerCaptor.getValue().accept(message);

        verify(sseEmitterManager).sendMessage(1L, "hello");
        verify(sseEmitterManager).sendMessage(2L, "hello");
    }

    @Test
    @DisplayName("run: should broadcast when user ids are empty")
    void runShouldBroadcastWhenNoUserIds() throws Exception {
        SseTopicListener listener = new SseTopicListener();
        ReflectionTestUtils.setField(listener, "sseEmitterManager", sseEmitterManager);

        listener.run(applicationArguments);

        verify(sseEmitterManager).subscribeMessage(messageConsumerCaptor.capture());

        SseMessageDto message = new SseMessageDto();
        message.setMessage("broadcast");
        messageConsumerCaptor.getValue().accept(message);

        verify(sseEmitterManager).sendMessage("broadcast");
        assertEquals(-1, listener.getOrder());
    }
}
