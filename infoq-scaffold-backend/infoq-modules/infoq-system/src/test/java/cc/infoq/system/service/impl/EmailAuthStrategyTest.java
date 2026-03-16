package cc.infoq.system.service.impl;

import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.enums.LoginType;
import cc.infoq.common.exception.user.UserException;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.system.domain.vo.LoginVo;
import cc.infoq.system.domain.vo.SysClientVo;
import cc.infoq.system.domain.vo.SysUserVo;
import cc.infoq.system.mapper.SysUserMapper;
import cc.infoq.system.service.SysLoginService;
import cn.dev33.satoken.stp.StpUtil;
import cc.infoq.common.constant.SystemConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RedissonClient;
import org.springframework.context.support.GenericApplicationContext;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class EmailAuthStrategyTest {

    private GenericApplicationContext context;

    @Mock
    private SysLoginService loginService;
    @Mock
    private SysUserMapper userMapper;

    @BeforeEach
    void initSpringContext() {
        context = new GenericApplicationContext();
        context.registerBean(ObjectMapper.class, () -> new ObjectMapper());
        context.registerBean(Validator.class, () -> Validation.buildDefaultValidatorFactory().getValidator());
        context.registerBean(RedissonClient.class, () -> org.mockito.Mockito.mock(RedissonClient.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @AfterEach
    void tearDown() {
        if (context != null) {
            context.close();
        }
    }

    @Test
    @DisplayName("loadUserByEmail: should throw when user does not exist")
    void loadUserByEmailShouldThrowWhenUserNotExists() throws Exception {
        EmailAuthStrategy strategy = new EmailAuthStrategy(loginService, userMapper);
        when(userMapper.selectVoOne(any())).thenReturn(null);

        Method method = EmailAuthStrategy.class.getDeclaredMethod("loadUserByEmail", String.class);
        method.setAccessible(true);
        InvocationTargetException ex = assertThrows(InvocationTargetException.class, () -> method.invoke(strategy, "a@b.com"));

        assertTrue(ex.getCause() instanceof UserException);
    }

    @Test
    @DisplayName("login: should throw when user is disabled")
    void loginShouldThrowWhenUserDisabled() {
        EmailAuthStrategy strategy = new EmailAuthStrategy(loginService, userMapper);
        SysUserVo user = new SysUserVo();
        user.setEmail("a@b.com");
        user.setStatus(SystemConstants.DISABLE);
        when(userMapper.selectVoOne(any())).thenReturn(user);

        assertThrows(UserException.class, () -> strategy.login(emailBody("a@b.com", "1234"), buildClient()));
    }

    @Test
    @DisplayName("login: should return token when email code is valid")
    void loginShouldReturnTokenWhenEmailCodeValid() {
        EmailAuthStrategy strategy = new EmailAuthStrategy(loginService, userMapper);
        SysUserVo user = new SysUserVo();
        user.setEmail("a@b.com");
        user.setUserName("admin");
        user.setStatus(SystemConstants.NORMAL);
        when(userMapper.selectVoOne(any())).thenReturn(user);

        LoginUser loginUser = new LoginUser();
        when(loginService.buildLoginUser(user)).thenReturn(loginUser);
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Supplier<Boolean> supplier = invocation.getArgument(2);
            assertFalse(supplier.get());
            return null;
        }).when(loginService).checkLogin(eq(LoginType.EMAIL), eq("admin"), any());

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class);
             MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(anyString())).thenReturn("1234");
            stpUtil.when(StpUtil::getTokenValue).thenReturn("email-token");
            stpUtil.when(StpUtil::getTokenTimeout).thenReturn(3600L);

            LoginVo result = strategy.login(emailBody("a@b.com", "1234"), buildClient());

            assertEquals("email-token", result.getAccessToken());
            assertEquals(3600L, result.getExpireIn());
            assertEquals("pc", result.getClientId());
            assertEquals("client-key", loginUser.getClientKey());
            assertEquals("web", loginUser.getDeviceType());
        }
    }

    private SysClientVo buildClient() {
        SysClientVo client = new SysClientVo();
        client.setClientId("pc");
        client.setClientKey("client-key");
        client.setDeviceType("web");
        client.setTimeout(3600L);
        client.setActiveTimeout(1200L);
        return client;
    }

    private String emailBody(String email, String emailCode) {
        return "{\"clientId\":\"pc\",\"grantType\":\"email\",\"email\":\"" + email +
            "\",\"emailCode\":\"" + emailCode + "\"}";
    }
}
