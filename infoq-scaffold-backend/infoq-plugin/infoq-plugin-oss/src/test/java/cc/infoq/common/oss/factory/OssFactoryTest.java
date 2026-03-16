package cc.infoq.common.oss.factory;

import cc.infoq.common.constant.CacheNames;
import cc.infoq.common.oss.constant.OssConstant;
import cc.infoq.common.oss.core.OssClient;
import cc.infoq.common.oss.exception.OssException;
import cc.infoq.common.oss.properties.OssProperties;
import cc.infoq.common.utils.SpringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.support.GenericApplicationContext;

import java.lang.reflect.Field;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

@Tag("dev")
class OssFactoryTest {

    private static RedissonClient redissonClient;
    private static RBucket<Object> redissonBucket;
    private static CacheManager cacheManager;
    private static Cache cache;
    private static ObjectMapper objectMapper;

    @BeforeAll
    static void initSpringContext() {
        redissonClient = mock(RedissonClient.class);
        redissonBucket = mock(RBucket.class);
        when(redissonClient.getBucket(anyString())).thenReturn(redissonBucket);

        cacheManager = mock(CacheManager.class);
        cache = mock(Cache.class);
        when(cacheManager.getCache(anyString())).thenReturn(cache);

        objectMapper = new ObjectMapper();

        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> redissonClient);
        context.registerBean(CacheManager.class, () -> cacheManager);
        context.registerBean(ObjectMapper.class, () -> objectMapper);
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @BeforeEach
    void resetState() throws Exception {
        reset(redissonBucket, cacheManager, cache, redissonClient);
        when(redissonClient.getBucket(anyString())).thenReturn(redissonBucket);
        when(cacheManager.getCache(anyString())).thenReturn(cache);
        clientCache().clear();
    }

    @AfterEach
    void clearCache() throws Exception {
        clientCache().clear();
    }

    @Test
    @DisplayName("constructor: should allow default instantiation for coverage")
    void constructorShouldBeInstantiable() {
        assertTrue(new OssFactory() != null);
    }

    @Test
    @DisplayName("instance: should throw when default config key is missing")
    void instanceShouldThrowWhenDefaultConfigMissing() {
        when(redissonBucket.get()).thenReturn(null);
        assertThrows(OssException.class, OssFactory::instance);
    }

    @Test
    @DisplayName("instance(configKey): should throw when config payload is missing")
    void instanceByConfigShouldThrowWhenPayloadMissing() {
        when(cache.get("aliyun")).thenReturn(null);
        assertThrows(OssException.class, () -> OssFactory.instance("aliyun"));
    }

    @Test
    @DisplayName("instance(configKey): should reuse cached client when properties are unchanged")
    void instanceByConfigShouldReuseCachedClient() throws Exception {
        stubConfigJson("aliyun", buildJson("0"));

        try (MockedConstruction<OssClient> construction = mockConstruction(OssClient.class,
            (mock, context) -> when(mock.checkPropertiesSame(any())).thenReturn(true))) {

            OssClient first = OssFactory.instance("aliyun");
            OssClient second = OssFactory.instance("aliyun");

            assertSame(first, second);
            assertEqualsInt(1, construction.constructed().size());
        }
    }

    @Test
    @DisplayName("instance(configKey): should rebuild client when cached properties mismatch")
    void instanceByConfigShouldRebuildWhenPropertiesChanged() throws Exception {
        OssClient stale = mock(OssClient.class);
        when(stale.checkPropertiesSame(any())).thenReturn(false);
        clientCache().put("aliyun", stale);
        stubConfigJson("aliyun", buildJson("1"));

        try (MockedConstruction<OssClient> construction = mockConstruction(OssClient.class,
            (mock, context) -> when(mock.checkPropertiesSame(any())).thenReturn(true))) {

            OssClient latest = OssFactory.instance("aliyun");

            assertTrue(latest != stale);
            assertEqualsInt(1, construction.constructed().size());
        }
    }

    @Test
    @DisplayName("instance: should route through default config key")
    void defaultInstanceShouldRouteByConfigKey() throws Exception {
        when(redissonBucket.get()).thenReturn("aliyun");
        stubConfigJson("aliyun", buildJson("2"));

        try (MockedConstruction<OssClient> construction = mockConstruction(OssClient.class,
            (mock, context) -> when(mock.checkPropertiesSame(any())).thenReturn(true))) {

            OssClient client = OssFactory.instance();

            assertTrue(client != null);
            assertEqualsInt(1, construction.constructed().size());
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, OssClient> clientCache() throws Exception {
        Field field = OssFactory.class.getDeclaredField("CLIENT_CACHE");
        field.setAccessible(true);
        return (Map<String, OssClient>) field.get(null);
    }

    private static void stubConfigJson(String configKey, String json) {
        Cache.ValueWrapper wrapper = mock(Cache.ValueWrapper.class);
        when(wrapper.get()).thenReturn(json);
        when(cache.get(configKey)).thenReturn(wrapper);
        when(cacheManager.getCache(CacheNames.SYS_OSS_CONFIG)).thenReturn(cache);
    }

    private static String buildJson(String accessPolicy) throws Exception {
        OssProperties properties = new OssProperties();
        properties.setEndpoint("127.0.0.1:9000");
        properties.setBucketName("bucket");
        properties.setAccessKey("ak");
        properties.setSecretKey("sk");
        properties.setIsHttps("N");
        properties.setAccessPolicy(accessPolicy);
        return objectMapper.writeValueAsString(properties);
    }

    private static void assertEqualsInt(int expected, int actual) {
        if (expected != actual) {
            throw new AssertionError("expected=" + expected + ", actual=" + actual);
        }
    }
}
