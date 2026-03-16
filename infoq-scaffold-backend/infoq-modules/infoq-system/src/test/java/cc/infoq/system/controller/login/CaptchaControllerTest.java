package cc.infoq.system.controller.login;

import cc.infoq.common.constant.Constants;
import cc.infoq.common.constant.GlobalConstants;
import cc.infoq.common.domain.ApiResult;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.redis.utils.RedisUtils;
import cc.infoq.common.utils.SpringUtils;
import cc.infoq.common.web.config.properties.CaptchaProperties;
import cc.infoq.common.web.enums.CaptchaCategory;
import cc.infoq.common.web.enums.CaptchaType;
import cc.infoq.system.domain.vo.CaptchaVo;
import cc.infoq.system.support.plugin.OptionalMailHelper;
import cn.hutool.captcha.AbstractCaptcha;
import cn.hutool.captcha.LineCaptcha;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.RandomUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RedissonClient;
import org.springframework.context.support.GenericApplicationContext;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mockStatic;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class CaptchaControllerTest {

    @Mock
    private CaptchaProperties captchaProperties;

    @InjectMocks
    private CaptchaController controller;

    @BeforeEach
    void initSpringContext() {
        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> Mockito.mock(RedissonClient.class));
        context.refresh();
        new SpringUtils().setApplicationContext(context);
    }

    @Test
    @DisplayName("getCode: should return disabled flag when captcha switch is off")
    void getCodeShouldReturnDisabledFlagWhenOff() {
        when(captchaProperties.getEnable()).thenReturn(false);

        ApiResult<CaptchaVo> result = controller.getCode();

        assertEquals(ApiResult.SUCCESS, result.getCode());
        assertFalse(result.getData().getCaptchaEnabled());
    }

    @Test
    @DisplayName("getCode: should delegate to AOP proxy when captcha switch is on")
    void getCodeShouldDelegateToAopProxyWhenOn() {
        when(captchaProperties.getEnable()).thenReturn(true);
        CaptchaController proxy = spy(controller);
        CaptchaVo expected = new CaptchaVo();
        expected.setUuid("proxy-uuid");
        doReturn(expected).when(proxy).getCodeImpl();

        try (MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class)) {
            springUtils.when(() -> SpringUtils.getAopProxy(controller)).thenReturn(proxy);

            ApiResult<CaptchaVo> result = controller.getCode();

            assertEquals(ApiResult.SUCCESS, result.getCode());
            assertEquals("proxy-uuid", result.getData().getUuid());
            verify(proxy).getCodeImpl();
        }
    }

    @Test
    @DisplayName("getCodeImpl: should evaluate math captcha result and cache it")
    void getCodeImplShouldEvaluateMathResultAndCacheIt() {
        when(captchaProperties.getType()).thenReturn(CaptchaType.MATH);
        when(captchaProperties.getCategory()).thenReturn(CaptchaCategory.LINE);
        when(captchaProperties.getNumberLength()).thenReturn(2);

        LineCaptcha captcha = Mockito.mock(LineCaptcha.class);
        when(captcha.getCode()).thenReturn("1+2=");
        when(captcha.getImageBase64()).thenReturn("base64-image");

        GenericApplicationContext context = new GenericApplicationContext();
        context.registerBean(RedissonClient.class, () -> Mockito.mock(RedissonClient.class));
        context.registerBean(LineCaptcha.class, () -> captcha);
        context.refresh();
        new SpringUtils().setApplicationContext(context);

        try (MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<IdUtil> idUtil = mockStatic(IdUtil.class)) {
            idUtil.when(IdUtil::simpleUUID).thenReturn("captcha-1");

            CaptchaVo captchaVo = controller.getCodeImpl();

            assertEquals("captcha-1", captchaVo.getUuid());
            assertEquals("base64-image", captchaVo.getImg());
            assertNotNull(captchaVo.getUuid());
            redisUtils.verify(() -> RedisUtils.setCacheObject(
                GlobalConstants.CAPTCHA_CODE_KEY + "captcha-1",
                "3",
                Duration.ofMinutes(Constants.CAPTCHA_EXPIRATION)
            ));
        }
    }

    @Test
    @DisplayName("emailCode: should return fail when mail feature is disabled")
    void emailCodeShouldReturnFailWhenMailFeatureDisabled() {
        try (MockedStatic<OptionalMailHelper> mailHelper = mockStatic(OptionalMailHelper.class)) {
            mailHelper.when(OptionalMailHelper::isEnabled).thenReturn(false);

            ApiResult<Void> result = controller.emailCode("dev@infoq.cc");

            assertEquals(ApiResult.FAIL, result.getCode());
            assertEquals("当前系统没有开启邮箱功能！", result.getMsg());
        }
    }

    @Test
    @DisplayName("emailCode: should delegate to aop proxy when mail feature is enabled")
    void emailCodeShouldDelegateToAopProxyWhenMailEnabled() {
        CaptchaController proxy = spy(controller);
        doNothing().when(proxy).emailCodeImpl("dev@infoq.cc");
        try (MockedStatic<OptionalMailHelper> mailHelper = mockStatic(OptionalMailHelper.class);
             MockedStatic<SpringUtils> springUtils = mockStatic(SpringUtils.class)) {
            mailHelper.when(OptionalMailHelper::isEnabled).thenReturn(true);
            springUtils.when(() -> SpringUtils.getAopProxy(controller)).thenReturn(proxy);

            ApiResult<Void> result = controller.emailCode("dev@infoq.cc");

            assertEquals(ApiResult.SUCCESS, result.getCode());
            verify(proxy).emailCodeImpl("dev@infoq.cc");
        }
    }

    @Test
    @DisplayName("emailCodeImpl: should persist code and send email content")
    void emailCodeImplShouldPersistCodeAndSendEmailContent() {
        String email = "dev@infoq.cc";
        String code = "9527";
        String content = "您本次验证码为：" + code + "，有效性为" + Constants.CAPTCHA_EXPIRATION + "分钟，请尽快填写。";
        try (MockedStatic<RandomUtil> randomUtil = mockStatic(RandomUtil.class);
             MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<OptionalMailHelper> mailHelper = mockStatic(OptionalMailHelper.class)) {
            randomUtil.when(() -> RandomUtil.randomNumbers(4)).thenReturn(code);

            controller.emailCodeImpl(email);

            redisUtils.verify(() -> RedisUtils.setCacheObject(
                GlobalConstants.CAPTCHA_CODE_KEY + email,
                code,
                Duration.ofMinutes(Constants.CAPTCHA_EXPIRATION)
            ));
            mailHelper.verify(() -> OptionalMailHelper.sendText(email, "登录验证码", content));
        }
    }

    @Test
    @DisplayName("emailCodeImpl: should throw service exception when email sending fails")
    void emailCodeImplShouldThrowServiceExceptionWhenEmailSendingFails() {
        String email = "dev@infoq.cc";
        String code = "1234";
        String content = "您本次验证码为：" + code + "，有效性为" + Constants.CAPTCHA_EXPIRATION + "分钟，请尽快填写。";
        try (MockedStatic<RandomUtil> randomUtil = mockStatic(RandomUtil.class);
             MockedStatic<RedisUtils> redisUtils = mockStatic(RedisUtils.class);
             MockedStatic<OptionalMailHelper> mailHelper = mockStatic(OptionalMailHelper.class)) {
            randomUtil.when(() -> RandomUtil.randomNumbers(4)).thenReturn(code);
            mailHelper.when(() -> OptionalMailHelper.sendText(email, "登录验证码", content))
                .thenThrow(new RuntimeException("mail send failed"));

            ServiceException ex = assertThrows(ServiceException.class, () -> controller.emailCodeImpl(email));

            assertEquals("mail send failed", ex.getMessage());
        }
    }
}
