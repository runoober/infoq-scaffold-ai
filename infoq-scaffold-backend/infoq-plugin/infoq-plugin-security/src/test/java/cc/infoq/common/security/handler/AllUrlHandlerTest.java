package cc.infoq.common.security.handler;

import cc.infoq.common.utils.SpringUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Tag("dev")
class AllUrlHandlerTest {

    @Test
    @DisplayName("urls: should initialize and allow replacing url list")
    void urlsShouldInitializeAndBeReplaceable() {
        AllUrlHandler handler = new AllUrlHandler();

        assertNotNull(handler.getUrls());
        assertEquals(0, handler.getUrls().size());

        List<String> urls = new ArrayList<>();
        urls.add("/system/user/*");
        handler.setUrls(urls);

        assertEquals(List.of("/system/user/*"), handler.getUrls());
    }

    @Test
    @DisplayName("afterPropertiesSet: should collect request mapping patterns and replace path variable")
    void afterPropertiesSetShouldCollectPatterns() {
        RequestMappingHandlerMapping mapping = mock(RequestMappingHandlerMapping.class);
        Map<RequestMappingInfo, HandlerMethod> handlerMethods = new LinkedHashMap<>();
        handlerMethods.put(RequestMappingInfo.paths("/system/user/{id}").build(), mock(HandlerMethod.class));
        handlerMethods.put(RequestMappingInfo.paths("/health").build(), mock(HandlerMethod.class));
        when(mapping.getHandlerMethods()).thenReturn(handlerMethods);

        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean("requestMappingHandlerMapping", RequestMappingHandlerMapping.class, () -> mapping);
        context.refresh();
        new SpringUtils().setApplicationContext(context);

        AllUrlHandler handler = new AllUrlHandler();
        handler.afterPropertiesSet();

        assertEquals(2, handler.getUrls().size());
        assertTrue(handler.getUrls().contains("/system/user/*"));
        assertTrue(handler.getUrls().contains("/health"));
    }
}
