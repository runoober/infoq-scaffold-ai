package cc.infoq.common.mybatis.helper;

import cc.infoq.common.mybatis.annotation.DataPermission;
import cn.dev33.satoken.context.SaHolder;
import cn.dev33.satoken.context.model.SaStorage;
import com.baomidou.mybatisplus.core.plugins.IgnoreStrategy;
import com.baomidou.mybatisplus.core.plugins.InterceptorIgnoreHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@Tag("dev")
class DataPermissionHelperTest {

    @AfterEach
    void tearDown() {
        DataPermissionHelper.removePermission();
        InterceptorIgnoreHelper.clearIgnoreStrategy();
    }

    @Test
    void permissionCacheShouldSupportSetGetAndRemove() {
        DataPermission permission = mock(DataPermission.class);

        DataPermissionHelper.setPermission(permission);
        assertSame(permission, DataPermissionHelper.getPermission());

        DataPermissionHelper.removePermission();
        assertNull(DataPermissionHelper.getPermission());
    }

    @Test
    void contextAndVariablesShouldBeStoredInSaStorage() {
        Map<String, Object> attributes = new HashMap<>();
        SaStorage storage = mockStorage(attributes);

        try (MockedStatic<SaHolder> saHolder = mockStatic(SaHolder.class)) {
            saHolder.when(SaHolder::getStorage).thenReturn(storage);

            Map<String, Object> context = DataPermissionHelper.getContext();
            assertNotNull(context);
            assertTrue(context.isEmpty());

            DataPermissionHelper.setVariable("deptId", 10L);
            assertEquals(10L, DataPermissionHelper.<Long>getVariable("deptId"));
            assertSame(context, attributes.get("data:permission"));
        }
    }

    @Test
    void getContextShouldThrowWhenAttributeTypeIsInvalid() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("data:permission", "invalid");
        SaStorage storage = mockStorage(attributes);

        try (MockedStatic<SaHolder> saHolder = mockStatic(SaHolder.class)) {
            saHolder.when(SaHolder::getStorage).thenReturn(storage);
            assertThrows(NullPointerException.class, DataPermissionHelper::getContext);
        }
    }

    @Test
    void ignoreRunnableShouldClearStrategyWhenNoOtherIgnoreFlagsExist() {
        AtomicBoolean executed = new AtomicBoolean(false);

        DataPermissionHelper.ignore(() -> executed.set(true));

        assertTrue(executed.get());
        assertNull(currentIgnoreStrategy());
    }

    @Test
    void ignoreSupplierShouldKeepExistingStrategyAndResetDataPermissionOnly() {
        InterceptorIgnoreHelper.handle(IgnoreStrategy.builder().dynamicTableName(true).build());

        String result = DataPermissionHelper.ignore(() -> "ok");

        assertEquals("ok", result);
        IgnoreStrategy strategy = currentIgnoreStrategy();
        assertNotNull(strategy);
        assertEquals(Boolean.TRUE, strategy.getDynamicTableName());
        assertEquals(Boolean.FALSE, strategy.getDataPermission());
    }

    @Test
    void nestedIgnoreShouldPreserveInnerStateUntilOuterFinishes() {
        AtomicBoolean innerExecuted = new AtomicBoolean(false);
        AtomicReference<Boolean> dataPermissionInsideOuter = new AtomicReference<>();

        DataPermissionHelper.ignore(() -> {
            DataPermissionHelper.ignore(() -> innerExecuted.set(true));
            IgnoreStrategy current = currentIgnoreStrategy();
            dataPermissionInsideOuter.set(current == null ? null : current.getDataPermission());
        });

        assertTrue(innerExecuted.get());
        assertEquals(Boolean.TRUE, dataPermissionInsideOuter.get());
        assertNull(currentIgnoreStrategy());
    }

    private static SaStorage mockStorage(Map<String, Object> attributes) {
        SaStorage storage = mock(SaStorage.class);
        when(storage.get(anyString())).thenAnswer(invocation -> attributes.get(invocation.getArgument(0)));
        doAnswer(invocation -> {
            attributes.put(invocation.getArgument(0), invocation.getArgument(1));
            return storage;
        }).when(storage).set(anyString(), any());
        return storage;
    }

    @SuppressWarnings("unchecked")
    private static IgnoreStrategy currentIgnoreStrategy() {
        try {
            Field field = InterceptorIgnoreHelper.class.getDeclaredField("IGNORE_STRATEGY_LOCAL");
            field.setAccessible(true);
            ThreadLocal<IgnoreStrategy> local = (ThreadLocal<IgnoreStrategy>) field.get(null);
            return local.get();
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new IllegalStateException("Unable to read ignore strategy", e);
        }
    }
}
