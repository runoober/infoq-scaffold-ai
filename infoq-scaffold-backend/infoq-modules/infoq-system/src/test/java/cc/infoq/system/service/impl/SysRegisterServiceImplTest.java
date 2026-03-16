package cc.infoq.system.service.impl;

import cc.infoq.common.constant.GlobalConstants;
import cc.infoq.common.domain.model.RegisterBody;
import cc.infoq.common.exception.user.CaptchaException;
import cc.infoq.common.exception.user.CaptchaExpireException;
import cc.infoq.common.exception.user.UserException;
import cc.infoq.common.log.event.LoginInfoEvent;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.utils.ServletUtils;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.common.web.config.properties.CaptchaProperties;
import cc.infoq.system.mapper.SysUserMapper;
import cc.infoq.system.service.SysUserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RedissonClient;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericApplicationContext;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class SysRegisterServiceImplTest {

    @Mock
    private SysUserService userService;
    @Mock
    private SysUserMapper userMapper;
    @Mock
    private CaptchaProperties captchaProperties;

    @BeforeAll
    static void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> mock(RedissonClient.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @Test
    @DisplayName("register: should throw when username already exists")
    void registerShouldThrowWhenUserExists() {
        SysRegisterServiceImpl service = new SysRegisterServiceImpl(userService, userMapper, captchaProperties);
        RegisterBody body = new RegisterBody();
        body.setUsername("admin");
        body.setPassword("123456");
        body.setUserType("sys_user");
        when(captchaProperties.getEnable()).thenReturn(false);
        when(userMapper.exists(any())).thenReturn(true);

        assertThrows(UserException.class, () -> service.register(body));
    }

    @Test
    @DisplayName("validateCaptcha: should throw CaptchaExpireException when captcha not found")
    void validateCaptchaShouldThrowExpireExceptionWhenCaptchaNotFound() {
        SysRegisterServiceImpl service = new SysRegisterServiceImpl(userService, userMapper, captchaProperties);
        String verifyKey = GlobalConstants.CAPTCHA_CODE_KEY + "uuid-1";
        ApplicationContext context = mock(ApplicationContext.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class);
             MockedStatic<ServletUtils> servletUtils = mockStatic(ServletUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(verifyKey)).thenReturn(null);
            springUtils.when(SpringUtils::context).thenReturn(context);
            servletUtils.when(ServletUtils::getRequest).thenReturn(request);

            assertThrows(CaptchaExpireException.class, () -> service.validateCaptcha("admin", "1234", "uuid-1"));

            redisUtils.verify(() -> RedisUtils.deleteObject(verifyKey));
            verify(context).publishEvent(any(LoginInfoEvent.class));
        }
    }

    @Test
    @DisplayName("validateCaptcha: should throw CaptchaException when captcha mismatches")
    void validateCaptchaShouldThrowCaptchaExceptionWhenCaptchaMismatches() {
        SysRegisterServiceImpl service = new SysRegisterServiceImpl(userService, userMapper, captchaProperties);
        String verifyKey = GlobalConstants.CAPTCHA_CODE_KEY + "uuid-2";
        ApplicationContext context = mock(ApplicationContext.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class);
             MockedStatic<ServletUtils> servletUtils = mockStatic(ServletUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(verifyKey)).thenReturn("ABCD");
            springUtils.when(SpringUtils::context).thenReturn(context);
            servletUtils.when(ServletUtils::getRequest).thenReturn(request);

            assertThrows(CaptchaException.class, () -> service.validateCaptcha("admin", "9999", "uuid-2"));

            redisUtils.verify(() -> RedisUtils.deleteObject(verifyKey));
            verify(context).publishEvent(any(LoginInfoEvent.class));
        }
    }

    @Test
    @DisplayName("validateCaptcha: should pass when code matches ignoring case")
    void validateCaptchaShouldPassWhenCodeMatchesIgnoringCase() {
        SysRegisterServiceImpl service = new SysRegisterServiceImpl(userService, userMapper, captchaProperties);
        String verifyKey = GlobalConstants.CAPTCHA_CODE_KEY + "uuid-3";
        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class)) {
            redisUtils.when(() -> RedisUtils.getCacheObject(verifyKey)).thenReturn("AbCd");

            assertDoesNotThrow(() -> service.validateCaptcha("admin", "abcd", "uuid-3"));
            redisUtils.verify(() -> RedisUtils.deleteObject(verifyKey));
        }
    }
}
