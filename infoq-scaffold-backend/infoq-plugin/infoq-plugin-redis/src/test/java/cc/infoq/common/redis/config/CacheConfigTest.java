package cc.infoq.common.redis.config;

import cc.infoq.common.redis.manager.PlusSpringCacheManager;
import com.github.benmanes.caffeine.cache.Cache;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@Tag("dev")
class CacheConfigTest {

    @Test
    @DisplayName("caffeine/cacheManager: should create local cache and custom cache manager")
    void cacheBeansShouldBeCreated() {
        CacheConfig config = new CacheConfig();

        Cache<Object, Object> caffeine = config.caffeine();
        caffeine.put("k", "v");

        CacheManager cacheManager = config.cacheManager();
        assertNotNull(caffeine);
        assertEquals("v", caffeine.getIfPresent("k"));
        assertInstanceOf(PlusSpringCacheManager.class, cacheManager);
    }
}
