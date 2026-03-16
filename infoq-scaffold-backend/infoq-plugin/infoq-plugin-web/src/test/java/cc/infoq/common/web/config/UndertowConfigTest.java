package cc.infoq.common.web.config;

import cc.infoq.common.utils.SpringUtils;
import io.undertow.server.HttpHandler;
import io.undertow.server.handlers.DisallowedMethodsHandler;
import io.undertow.servlet.api.DeploymentInfo;
import io.undertow.websockets.jsr.WebSocketDeploymentInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.springframework.boot.web.embedded.undertow.UndertowServletWebServerFactory;
import org.springframework.core.task.VirtualThreadTaskExecutor;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.mockStatic;

@Tag("dev")
class UndertowConfigTest {

    @Test
    @DisplayName("customize: should register websocket and disallowed method handler")
    void customizeShouldRegisterWebSocketAndDisallowedMethodHandler() {
        UndertowConfig config = new UndertowConfig();
        UndertowServletWebServerFactory factory = new UndertowServletWebServerFactory();

        try (MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class)) {
            springUtils.when(SpringUtils::isVirtual).thenReturn(false);
            config.customize(factory);
        }

        Collection<org.springframework.boot.web.embedded.undertow.UndertowDeploymentInfoCustomizer> customizers =
            factory.getDeploymentInfoCustomizers();
        assertEquals(1, customizers.size());

        DeploymentInfo deploymentInfo = new DeploymentInfo();
        customizers.forEach(customizer -> customizer.customize(deploymentInfo));

        Object websocketAttr = deploymentInfo.getServletContextAttributes()
            .get("io.undertow.websockets.jsr.WebSocketDeploymentInfo");
        assertNotNull(websocketAttr);
        assertInstanceOf(WebSocketDeploymentInfo.class, websocketAttr);
        assertNull(deploymentInfo.getExecutor());
        assertNull(deploymentInfo.getAsyncExecutor());
        assertEquals(1, deploymentInfo.getInitialHandlerChainWrappers().size());

        HttpHandler next = exchange -> {
        };
        HttpHandler wrapped = deploymentInfo.getInitialHandlerChainWrappers().get(0).wrap(next);
        assertInstanceOf(DisallowedMethodsHandler.class, wrapped);
    }

    @Test
    @DisplayName("customize: should set virtual thread executors when virtual mode is enabled")
    void customizeShouldSetVirtualExecutorsWhenVirtualModeEnabled() {
        UndertowConfig config = new UndertowConfig();
        UndertowServletWebServerFactory factory = new UndertowServletWebServerFactory();

        try (MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class);
             MockedConstruction<VirtualThreadTaskExecutor> mockedExecutor = mockConstruction(VirtualThreadTaskExecutor.class)) {
            springUtils.when(SpringUtils::isVirtual).thenReturn(true);
            config.customize(factory);

            DeploymentInfo deploymentInfo = new DeploymentInfo();
            factory.getDeploymentInfoCustomizers().forEach(customizer -> customizer.customize(deploymentInfo));

            assertNotNull(deploymentInfo.getExecutor());
            assertSame(deploymentInfo.getExecutor(), deploymentInfo.getAsyncExecutor());
            assertEquals(1, mockedExecutor.constructed().size());
        }
    }
}
