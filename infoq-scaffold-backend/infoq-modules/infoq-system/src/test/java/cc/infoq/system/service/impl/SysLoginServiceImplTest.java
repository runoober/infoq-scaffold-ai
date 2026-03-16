package cc.infoq.system.service.impl;

import cc.infoq.common.constant.CacheConstants;
import cc.infoq.common.constant.Constants;
import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.enums.LoginType;
import cc.infoq.common.exception.user.UserException;
import cc.infoq.common.log.event.LoginInfoEvent;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.MessageUtils;
import cc.infoq.system.domain.vo.SysDeptVo;
import cc.infoq.system.domain.vo.SysPostVo;
import cc.infoq.system.domain.vo.SysRoleVo;
import cc.infoq.system.domain.vo.SysUserVo;
import cc.infoq.system.mapper.SysUserMapper;
import cc.infoq.system.service.SysDeptService;
import cc.infoq.system.service.SysPermissionService;
import cc.infoq.system.service.SysPostService;
import cc.infoq.system.service.SysRoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.redisson.api.RedissonClient;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.PayloadApplicationEvent;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;
import cc.infoq.common.utils.SpringUtils;
import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.stp.StpUtil;
import cc.infoq.system.domain.entity.SysUser;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class SysLoginServiceImplTest {

    @BeforeEach
    void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> org.mockito.Mockito.mock(RedissonClient.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @Mock
    private SysPermissionService permissionService;

    @Mock
    private SysRoleService roleService;

    @Mock
    private SysDeptService deptService;

    @Mock
    private SysPostService postService;

    @Mock
    private SysUserMapper userMapper;

    @Test
    @DisplayName("buildLoginUser: should assemble dept/role/post and permissions")
    void buildLoginUserShouldAssembleProfile() {
        SysLoginServiceImpl service = new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper);
        SysUserVo user = new SysUserVo();
        user.setUserId(100L);
        user.setDeptId(10L);
        user.setUserName("admin");
        user.setNickName("管理员");
        user.setUserType("sys_user");
        SysDeptVo dept = new SysDeptVo();
        dept.setDeptName("研发中心");
        dept.setDeptCategory("tech");
        SysRoleVo role = new SysRoleVo();
        role.setRoleId(1L);
        role.setRoleName("管理员");
        SysPostVo post = new SysPostVo();
        post.setPostId(2L);
        post.setPostName("架构师");
        when(permissionService.getMenuPermission(100L)).thenReturn(Set.of("system:user:list"));
        when(permissionService.getRolePermission(100L)).thenReturn(Set.of("admin"));
        when(deptService.selectDeptById(10L)).thenReturn(dept);
        when(roleService.selectRolesByUserId(100L)).thenReturn(List.of(role));
        when(postService.selectPostsByUserId(100L)).thenReturn(List.of(post));

        var loginUser = service.buildLoginUser(user);

        assertEquals("admin", loginUser.getUsername());
        assertEquals("研发中心", loginUser.getDeptName());
        assertEquals("tech", loginUser.getDeptCategory());
        assertEquals(Set.of("system:user:list"), loginUser.getMenuPermission());
        assertEquals(Set.of("admin"), loginUser.getRolePermission());
        assertNotNull(loginUser.getRoles());
        assertNotNull(loginUser.getPosts());
        assertEquals(1, loginUser.getRoles().size());
        assertEquals(1, loginUser.getPosts().size());
    }

    @Test
    @DisplayName("buildLoginUser: should keep dept fields empty when deptId is null")
    void buildLoginUserShouldHandleNullDept() {
        SysLoginServiceImpl service = new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper);
        SysUserVo user = new SysUserVo();
        user.setUserId(100L);
        user.setDeptId(null);
        user.setUserName("admin");
        user.setNickName("管理员");
        user.setUserType("sys_user");
        when(permissionService.getMenuPermission(100L)).thenReturn(Set.of());
        when(permissionService.getRolePermission(100L)).thenReturn(Set.of());
        when(roleService.selectRolesByUserId(100L)).thenReturn(List.of());
        when(postService.selectPostsByUserId(100L)).thenReturn(List.of());

        var loginUser = service.buildLoginUser(user);

        assertNull(loginUser.getDeptName());
        assertNull(loginUser.getDeptCategory());
    }

    @Test
    @DisplayName("checkLogin: should clear retry cache on successful validation")
    void checkLoginShouldClearRetryCacheOnSuccess() {
        SysLoginServiceImpl service = new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper);
        ReflectionTestUtils.setField(service, "maxRetryCount", 3);
        ReflectionTestUtils.setField(service, "lockTime", 10);
        String errorKey = CacheConstants.PWD_ERR_CNT_KEY + "admin";

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(errorKey)).thenReturn(0);

            service.checkLogin(LoginType.PASSWORD, "admin", () -> false);

            redisUtils.verify(() -> RedisUtils.deleteObject(errorKey));
            redisUtils.verify(() -> RedisUtils.setCacheObject(errorKey, 1, Duration.ofMinutes(10)), never());
        }
    }

    @Test
    @DisplayName("checkLogin: should throw when retry count already exceeds threshold")
    void checkLoginShouldThrowWhenRetryAlreadyExceeded() {
        SysLoginServiceImpl service = spy(new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper));
        ReflectionTestUtils.setField(service, "maxRetryCount", 3);
        ReflectionTestUtils.setField(service, "lockTime", 10);
        String errorKey = CacheConstants.PWD_ERR_CNT_KEY + "admin";
        doNothing().when(service).recordLoginInfo(eq("admin"), eq(Constants.LOGIN_FAIL), anyString());

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(errorKey)).thenReturn(3);

            assertThrows(UserException.class, () -> service.checkLogin(LoginType.PASSWORD, "admin", () -> false));
        }
    }

    @Test
    @DisplayName("checkLogin: should increase retry count and throw on failed validation")
    void checkLoginShouldIncreaseRetryCountWhenValidationFails() {
        SysLoginServiceImpl service = spy(new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper));
        ReflectionTestUtils.setField(service, "maxRetryCount", 3);
        ReflectionTestUtils.setField(service, "lockTime", 10);
        String errorKey = CacheConstants.PWD_ERR_CNT_KEY + "admin";
        doNothing().when(service).recordLoginInfo(eq("admin"), eq(Constants.LOGIN_FAIL), anyString());

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(errorKey)).thenReturn(1);

            assertThrows(UserException.class, () -> service.checkLogin(LoginType.PASSWORD, "admin", () -> true));
            redisUtils.verify(() -> RedisUtils.setCacheObject(errorKey, 2, Duration.ofMinutes(10)));
        }
    }

    @Test
    @DisplayName("checkLogin: should lock account when retry reaches threshold after failure")
    void checkLoginShouldLockWhenRetryReachesThreshold() {
        SysLoginServiceImpl service = spy(new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper));
        ReflectionTestUtils.setField(service, "maxRetryCount", 3);
        ReflectionTestUtils.setField(service, "lockTime", 10);
        String errorKey = CacheConstants.PWD_ERR_CNT_KEY + "admin";
        doNothing().when(service).recordLoginInfo(eq("admin"), eq(Constants.LOGIN_FAIL), anyString());

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(errorKey)).thenReturn(2);

            assertThrows(UserException.class, () -> service.checkLogin(LoginType.PASSWORD, "admin", () -> true));
            redisUtils.verify(() -> RedisUtils.setCacheObject(errorKey, 3, Duration.ofMinutes(10)));
            verify(service).recordLoginInfo(eq("admin"), eq(Constants.LOGIN_FAIL), anyString());
        }
    }

    @Test
    @DisplayName("logout: should record logout info then invoke StpUtil.logout")
    void logoutShouldRecordLogoutInfoAndInvokeStpUtilLogout() {
        SysLoginServiceImpl service = spy(new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper));
        LoginUser loginUser = new LoginUser();
        loginUser.setUsername("admin");
        doNothing().when(service).recordLoginInfo(eq("admin"), eq(Constants.LOGOUT), anyString());

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class);
             MockedStatic<MessageUtils> messageUtils = mockStatic(MessageUtils.class);
             MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            loginHelper.when(LoginHelper::getLoginUser).thenReturn(loginUser);
            messageUtils.when(() -> MessageUtils.message("user.logout.success")).thenReturn("退出成功");

            service.logout();

            verify(service).recordLoginInfo("admin", Constants.LOGOUT, "退出成功");
            stpUtil.verify(StpUtil::logout);
        }
    }

    @Test
    @DisplayName("logout: should swallow NotLoginException from getLoginUser and logout")
    void logoutShouldSwallowNotLoginException() {
        SysLoginServiceImpl service = new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper);

        try (MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class);
             MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            loginHelper.when(LoginHelper::getLoginUser)
                .thenThrow(new NotLoginException("NOT_LOGIN", "default", "token"));
            stpUtil.when(StpUtil::logout)
                .thenThrow(new NotLoginException("NOT_LOGIN", "default", "token"));

            assertDoesNotThrow(service::logout);
            stpUtil.verify(StpUtil::logout);
        }
    }

    @Test
    @DisplayName("recordLoginInfo(username,...): should publish LoginInfoEvent to Spring context")
    void recordLoginInfoShouldPublishEventToSpringContext() {
        SysLoginServiceImpl service = new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper);
        AtomicReference<LoginInfoEvent> eventRef = new AtomicReference<>();
        ApplicationListener<ApplicationEvent> listener = event -> {
            if (event instanceof PayloadApplicationEvent<?> payloadEvent
                && payloadEvent.getPayload() instanceof LoginInfoEvent loginInfoEvent) {
                eventRef.set(loginInfoEvent);
            }
        };
        ((GenericApplicationContext) SpringUtils.context()).addApplicationListener(listener);

        service.recordLoginInfo("alice", Constants.LOGIN_FAIL, "登录失败");

        LoginInfoEvent event = eventRef.get();
        assertNotNull(event);
        assertEquals("alice", event.getUsername());
        assertEquals(Constants.LOGIN_FAIL, event.getStatus());
        assertEquals("登录失败", event.getMessage());
    }

    @Test
    @DisplayName("recordLoginInfo(userId, ip): should update user login fields by mapper")
    void recordLoginInfoByUserIdShouldUpdateUserLoginFields() {
        SysLoginServiceImpl service = new SysLoginServiceImpl(permissionService, roleService, deptService, postService, userMapper);

        service.recordLoginInfo(99L, "127.0.0.1");

        ArgumentCaptor<SysUser> captor = ArgumentCaptor.forClass(SysUser.class);
        verify(userMapper).updateById(captor.capture());
        SysUser actual = captor.getValue();
        assertEquals(99L, actual.getUserId());
        assertEquals("127.0.0.1", actual.getLoginIp());
        assertEquals(99L, actual.getUpdateBy());
        assertNotNull(actual.getLoginDate());
    }
}
