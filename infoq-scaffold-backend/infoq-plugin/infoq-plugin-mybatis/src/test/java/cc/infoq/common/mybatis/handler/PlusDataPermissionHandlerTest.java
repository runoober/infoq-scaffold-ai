package cc.infoq.common.mybatis.handler;

import cc.infoq.common.domain.dto.RoleDTO;
import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.mybatis.annotation.DataColumn;
import cc.infoq.common.mybatis.annotation.DataPermission;
import cc.infoq.common.mybatis.helper.DataPermissionHelper;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.SpringUtils;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.PropertyAccessor;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("dev")
class PlusDataPermissionHandlerTest {

    @BeforeAll
    static void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @Test
    @DisplayName("invalid/getDataPermission: should reflect helper state")
    void invalidAndGetDataPermissionShouldReflectHelperState() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation();
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(null);
            assertTrue(handler.invalid());
        }

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            assertSame(dataPermission, handler.getDataPermission());
            assertFalse(handler.invalid());
        }
    }

    @Test
    @DisplayName("getSqlSegment: should return original where clause for super admin")
    void getSqlSegmentShouldReturnOriginalWhereWhenSuperAdmin() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation();
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(1L);
        loginUser.setMenuPermission(Set.of());
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();
        Expression where = CCJSqlParserUtil.parseCondExpression("status = 1");

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            helper.when(() -> DataPermissionHelper.getVariable("user", LoginUser.class)).thenReturn(loginUser);
            loginHelper.when(LoginHelper::isSuperAdmin).thenReturn(true);

            Expression result = handler.getSqlSegment(where, true);
            assertSame(where, result);
        }
    }

    @Test
    @DisplayName("getSqlSegment: should append dept filter for non-super admin")
    void getSqlSegmentShouldAppendDeptFilterForNormalUser() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation("query");
        LoginUser loginUser = loginUser("3", Set.of());
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();
        Expression where = CCJSqlParserUtil.parseCondExpression("status = 1");
        Map<String, Object> context = new HashMap<>();
        context.put("user", loginUser);

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            helper.when(() -> DataPermissionHelper.getVariable("user", LoginUser.class)).thenReturn(loginUser);
            helper.when(DataPermissionHelper::getContext).thenReturn(context);
            helper.when(() -> DataPermissionHelper.ignore(org.mockito.ArgumentMatchers.<Supplier<String>>any()))
                .thenAnswer(PlusDataPermissionHandlerTest::invokeSupplier);
            loginHelper.when(LoginHelper::isSuperAdmin).thenReturn(false);

            Expression result = handler.getSqlSegment(where, true);
            assertNotNull(result);
            assertTrue(result.toString().contains("status = 1"));
            assertTrue(result.toString().contains("dept_id = 100"));
            helper.verify(DataPermissionHelper::removePermission);
        }
    }

    @Test
    @DisplayName("getSqlSegment: should use else sql when template variable mismatches")
    void getSqlSegmentShouldUseElseSqlWhenTemplateVariableMismatches() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation("elseFallback");
        LoginUser loginUser = loginUser("3", Set.of());
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();
        Map<String, Object> context = new HashMap<>();
        context.put("user", loginUser);

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            helper.when(() -> DataPermissionHelper.getVariable("user", LoginUser.class)).thenReturn(loginUser);
            helper.when(DataPermissionHelper::getContext).thenReturn(context);
            helper.when(() -> DataPermissionHelper.ignore(org.mockito.ArgumentMatchers.<Supplier<String>>any()))
                .thenAnswer(PlusDataPermissionHandlerTest::invokeSupplier);
            loginHelper.when(LoginHelper::isSuperAdmin).thenReturn(false);

            Expression result = handler.getSqlSegment(null, true);
            assertNotNull(result);
            assertTrue(result.toString().contains("1 = 0"));
        }
    }

    @Test
    @DisplayName("getSqlSegment: should short-circuit with permission identifier")
    void getSqlSegmentShouldShortCircuitWhenPermissionMatches() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation("permissionSkip");
        LoginUser loginUser = loginUser("3", Set.of("sys:skip"));
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();
        Map<String, Object> context = new HashMap<>();
        context.put("user", loginUser);

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            helper.when(() -> DataPermissionHelper.getVariable("user", LoginUser.class)).thenReturn(loginUser);
            helper.when(DataPermissionHelper::getContext).thenReturn(context);
            helper.when(() -> DataPermissionHelper.ignore(org.mockito.ArgumentMatchers.<Supplier<String>>any()))
                .thenAnswer(PlusDataPermissionHandlerTest::invokeSupplier);
            loginHelper.when(LoginHelper::isSuperAdmin).thenReturn(false);

            Expression result = handler.getSqlSegment(null, true);
            assertNotNull(result);
            assertTrue(result.toString().contains("1 = 1"));
        }
    }

    @Test
    @DisplayName("getSqlSegment: should throw when role data scope is invalid")
    void getSqlSegmentShouldThrowWhenRoleDataScopeInvalid() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation("query");
        LoginUser loginUser = loginUser("unknown", Set.of());
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();
        Map<String, Object> context = new HashMap<>();
        context.put("user", loginUser);

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            helper.when(() -> DataPermissionHelper.getVariable("user", LoginUser.class)).thenReturn(loginUser);
            helper.when(DataPermissionHelper::getContext).thenReturn(context);
            loginHelper.when(LoginHelper::isSuperAdmin).thenReturn(false);

            assertThrows(ServiceException.class, () -> handler.getSqlSegment(null, true));
        }
    }

    @Test
    @DisplayName("getSqlSegment: should throw when key/value length mismatches")
    void getSqlSegmentShouldThrowWhenKeyValueLengthMismatches() throws Exception {
        DataPermission dataPermission = getDataPermissionAnnotation("invalidLength");
        LoginUser loginUser = loginUser("3", Set.of());
        PlusDataPermissionHandler handler = new PlusDataPermissionHandler();
        Map<String, Object> context = new HashMap<>();
        context.put("user", loginUser);

        try (MockedStatic<DataPermissionHelper> helper = mockStatic(DataPermissionHelper.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            helper.when(DataPermissionHelper::getPermission).thenReturn(dataPermission);
            helper.when(() -> DataPermissionHelper.getVariable("user", LoginUser.class)).thenReturn(loginUser);
            helper.when(DataPermissionHelper::getContext).thenReturn(context);
            loginHelper.when(LoginHelper::isSuperAdmin).thenReturn(false);

            assertThrows(ServiceException.class, () -> handler.getSqlSegment(null, false));
        }
    }

    @Test
    @DisplayName("NullSafePropertyAccessor: should delegate canWrite/write to original accessor")
    void nullSafePropertyAccessorShouldDelegateWriteOperations() throws Exception {
        Class<?> accessorClass = Class.forName(
            "cc.infoq.common.mybatis.handler.PlusDataPermissionHandler$NullSafePropertyAccessor");
        Constructor<?> constructor = accessorClass.getDeclaredConstructor(PropertyAccessor.class, Object.class);
        constructor.setAccessible(true);
        Method canWrite = accessorClass.getDeclaredMethod(
            "canWrite", EvaluationContext.class, Object.class, String.class);
        Method write = accessorClass.getDeclaredMethod(
            "write", EvaluationContext.class, Object.class, String.class, Object.class);

        PropertyAccessor delegate = mock(PropertyAccessor.class);
        EvaluationContext context = mock(EvaluationContext.class);
        Object target = new Object();
        when(delegate.canWrite(eq(context), eq(target), eq("deptId"))).thenReturn(true);

        Object accessor = constructor.newInstance(delegate, "-1");
        boolean writable = (boolean) canWrite.invoke(accessor, context, target, "deptId");
        write.invoke(accessor, context, target, "deptId", 100L);

        assertTrue(writable);
        verify(delegate).canWrite(context, target, "deptId");
        verify(delegate).write(context, target, "deptId", 100L);
    }

    private static LoginUser loginUser(String dataScope, Set<String> menuPermissions) {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(10L);
        loginUser.setDeptId(100L);
        loginUser.setMenuPermission(menuPermissions);
        RoleDTO role = new RoleDTO();
        role.setRoleId(1L);
        role.setDataScope(dataScope);
        loginUser.setRoles(List.of(role));
        return loginUser;
    }

    private static DataPermission getDataPermissionAnnotation() throws Exception {
        return getDataPermissionAnnotation("query");
    }

    private static DataPermission getDataPermissionAnnotation(String methodName) throws Exception {
        return DemoMapper.class.getDeclaredMethod(methodName).getAnnotation(DataPermission.class);
    }

    private static String invokeSupplier(org.mockito.invocation.InvocationOnMock invocation) {
        Supplier<String> supplier = invocation.getArgument(0);
        return supplier.get();
    }

    private interface DemoMapper {

        @DataPermission(value = {@DataColumn(key = {"deptName"}, value = {"dept_id"})})
        void query();

        @DataPermission(value = {@DataColumn(key = {"otherKey"}, value = {"dept_id"})})
        void elseFallback();

        @DataPermission(value = {@DataColumn(key = {"deptName", "userName"}, value = {"dept_id"})})
        void invalidLength();

        @DataPermission(value = {@DataColumn(key = {"deptName"}, value = {"dept_id"}, permission = "sys:skip")})
        void permissionSkip();
    }
}
