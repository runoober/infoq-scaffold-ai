package cc.infoq.system.service.impl;

import cc.infoq.common.constant.SystemConstants;
import cc.infoq.common.domain.model.LoginUser;
import cc.infoq.common.enums.LoginType;
import cc.infoq.common.exception.user.UserException;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.common.web.config.properties.CaptchaProperties;
import cc.infoq.system.domain.vo.LoginVo;
import cc.infoq.system.domain.vo.SysClientVo;
import cc.infoq.system.domain.vo.SysUserVo;
import cc.infoq.system.mapper.SysUserMapper;
import cc.infoq.system.service.SysLoginService;
import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
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
class PasswordAuthStrategyTest {

    private GenericApplicationContext context;

    @Mock
    private CaptchaProperties captchaProperties;
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
    @DisplayName("loadUserByUsername: should throw when user does not exist")
    void loadUserByUsernameShouldThrowWhenUserNotExists() throws Exception {
        PasswordAuthStrategy strategy = new PasswordAuthStrategy(captchaProperties, loginService, userMapper);
        when(userMapper.selectVoOne(any())).thenReturn(null);

        Method method = PasswordAuthStrategy.class.getDeclaredMethod("loadUserByUsername", String.class);
        method.setAccessible(true);
        InvocationTargetException ex = assertThrows(InvocationTargetException.class, () -> method.invoke(strategy, "admin"));

        assertTrue(ex.getCause() instanceof UserException);
    }

    @Test
    @DisplayName("loadUserByUsername: should throw when user is disabled")
    void loadUserByUsernameShouldThrowWhenUserDisabled() throws Exception {
        PasswordAuthStrategy strategy = new PasswordAuthStrategy(captchaProperties, loginService, userMapper);
        SysUserVo user = new SysUserVo();
        user.setUserName("admin");
        user.setStatus(SystemConstants.DISABLE);
        when(userMapper.selectVoOne(any())).thenReturn(user);

        Method method = PasswordAuthStrategy.class.getDeclaredMethod("loadUserByUsername", String.class);
        method.setAccessible(true);
        InvocationTargetException ex = assertThrows(InvocationTargetException.class, () -> method.invoke(strategy, "admin"));

        assertTrue(ex.getCause() instanceof UserException);
    }

    @Test
    @DisplayName("login: should throw when public login cannot find user")
    void loginShouldThrowWhenPublicLoginCannotFindUser() {
        PasswordAuthStrategy strategy = new PasswordAuthStrategy(captchaProperties, loginService, userMapper);
        when(captchaProperties.getEnable()).thenReturn(false);
        when(userMapper.selectVoOne(any())).thenReturn(null);

        assertThrows(UserException.class, () -> strategy.login(passwordBody("admin", "123456", null, null, false), buildClient()));
    }

    @Test
    @DisplayName("login: should return token when captcha and credential are valid")
    void loginShouldReturnTokenWhenCredentialAndCaptchaValid() {
        PasswordAuthStrategy strategy = new PasswordAuthStrategy(captchaProperties, loginService, userMapper);
        when(captchaProperties.getEnable()).thenReturn(true);

        SysUserVo user = new SysUserVo();
        user.setUserName("admin");
        user.setPassword(BCrypt.hashpw("123456"));
        user.setStatus(SystemConstants.NORMAL);
        when(userMapper.selectVoOne(any())).thenReturn(user);

        LoginUser loginUser = new LoginUser();
        when(loginService.buildLoginUser(user)).thenReturn(loginUser);
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Supplier<Boolean> supplier = invocation.getArgument(2);
            assertFalse(supplier.get());
            return null;
        }).when(loginService).checkLogin(eq(LoginType.PASSWORD), eq("admin"), any());

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class);
             MockedStatic<StpUtil> stpUtil = mockStatic(StpUtil.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(anyString())).thenReturn("AbCd");
            stpUtil.when(StpUtil::getTokenValue).thenReturn("token-123");
            stpUtil.when(StpUtil::getTokenTimeout).thenReturn(7200L);

            LoginVo result = strategy.login(passwordBody("admin", "123456", "abCD", "u-1", true), buildClient());

            assertEquals("token-123", result.getAccessToken());
            assertEquals(7200L, result.getExpireIn());
            assertEquals("pc", result.getClientId());
            assertEquals("client-key", loginUser.getClientKey());
            assertEquals("web", loginUser.getDeviceType());
            redisUtils.verify(() -> RedisUtils.deleteObject(anyString()));
        }
    }

    @Test
    @DisplayName("login: should keep strict parsing for unknown fields")
    void loginShouldRejectUnknownFields() {
        PasswordAuthStrategy strategy = new PasswordAuthStrategy(captchaProperties, loginService, userMapper);

        RuntimeException exception = assertThrows(RuntimeException.class,
            () -> strategy.login(passwordBodyWithExtraField("admin", "123456", "extra", "true"), buildClient()));

        assertTrue(exception.getCause() instanceof UnrecognizedPropertyException);
    }

    private SysClientVo buildClient() {
        SysClientVo client = new SysClientVo();
        client.setClientId("pc");
        client.setClientKey("client-key");
        client.setDeviceType("web");
        client.setTimeout(7200L);
        client.setActiveTimeout(1800L);
        return client;
    }

    private String passwordBody(String username, String password, String code, String uuid, boolean rememberMe) {
        String codePart = code == null ? "" : ",\"code\":\"" + code + "\"";
        String uuidPart = uuid == null ? "" : ",\"uuid\":\"" + uuid + "\"";
        String rememberMePart = rememberMe ? ",\"rememberMe\":true" : "";
        return "{\"clientId\":\"pc\",\"grantType\":\"password\",\"username\":\"" + username +
            "\",\"password\":\"" + password + "\"" + codePart + uuidPart + rememberMePart + "}";
    }

    private String passwordBodyWithExtraField(String username, String password, String fieldName, String fieldValueLiteral) {
        return "{\"clientId\":\"pc\",\"grantType\":\"password\",\"username\":\"" + username +
            "\",\"password\":\"" + password + "\",\"" + fieldName + "\":" + fieldValueLiteral + "}";
    }
}
