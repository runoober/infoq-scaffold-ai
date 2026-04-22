package cc.infoq.common.satoken.core.dao;

import cc.infoq.common.redis.utils.RedisUtils;
import cn.dev33.satoken.dao.SaTokenDao;
import cn.dev33.satoken.util.SaFoxUtil;
import com.github.benmanes.caffeine.cache.Cache;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.redisson.api.RedissonClient;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

@Tag("dev")
class PlusSaTokenDaoTest {

    private final PlusSaTokenDao dao = new PlusSaTokenDao();

    @BeforeAll
    static void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> mock(RedissonClient.class));
        context.refresh();
        new cc.infoq.common.utils.SpringUtils().setApplicationContext(context);
    }

    @BeforeEach
    void clearCaffeine() {
        Object caffeine = ReflectionTestUtils.getField(PlusSaTokenDao.class, "CAFFEINE");
        if (caffeine instanceof Cache<?, ?> cache) {
            cache.invalidateAll();
        }
    }

    @Test
    @DisplayName("get/getObject: should read redis once then hit caffeine cache")
    void getAndGetObjectShouldUseCaffeineCache() {
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject("token:key")).thenReturn("v1");
            redisUtils.when(() -> RedisUtils.getCacheObject("obj:key")).thenReturn(123L);
            redisUtils.when(() -> RedisUtils.getCacheObject("obj:typed")).thenReturn(456L);

            assertEquals("v1", dao.get("token:key"));
            assertEquals("v1", dao.get("token:key"));
            assertEquals(123L, dao.getObject("obj:key"));
            assertEquals(456L, dao.getObject("obj:typed", Long.class));

            redisUtils.verify(() -> RedisUtils.getCacheObject("token:key"), times(1));
            redisUtils.verify(() -> RedisUtils.getCacheObject("obj:key"), times(1));
            redisUtils.verify(() -> RedisUtils.getCacheObject("obj:typed"), times(1));
        }
    }

    @Test
    @DisplayName("set/update/delete/timeout: should follow timeout and key-existence branches")
    void stringValueOperationsShouldFollowBranches() {
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            dao.set("skip-zero", "v", 0);
            dao.set("skip-negative", "v", SaTokenDao.NOT_VALUE_EXPIRE);
            dao.set("never", "v1", SaTokenDao.NEVER_EXPIRE);
            dao.set("ttl", "v2", 10);

            redisUtils.when(() -> RedisUtils.hasKey("exists")).thenReturn(true);
            redisUtils.when(() -> RedisUtils.hasKey("missing")).thenReturn(false);
            dao.update("exists", "v3");
            dao.update("missing", "v4");

            redisUtils.when(() -> RedisUtils.deleteObject("deleted")).thenReturn(true);
            redisUtils.when(() -> RedisUtils.deleteObject("not-deleted")).thenReturn(false);
            dao.delete("deleted");
            dao.delete("not-deleted");

            redisUtils.when(() -> RedisUtils.getTimeToLive("ttl:key")).thenReturn(2500L);
            redisUtils.when(() -> RedisUtils.getTimeToLive("expired:key")).thenReturn(-1L);
            assertEquals(3L, dao.getTimeout("ttl:key"));
            assertEquals(-1L, dao.getTimeout("expired:key"));

            dao.updateTimeout("timeout:key", 9);

            redisUtils.verify(() -> RedisUtils.setCacheObject("never", "v1"));
            redisUtils.verify(() -> RedisUtils.setCacheObject("ttl", "v2", Duration.ofSeconds(10)));
            redisUtils.verify(() -> RedisUtils.setCacheObject("exists", "v3", true));
            redisUtils.verify(() -> RedisUtils.setCacheObject("missing", "v4", true), times(0));
            redisUtils.verify(() -> RedisUtils.expire("timeout:key", Duration.ofSeconds(9)));
        }
    }

    @Test
    @DisplayName("setObject/updateObject/deleteObject/objectTimeout: should handle object value branches")
    void objectOperationsShouldFollowBranches() {
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            dao.setObject("obj-skip-zero", "v", 0);
            dao.setObject("obj-skip-negative", "v", SaTokenDao.NOT_VALUE_EXPIRE);
            dao.setObject("obj-never", "o1", SaTokenDao.NEVER_EXPIRE);
            dao.setObject("obj-ttl", "o2", 8);

            redisUtils.when(() -> RedisUtils.hasKey("obj-exists")).thenReturn(true);
            redisUtils.when(() -> RedisUtils.hasKey("obj-missing")).thenReturn(false);
            dao.updateObject("obj-exists", "o3");
            dao.updateObject("obj-missing", "o4");

            redisUtils.when(() -> RedisUtils.deleteObject("obj-deleted")).thenReturn(true);
            redisUtils.when(() -> RedisUtils.deleteObject("obj-not-deleted")).thenReturn(false);
            dao.deleteObject("obj-deleted");
            dao.deleteObject("obj-not-deleted");

            redisUtils.when(() -> RedisUtils.getTimeToLive("obj-ttl:key")).thenReturn(4500L);
            redisUtils.when(() -> RedisUtils.getTimeToLive("obj-expired:key")).thenReturn(-2L);
            assertEquals(5L, dao.getObjectTimeout("obj-ttl:key"));
            assertEquals(-2L, dao.getObjectTimeout("obj-expired:key"));

            dao.updateObjectTimeout("obj-timeout:key", 12);

            redisUtils.verify(() -> RedisUtils.setCacheObject("obj-never", "o1"));
            redisUtils.verify(() -> RedisUtils.setCacheObject("obj-ttl", "o2", Duration.ofSeconds(8)));
            redisUtils.verify(() -> RedisUtils.setCacheObject("obj-exists", "o3", true));
            redisUtils.verify(() -> RedisUtils.setCacheObject("obj-missing", "o4", true), times(0));
            redisUtils.verify(() -> RedisUtils.expire("obj-timeout:key", Duration.ofSeconds(12)));
        }
    }

    @Test
    @DisplayName("searchData: should delegate redis key scan and cache the result")
    void searchDataShouldCacheResult() {
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            List<String> redisKeys = List.of("satoken:abc:1", "satoken:abc:3", "satoken:abc:2");
            redisUtils.when(() -> RedisUtils.keys("satoken:*abc*")).thenReturn(redisKeys);

            List<String> expected = SaFoxUtil.searchList(new ArrayList<>(redisKeys), 0, 2, true);
            List<String> first = dao.searchData("satoken:", "abc", 0, 2, true);
            List<String> second = dao.searchData("satoken:", "abc", 0, 2, true);

            assertEquals(expected, first);
            assertEquals(first, second);
            redisUtils.verify(() -> RedisUtils.keys("satoken:*abc*"), times(1));
        }
    }

    @Test
    @DisplayName("searchData: should return empty list when redis keys are empty")
    void searchDataShouldSupportEmptyKeys() {
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.keys("prefix:*none*")).thenReturn(List.of());

            List<String> result = dao.searchData("prefix:", "none", 0, 10, false);
            assertEquals(List.of(), result);
        }
    }

    @Test
    @DisplayName("get/getObject: should return null when redis has no value")
    void getAndGetObjectShouldSupportNullValue() {
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject("null-key")).thenReturn(null);
            redisUtils.when(() -> RedisUtils.getCacheObject("null-object-key")).thenReturn(null);
            redisUtils.when(() -> RedisUtils.getCacheObject("null-typed-key")).thenReturn(null);

            assertNull(dao.get("null-key"));
            assertNull(dao.getObject("null-object-key"));
            assertNull(dao.getObject("null-typed-key", Object.class));
        }
    }
}
