package cc.infoq.system.controller.login;

import cc.infoq.common.constant.SystemConstants;
import cc.infoq.common.domain.ApiResult;
import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.domain.model.LoginBody;
import cc.infoq.common.domain.model.RegisterBody;
import cc.infoq.common.encrypt.annotation.ApiEncrypt;
import cc.infoq.common.json.utils.JsonUtils;
import cc.infoq.common.satoken.utils.LoginHelper;
import cc.infoq.common.utils.*;
import cc.infoq.system.domain.vo.*;
import cc.infoq.system.service.*;
import cc.infoq.system.support.plugin.OptionalSseHelper;
import cn.dev33.satoken.annotation.SaIgnore;
import cn.hutool.core.lang.Dict;
import cn.hutool.core.util.ObjectUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 认证
 *
 * @author Pontus
 */
@Slf4j
@SaIgnore
@AllArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final SysLoginService sysLoginService;
    private final SysRegisterService sysRegisterService;
    private final SysConfigService sysConfigService;
    private final SysClientService sysClientService;
    private final ScheduledExecutorService scheduledExecutorService;


    /**
     * 登录方法
     *
     * @param body 登录信息
     * @return 结果
     */
    @ApiEncrypt
    @PostMapping("/login")
    public ApiResult<LoginVo> login(@RequestBody String body) {
        Dict loginPayload = JsonUtils.parseMap(body);
        if (ObjectUtil.isNull(loginPayload)) {
            throw new ServiceException("登录请求体必须为 JSON 对象");
        }
        LoginBody loginBody = new LoginBody();
        loginBody.setClientId(loginPayload.getStr("clientId"));
        loginBody.setGrantType(loginPayload.getStr("grantType"));
        ValidatorUtils.validate(loginBody);
        // 授权类型和客户端id
        String clientId = loginBody.getClientId();
        String grantType = loginBody.getGrantType();
        SysClientVo client = sysClientService.queryByClientId(clientId);
        // 查询不到 client 或 client 内不包含 grantType
        if (ObjectUtil.isNull(client) || !StringUtils.contains(client.getGrantType(), grantType)) {
            log.info("客户端id: {} 认证类型：{} 异常!.", clientId, grantType);
            return ApiResult.fail(MessageUtils.message("auth.grant.type.error"));
        } else if (!SystemConstants.NORMAL.equals(client.getStatus())) {
            return ApiResult.fail(MessageUtils.message("auth.grant.type.blocked"));
        }
        // 登录
        LoginVo loginVo = AuthStrategy.login(body, client, grantType);

        Long userId = LoginHelper.getUserId();
        scheduledExecutorService.schedule(() -> {
            String message = DateUtils.getTodayHour(new Date()) + "好，欢迎登录 infoq-scaffold-backend 后台管理系统";
            OptionalSseHelper.publishToUsers(List.of(userId), message);
        }, 5, TimeUnit.SECONDS);
        return ApiResult.ok(loginVo);
    }


    /**
     * 退出登录
     */
    @PostMapping("/logout")
    public ApiResult<Void> logout() {
        sysLoginService.logout();
        return ApiResult.ok("退出成功");
    }

    /**
     * 用户注册
     */
    @ApiEncrypt
    @PostMapping("/register")
    public ApiResult<Void> register(@Validated @RequestBody RegisterBody user) {
        if (!sysConfigService.selectRegisterEnabled()) {
            return ApiResult.fail("当前系统没有开启注册功能！");
        }
        sysRegisterService.register(user);
        return ApiResult.ok();
    }

}
