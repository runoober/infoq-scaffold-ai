package cc.infoq.common.redis.manager;

import cc.infoq.common.redis.utils.RedisUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.redisson.api.RMap;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.springframework.cache.Cache;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class PlusSpringCacheManagerTest {

    @Test
    @DisplayName("getCache: should return null for unknown cache when dynamic mode is disabled")
    void getCacheShouldReturnNullWhenDynamicDisabled() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setAllowNullValues(false);
        assertFalse((Boolean) ReflectionTestUtils.getField(manager, "allowNullValues"));

        Map<String, org.redisson.spring.cache.CacheConfig> config = new HashMap<>();
        config.put("fixed", new org.redisson.spring.cache.CacheConfig());
        manager.setConfig(config);
        assertTrue(((Map<?, ?>) ReflectionTestUtils.getField(manager, "configMap")).containsKey("fixed"));

        manager.setCacheNames(Collections.emptyList());

        Cache cache = manager.getCache("unknown");

        assertNull(cache);
    }

    @Test
    @DisplayName("getCache: should create and reuse map cache when ttl/maxIdle/maxSize are zero")
    void getCacheShouldCreateAndReuseMapCache() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RedissonClient redissonClient = Mockito.mock(RedissonClient.class);
        RMap<?, ?> map = Mockito.mock(RMap.class);
        when(redissonClient.getMap("user-cache")).thenAnswer(invocation -> map);

        try (MockedStatic<RedisUtils> redisUtils = Mockito.mockStatic(RedisUtils.class)) {
            redisUtils.when(RedisUtils::getClient).thenReturn(redissonClient);

            Cache first = manager.getCache("user-cache#0s#0s#0#0");
            Cache second = manager.getCache("user-cache");

            assertNotNull(first);
            assertSame(first, second);
            assertTrue(manager.getCacheNames().contains("user-cache"));
            verify(redissonClient, times(1)).getMap("user-cache");
        }
    }

    @Test
    @DisplayName("getCache: should create mapCache and apply max size when ttl/maxIdle/maxSize are provided")
    void getCacheShouldCreateMapCacheAndSetMaxSize() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RedissonClient redissonClient = Mockito.mock(RedissonClient.class);
        RMapCache<?, ?> mapCache = Mockito.mock(RMapCache.class);
        when(redissonClient.getMapCache("order-cache")).thenAnswer(invocation -> mapCache);

        try (MockedStatic<RedisUtils> redisUtils = Mockito.mockStatic(RedisUtils.class)) {
            redisUtils.when(RedisUtils::getClient).thenReturn(redissonClient);

            Cache cache = manager.getCache("order-cache#10s#5s#20#0");

            assertNotNull(cache);
            verify(redissonClient).getMapCache("order-cache");
            verify(mapCache).setMaxSize(20);
        }
    }
}
