package cc.infoq.system.controller.login;

import cc.infoq.common.constant.SystemConstants;
import cc.infoq.common.domain.ApiResult;
import cc.infoq.common.domain.model.RegisterBody;
import cc.infoq.system.domain.vo.LoginVo;
import cc.infoq.system.domain.vo.SysClientVo;
import cc.infoq.system.service.AuthStrategy;
import cc.infoq.system.service.SysClientService;
import cc.infoq.system.service.SysConfigService;
import cc.infoq.system.service.SysLoginService;
import cc.infoq.system.service.SysRegisterService;
import cc.infoq.system.support.plugin.OptionalSseHelper;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.SpringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.GenericApplicationContext;

import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
@Tag("dev")
class AuthControllerTest {

    private GenericApplicationContext context;

    @Mock
    private SysLoginService sysLoginService;
    @Mock
    private SysRegisterService sysRegisterService;
    @Mock
    private SysConfigService sysConfigService;
    @Mock
    private SysClientService sysClientService;
    @Mock
    private ScheduledExecutorService scheduledExecutorService;

    @InjectMocks
    private AuthController controller;

    @BeforeEach
    void initSpringContext() {
        context = new GenericApplicationContext();
        context.registerBean(ObjectMapper.class, () -> new ObjectMapper());
        context.registerBean(Validator.class, () -> Validation.buildDefaultValidatorFactory().getValidator());
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
    @DisplayName("register: should fail when register switch is disabled")
    void registerShouldFailWhenDisabled() {
        RegisterBody body = new RegisterBody();
        when(sysConfigService.selectRegisterEnabled()).thenReturn(false);

        ApiResult<Void> result = controller.register(body);

        assertEquals(ApiResult.FAIL, result.getCode());
        assertTrue(result.getMsg().contains("没有开启注册功能"));
        verifyNoInteractions(sysRegisterService);
    }

    @Test
    @DisplayName("logout: should call service and return success")
    void logoutShouldCallServiceAndReturnSuccess() {
        ApiResult<Void> result = controller.logout();

        assertEquals(ApiResult.SUCCESS, result.getCode());
        verify(sysLoginService).logout();
    }

    @Test
    @DisplayName("login: should fail when client is not found")
    void loginShouldFailWhenClientNotFound() {
        when(sysClientService.queryByClientId("pc")).thenReturn(null);

        ApiResult<LoginVo> result = controller.login("{\"clientId\":\"pc\",\"grantType\":\"password\"}");

        assertEquals(ApiResult.FAIL, result.getCode());
        verifyNoInteractions(scheduledExecutorService);
    }

    @Test
    @DisplayName("login: should fail when client status is disabled")
    void loginShouldFailWhenClientDisabled() {
        SysClientVo client = new SysClientVo();
        client.setClientId("pc");
        client.setGrantType("password,email");
        client.setStatus(SystemConstants.DISABLE);
        when(sysClientService.queryByClientId("pc")).thenReturn(client);

        ApiResult<LoginVo> result = controller.login("{\"clientId\":\"pc\",\"grantType\":\"password\"}");

        assertEquals(ApiResult.FAIL, result.getCode());
        verifyNoInteractions(scheduledExecutorService);
    }

    @Test
    @DisplayName("login: should return success and schedule welcome message when client is valid")
    void loginShouldReturnSuccessAndScheduleMessage() {
        SysClientVo client = new SysClientVo();
        client.setClientId("pc");
        client.setGrantType("password,email");
        client.setStatus(SystemConstants.NORMAL);
        when(sysClientService.queryByClientId("pc")).thenReturn(client);
        when(scheduledExecutorService.schedule(any(Runnable.class), eq(5L), eq(TimeUnit.SECONDS)))
            .thenReturn(mock(ScheduledFuture.class));

        LoginVo loginVo = new LoginVo();
        loginVo.setAccessToken("token-1");
        loginVo.setExpireIn(3600L);
        loginVo.setClientId("pc");
        try (MockedStatic<AuthStrategy> authStrategy = mockStatic(AuthStrategy.class);
             MockedStatic<LoginHelper> loginHelper = mockStatic(LoginHelper.class)) {
            authStrategy.when(() -> AuthStrategy.login(anyString(), eq(client), eq("password"))).thenReturn(loginVo);
            loginHelper.when(LoginHelper::getUserId).thenReturn(100L);

            ApiResult<LoginVo> result = controller.login("{\"clientId\":\"pc\",\"grantType\":\"password\"}");

            assertEquals(ApiResult.SUCCESS, result.getCode());
            assertEquals("token-1", result.getData().getAccessToken());
            ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
            verify(scheduledExecutorService).schedule(runnableCaptor.capture(), eq(5L), eq(TimeUnit.SECONDS));

            try (MockedStatic<OptionalSseHelper> optionalSseHelper = mockStatic(OptionalSseHelper.class)) {
                runnableCaptor.getValue().run();
                optionalSseHelper.verify(() -> OptionalSseHelper.publishToUsers(eq(java.util.List.of(100L)), anyString()));
            }
        }
    }
}
