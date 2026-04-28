package cc.infoq.common.redis.manager;

import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.utils.SpringUtils;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.redisson.api.LocalCachedMapCacheOptions;
import org.redisson.api.RLocalCachedMap;
import org.redisson.api.RLocalCachedMapCache;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mockito;
import org.redisson.api.RMap;
import org.redisson.api.RMapCache;
import org.redisson.api.RedissonClient;
import org.redisson.api.options.LocalCachedMapOptions;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.cache.Cache;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Field;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@Tag("dev")
@ExtendWith(MockitoExtension.class)
class PlusSpringCacheManagerTest {

    private static RedissonClient redissonClient;

    @Captor
    private ArgumentCaptor<LocalCachedMapOptions<Object, Object>> localCachedMapOptionsCaptor;

    @Captor
    private ArgumentCaptor<LocalCachedMapCacheOptions<Object, Object>> localCachedMapCacheOptionsCaptor;

    @BeforeAll
    static void initSpringContext() throws Exception {
        redissonClient = Mockito.mock(RedissonClient.class);
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> redissonClient);
        context.refresh();
        new SpringUtils().setApplicationContext(context);

        Field clientField = RedisUtils.class.getDeclaredField("CLIENT");
        clientField.setAccessible(true);
        Object actualClient = clientField.get(null);
        if (actualClient instanceof RedissonClient && Mockito.mockingDetails(actualClient).isMock()) {
            redissonClient = (RedissonClient) actualClient;
        }
    }

    @BeforeEach
    void clearInteractions() {
        Mockito.clearInvocations(redissonClient);
    }

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
    @DisplayName("getCache: should create and reuse Redisson local cached map when local cache is enabled")
    void getCacheShouldCreateAndReuseLocalCachedMap() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RLocalCachedMap<Object, Object> map = mockLocalCachedMap();
        doReturn(map)
            .when(redissonClient).getLocalCachedMap(anyLocalCachedMapOptions());

        Cache first = manager.getCache("user-cache");
        Cache second = manager.getCache("user-cache");

        assertNotNull(first);
        assertSame(first, second);
        assertTrue(manager.getCacheNames().contains("user-cache"));
        verify(redissonClient, times(1)).getLocalCachedMap(localCachedMapOptionsCaptor.capture());
        LocalCachedMapOptions<Object, Object> options = localCachedMapOptionsCaptor.getValue();
        assertEquals("user-cache", ReflectionTestUtils.getField(options, "name"));
        assertEquals(LocalCachedMapOptions.CacheProvider.CAFFEINE, ReflectionTestUtils.getField(options, "cacheProvider"));
        assertEquals(LocalCachedMapOptions.SyncStrategy.INVALIDATE, ReflectionTestUtils.getField(options, "syncStrategy"));
        assertEquals(LocalCachedMapOptions.ReconnectionStrategy.CLEAR, ReflectionTestUtils.getField(options, "reconnectionStrategy"));
        assertEquals(LocalCachedMapOptions.EvictionPolicy.LRU, ReflectionTestUtils.getField(options, "evictionPolicy"));
        assertEquals(1000, ReflectionTestUtils.getField(options, "cacheSize"));
        assertEquals(TimeUnit.SECONDS.toMillis(30), ReflectionTestUtils.getField(options, "timeToLiveInMillis"));
    }

    @Test
    @DisplayName("getCache: should create plain redis map when local cache is disabled")
    void getCacheShouldCreatePlainMapWhenLocalCacheDisabled() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RMap<Object, Object> map = mockMap();
        doReturn(map).when(redissonClient).getMap("user-cache");

        Cache cache = manager.getCache("user-cache#0s#0s#0#0");

        assertNotNull(cache);
        verify(redissonClient).getMap("user-cache");
    }

    @Test
    @DisplayName("getCache: should default to plain redis mapCache when ttl/maxIdle/maxSize are provided without local flag")
    void getCacheShouldDefaultToPlainMapCacheWhenLocalFlagIsOmitted() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RMapCache<Object, Object> mapCache = mockMapCache();
        doReturn(mapCache).when(redissonClient).getMapCache("order-cache");

        Cache cache = manager.getCache("order-cache#10s#5s#20");

        assertNotNull(cache);
        verify(redissonClient).getMapCache("order-cache");
        verify(redissonClient, times(0)).getLocalCachedMapCache(eq("order-cache"), anyLocalCachedMapCacheOptions());
        verify(mapCache).setMaxSize(20);
    }

    @Test
    @DisplayName("getCache: should create local cached mapCache when local cache is enabled explicitly")
    void getCacheShouldCreateLocalCachedMapCacheWhenLocalFlagEnabledExplicitly() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RLocalCachedMapCache<Object, Object> mapCache = mockLocalCachedMapCache();
        doReturn(mapCache)
            .when(redissonClient).getLocalCachedMapCache(eq("order-cache"), anyLocalCachedMapCacheOptions());

        Cache cache = manager.getCache("order-cache#10s#5s#20#1");

        assertNotNull(cache);
        verify(redissonClient).getLocalCachedMapCache(eq("order-cache"), localCachedMapCacheOptionsCaptor.capture());
        verify(mapCache).setMaxSize(20);
        LocalCachedMapCacheOptions<Object, Object> options = localCachedMapCacheOptionsCaptor.getValue();
        assertEquals(LocalCachedMapCacheOptions.CacheProvider.CAFFEINE, options.getCacheProvider());
        assertEquals(LocalCachedMapCacheOptions.SyncStrategy.INVALIDATE, options.getSyncStrategy());
        assertEquals(LocalCachedMapCacheOptions.ReconnectionStrategy.CLEAR, options.getReconnectionStrategy());
        assertEquals(LocalCachedMapCacheOptions.EvictionPolicy.LRU, options.getEvictionPolicy());
        assertEquals(1000, options.getCacheSize());
        assertEquals(TimeUnit.SECONDS.toMillis(30), options.getTimeToLiveInMillis());
    }

    @Test
    @DisplayName("getCache: should create plain redis mapCache when local cache is disabled explicitly")
    void getCacheShouldCreatePlainMapCacheWhenLocalCacheDisabled() {
        PlusSpringCacheManager manager = new PlusSpringCacheManager();
        manager.setTransactionAware(false);
        RMapCache<Object, Object> mapCache = mockMapCache();
        doReturn(mapCache).when(redissonClient).getMapCache("order-cache");

        Cache cache = manager.getCache("order-cache#10s#5s#20#0");

        assertNotNull(cache);
        verify(redissonClient).getMapCache("order-cache");
        verify(mapCache).setMaxSize(20);
    }

    private static LocalCachedMapOptions<Object, Object> anyLocalCachedMapOptions() {
        return any();
    }

    private static LocalCachedMapCacheOptions<Object, Object> anyLocalCachedMapCacheOptions() {
        return any();
    }

    @SuppressWarnings("unchecked")
    private static RLocalCachedMap<Object, Object> mockLocalCachedMap() {
        return (RLocalCachedMap<Object, Object>) Mockito.mock(RLocalCachedMap.class);
    }

    @SuppressWarnings("unchecked")
    private static RLocalCachedMapCache<Object, Object> mockLocalCachedMapCache() {
        return (RLocalCachedMapCache<Object, Object>) Mockito.mock(RLocalCachedMapCache.class);
    }

    @SuppressWarnings("unchecked")
    private static RMap<Object, Object> mockMap() {
        return (RMap<Object, Object>) Mockito.mock(RMap.class);
    }

    @SuppressWarnings("unchecked")
    private static RMapCache<Object, Object> mockMapCache() {
        return (RMapCache<Object, Object>) Mockito.mock(RMapCache.class);
    }
}
