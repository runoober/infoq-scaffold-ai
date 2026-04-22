package cc.infoq.common.redis.manager;

import cc.infoq.common.utils.SpringUtils;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.cache.support.SimpleValueWrapper;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.Callable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class CaffeineCacheDecoratorTest {

    @BeforeAll
    static void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean("caffeine", Cache.class, () -> Caffeine.newBuilder().build());
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @BeforeEach
    void clearCaffeine() {
        Object localCache = ReflectionTestUtils.getField(CaffeineCacheDecorator.class, "CAFFEINE");
        if (localCache instanceof Cache<?, ?> caffeineCache) {
            caffeineCache.invalidateAll();
        }
    }

    @Test
    @DisplayName("accessors: should return cache metadata")
    void accessorsShouldReturnMetadata() {
        org.springframework.cache.Cache delegate = mock(org.springframework.cache.Cache.class);
        Object nativeCache = new Object();
        when(delegate.getNativeCache()).thenReturn(nativeCache);

        CaffeineCacheDecorator decorator = new CaffeineCacheDecorator("user-cache", delegate);

        assertEquals("user-cache", decorator.getName());
        assertSame(nativeCache, decorator.getNativeCache());
        assertEquals("user-cache:id1", decorator.getUniqueKey("id1"));
    }

    @Test
    @DisplayName("get variants: should delegate once and then hit local caffeine cache")
    void getVariantsShouldHitLocalCache() {
        org.springframework.cache.Cache delegate = mock(org.springframework.cache.Cache.class);
        when(delegate.get("k1")).thenReturn(new SimpleValueWrapper("v1"));
        when(delegate.get("k2", String.class)).thenReturn("v2");
        when(delegate.get(eq("k3"), org.mockito.ArgumentMatchers.<Callable<String>>any())).thenReturn("v3");

        CaffeineCacheDecorator decorator = new CaffeineCacheDecorator("cache", delegate);

        assertEquals("v1", decorator.get("k1").get());
        assertEquals("v1", decorator.get("k1").get());
        assertEquals("v2", decorator.get("k2", String.class));
        assertEquals("v2", decorator.get("k2", String.class));
        assertEquals("v3", decorator.get("k3", () -> "x"));
        assertEquals("v3", decorator.get("k3", () -> "x"));

        verify(delegate, times(1)).get("k1");
        verify(delegate, times(1)).get("k2", String.class);
        verify(delegate, times(1)).get(eq("k3"), org.mockito.ArgumentMatchers.<Callable<String>>any());
    }

    @Test
    @DisplayName("mutations: should delegate put/evict/clear/invalidate operations")
    void mutationsShouldDelegateToUnderlyingCache() {
        org.springframework.cache.Cache delegate = mock(org.springframework.cache.Cache.class);
        when(delegate.putIfAbsent("k2", "v2")).thenReturn(new SimpleValueWrapper("old"));
        when(delegate.evictIfPresent("k3")).thenReturn(true, false);
        when(delegate.invalidate()).thenReturn(true);

        CaffeineCacheDecorator decorator = new CaffeineCacheDecorator("cache", delegate);

        decorator.put("k1", "v1");
        decorator.putIfAbsent("k2", "v2");
        decorator.evict("k3");
        assertFalse(decorator.evictIfPresent("k3"));
        decorator.clear();
        assertTrue(decorator.invalidate());

        verify(delegate).put("k1", "v1");
        verify(delegate).putIfAbsent("k2", "v2");
        verify(delegate, times(2)).evictIfPresent("k3");
        verify(delegate).clear();
        verify(delegate).invalidate();
    }
}
