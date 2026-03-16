package cc.infoq.common.redis.utils;

import cc.infoq.common.utils.SpringUtils;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RBatch;
import org.redisson.api.RBucket;
import org.redisson.api.RBucketAsync;
import org.redisson.api.RKeys;
import org.redisson.api.RList;
import org.redisson.api.RMap;
import org.redisson.api.RMapAsync;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RSet;
import org.redisson.api.RTopic;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;
import org.redisson.api.listener.MessageListener;
import org.redisson.api.ObjectListener;
import org.redisson.api.options.KeysScanOptions;
import org.springframework.context.support.GenericApplicationContext;

import java.lang.reflect.Field;
import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class RedisUtilsTest {

    private static RedissonClient redissonClient;
    private static RRateLimiter rateLimiter;
    private static RBucket<Object> bucket;
    private static RKeys keys;
    private static RTopic topic;
    private static RList<Object> list;
    private static RSet<Object> set;
    @SuppressWarnings("rawtypes")
    private static RMap map;
    private static RAtomicLong atomicLong;

    @BeforeAll
    static void initSpringContext() throws Exception {
        redissonClient = mock(RedissonClient.class);
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> redissonClient);
        context.refresh();
        new SpringUtils().setApplicationContext(context);

        // RedisUtils uses a static final client. If another test class initialized it earlier,
        // we must stub that actual client instance to avoid null-returning default mocks.
        Field clientField = RedisUtils.class.getDeclaredField("CLIENT");
        clientField.setAccessible(true);
        Object actualClient = clientField.get(null);
        if (actualClient instanceof RedissonClient && Mockito.mockingDetails(actualClient).isMock()) {
            redissonClient = (RedissonClient) actualClient;
        }

        rateLimiter = mock(RRateLimiter.class);
        bucket = mock(RBucket.class);
        keys = mock(RKeys.class);
        topic = mock(RTopic.class);
        list = mock(RList.class);
        set = mock(RSet.class);
        map = mock(RMap.class);
        atomicLong = mock(RAtomicLong.class);

        when(redissonClient.getRateLimiter(anyString())).thenReturn(rateLimiter);
        when(redissonClient.getBucket(anyString())).thenReturn(bucket);
        when(redissonClient.getKeys()).thenReturn(keys);
        when(redissonClient.getTopic(anyString())).thenReturn(topic);
        when(redissonClient.getList(anyString())).thenReturn(list);
        when(redissonClient.getSet(anyString())).thenReturn(set);
        when(redissonClient.getMap(anyString())).thenReturn((RMap) map);
        when(redissonClient.getAtomicLong(anyString())).thenReturn(atomicLong);
    }

    @Test
    @DisplayName("rateLimiter: should return available permits on acquire success, otherwise -1")
    void rateLimiterShouldWork() {
        when(rateLimiter.tryAcquire()).thenReturn(true, false);
        when(rateLimiter.availablePermits()).thenReturn(9L);

        assertEquals(9L, RedisUtils.rateLimiter("limiter", RateType.OVERALL, 10, 1));
        assertEquals(-1L, RedisUtils.rateLimiter("limiter", RateType.OVERALL, 10, 1, 1));
    }

    @Test
    @DisplayName("publish: should push message and invoke optional consumer")
    void publishShouldWork() {
        RedisUtils.publish("topic1", "hello", msg -> assertEquals("hello", msg));
        RedisUtils.publish("topic1", "hello2");
        verify(topic).publish("hello");
        verify(topic).publish("hello2");
    }

    @Test
    @DisplayName("getClient/subscribe: should expose client and register topic listener")
    void getClientAndSubscribeShouldWork() {
        AtomicReference<String> messageRef = new AtomicReference<>();
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            MessageListener<String> listener = invocation.getArgument(1);
            listener.onMessage("topic:demo", "payload");
            return 1;
        }).when(topic).addListener(eq(String.class), any(MessageListener.class));

        RedisUtils.subscribe("topic:demo", String.class, messageRef::set);

        assertSame(redissonClient, RedisUtils.getClient());
        assertEquals("payload", messageRef.get());
    }

    @Test
    @DisplayName("set/get/expire/delete: should delegate common bucket operations")
    void bucketOperationsShouldWork() {
        when(bucket.setIfAbsent("v1", Duration.ofSeconds(10))).thenReturn(true);
        when(bucket.setIfExists("v1", Duration.ofSeconds(10))).thenReturn(false);
        when(bucket.expire(Duration.ofSeconds(20))).thenReturn(true);
        when(bucket.get()).thenReturn("cached");
        when(bucket.remainTimeToLive()).thenReturn(1500L);
        when(bucket.delete()).thenReturn(true);
        when(bucket.isExists()).thenReturn(true);

        RedisUtils.setCacheObject("k", "v1");
        RedisUtils.setCacheObject("k", "v2", Duration.ofSeconds(10));
        assertTrue(RedisUtils.setObjectIfAbsent("k", "v1", Duration.ofSeconds(10)));
        assertFalse(RedisUtils.setObjectIfExists("k", "v1", Duration.ofSeconds(10)));
        assertTrue(RedisUtils.expire("k", 20));
        assertEquals("cached", RedisUtils.getCacheObject("k"));
        assertEquals(1500L, RedisUtils.getTimeToLive("k"));
        assertTrue(RedisUtils.deleteObject("k"));
        assertTrue(RedisUtils.isExistsObject("k"));
    }

    @Test
    @DisplayName("setCacheObject keepTTL fallback: should fallback to set with current ttl when keepTTL fails")
    void setCacheObjectKeepTtlFallbackShouldWork() {
        doThrow(new RuntimeException("keep ttl unsupported")).when(bucket).setAndKeepTTL("v3");
        when(bucket.remainTimeToLive()).thenReturn(2000L);

        RedisUtils.setCacheObject("k", "v3", true);
        verify(bucket).set("v3", Duration.ofMillis(2000L));
    }

    @Test
    @DisplayName("setCacheObject keepTTL fallback: should fallback to plain set when ttl is -1")
    void setCacheObjectKeepTtlFallbackWhenNoTtlShouldUsePlainSet() {
        doThrow(new RuntimeException("keep ttl unsupported")).when(bucket).setAndKeepTTL("v4");
        when(bucket.remainTimeToLive()).thenReturn(-1L);

        RedisUtils.setCacheObject("k", "v4", true);

        verify(bucket).set("v4");
    }

    @Test
    @DisplayName("keys/deleteKeys/hasKey: should query and delete keys by pattern")
    void keyOperationsShouldWork() {
        when(keys.getKeysStream(any(KeysScanOptions.class))).thenReturn(Stream.of("app:k1", "app:k2"));
        when(keys.countExists("app:k1")).thenReturn(1L);

        Collection<String> matched = RedisUtils.keys("app:*");
        RedisUtils.deleteKeys("app:*");

        assertEquals(List.of("app:k1", "app:k2"), matched.stream().toList());
        assertTrue(RedisUtils.hasKey("app:k1"));
        verify(keys).deleteByPattern("app:*");
    }

    @Test
    @DisplayName("delMultiCacheMapValue: should remove every hash key via batch map async")
    void delMultiCacheMapValueShouldRemoveEveryHashKeyViaBatchMapAsync() {
        RBatch batch = mock(RBatch.class);
        @SuppressWarnings("rawtypes")
        RMapAsync mapAsync = mock(RMapAsync.class);
        when(redissonClient.createBatch()).thenReturn(batch);
        when(batch.getMap("hash:key")).thenReturn(mapAsync);

        RedisUtils.delMultiCacheMapValue("hash:key", Set.of("f1", "f2"));

        verify(mapAsync).removeAsync("f1");
        verify(mapAsync).removeAsync("f2");
        verify(batch).execute();
    }

    @Test
    @DisplayName("deleteObject(collection): should delete all buckets through batch")
    void deleteObjectCollectionShouldUseBatch() {
        RBatch batch = mock(RBatch.class);
        @SuppressWarnings("rawtypes")
        RBucketAsync bucketAsync = mock(RBucketAsync.class);
        when(redissonClient.createBatch()).thenReturn(batch);
        when(batch.getBucket(anyString())).thenReturn(bucketAsync);

        RedisUtils.deleteObject(List.of("k1", "k2"));

        verify(batch).getBucket("k1");
        verify(batch).getBucket("k2");
        verify(batch).execute();
    }

    @Test
    @DisplayName("list/set/map/atomic operations: should delegate to corresponding redis structures")
    void listSetMapAndAtomicOperationsShouldWork() {
        ObjectListener listener = mock(ObjectListener.class);

        when(list.addAll(List.of("l1", "l2"))).thenReturn(true);
        when(list.add("l3")).thenReturn(true);
        when(list.readAll()).thenReturn(List.of("l1", "l2", "l3"));
        when(list.range(0, 1)).thenReturn(List.of("l1", "l2"));

        when(set.addAll(Set.of("s1", "s2"))).thenReturn(true);
        when(set.add("s3")).thenReturn(true);
        when(set.readAll()).thenReturn(Set.of("s1", "s2", "s3"));

        when(map.keySet()).thenReturn(Set.of("f1", "f2"));
        when(map.getAll(Set.of("f1", "f2"))).thenReturn(Map.of("f1", "v1", "f2", "v2"));
        when(map.get("f1")).thenReturn("v1");
        when(map.remove("f1")).thenReturn("v1");
        when(map.getAll(Set.of("f1"))).thenReturn(Map.of("f1", "v1"));

        when(atomicLong.get()).thenReturn(10L);
        when(atomicLong.incrementAndGet()).thenReturn(11L);
        when(atomicLong.decrementAndGet()).thenReturn(10L);

        assertTrue(RedisUtils.setCacheList("list:key", List.of("l1", "l2")));
        assertTrue(RedisUtils.addCacheList("list:key", "l3"));
        RedisUtils.addListListener("list:key", listener);
        assertEquals(List.of("l1", "l2", "l3"), RedisUtils.getCacheList("list:key"));
        assertEquals(List.of("l1", "l2"), RedisUtils.getCacheListRange("list:key", 0, 1));

        assertTrue(RedisUtils.setCacheSet("set:key", Set.of("s1", "s2")));
        assertTrue(RedisUtils.addCacheSet("set:key", "s3"));
        RedisUtils.addSetListener("set:key", listener);
        assertEquals(Set.of("s1", "s2", "s3"), RedisUtils.getCacheSet("set:key"));

        RedisUtils.setCacheMap("map:key", Map.of("f1", "v1", "f2", "v2"));
        RedisUtils.setCacheMap("map:key", null);
        RedisUtils.addMapListener("map:key", listener);
        assertEquals(Map.of("f1", "v1", "f2", "v2"), RedisUtils.getCacheMap("map:key"));
        assertEquals(Set.of("f1", "f2"), RedisUtils.getCacheMapKeySet("map:key"));
        RedisUtils.setCacheMapValue("map:key", "f3", "v3");
        assertEquals("v1", RedisUtils.getCacheMapValue("map:key", "f1"));
        assertEquals("v1", RedisUtils.delCacheMapValue("map:key", "f1"));
        assertEquals(Map.of("f1", "v1"), RedisUtils.getMultiCacheMapValue("map:key", Set.of("f1")));

        RedisUtils.addObjectListener("obj:key", listener);

        RedisUtils.setAtomicValue("atomic:key", 10L);
        assertEquals(10L, RedisUtils.getAtomicValue("atomic:key"));
        assertEquals(11L, RedisUtils.incrAtomicValue("atomic:key"));
        assertEquals(10L, RedisUtils.decrAtomicValue("atomic:key"));
    }
}
