package cc.infoq.system.controller.monitor;

import cc.infoq.common.domain.ApiResult;
import cc.infoq.system.domain.vo.ServerMonitorVo;
import cc.infoq.system.service.ServerMonitorService;
import cn.dev33.satoken.annotation.SaCheckPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 服务监控
 *
 * @author Pontus
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/monitor/server")
public class ServerController {

    private final ServerMonitorService serverMonitorService;

    @SaCheckPermission("monitor:server:list")
    @GetMapping
    public ApiResult<ServerMonitorVo> getInfo() {
        return ApiResult.ok(serverMonitorService.getMonitorInfo());
    }
}
