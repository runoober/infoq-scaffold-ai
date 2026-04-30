package cc.infoq.system.controller.monitor;

import cc.infoq.common.domain.ApiResult;
import cc.infoq.system.domain.vo.DataSourceMonitorVo;
import cc.infoq.system.service.DataSourceMonitorService;
import cn.dev33.satoken.annotation.SaCheckPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 连接池监控
 *
 * @author Pontus
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/monitor/dataSource")
public class DataSourceController {

    private final DataSourceMonitorService dataSourceMonitorService;

    @SaCheckPermission("monitor:dataSource:list")
    @GetMapping
    public ApiResult<DataSourceMonitorVo> getInfo() {
        return ApiResult.ok(dataSourceMonitorService.getMonitorInfo());
    }
}
