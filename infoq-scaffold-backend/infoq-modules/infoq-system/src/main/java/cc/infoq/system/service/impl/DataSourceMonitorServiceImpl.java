package cc.infoq.system.service.impl;

import cc.infoq.common.exception.ServiceException;
import cc.infoq.common.utils.DesensitizedUtils;
import cc.infoq.common.utils.StringUtils;
import cc.infoq.system.domain.vo.DataSourceMonitorVo;
import cc.infoq.system.service.DataSourceMonitorService;
import com.baomidou.dynamic.datasource.DynamicRoutingDataSource;
import com.baomidou.dynamic.datasource.ds.ItemDataSource;
import com.zaxxer.hikari.HikariConfigMXBean;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.*;

/**
 * Native Hikari datasource monitor service.
 *
 * <p>This implementation reads runtime information directly from
 * {@link DynamicRoutingDataSource}, unwraps the real {@link HikariDataSource},
 * and exposes pool/config metrics without borrowing a connection.</p>
 *
 * @author Pontus
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataSourceMonitorServiceImpl implements DataSourceMonitorService {

    private static final Set<String> SENSITIVE_KEYS = Set.of("password", "user", "username", "accesskey", "secretkey", "token");

    private final DynamicRoutingDataSource dynamicRoutingDataSource;

    @Override
    public DataSourceMonitorVo getMonitorInfo() {
        try {
            Map<String, DataSource> dataSources = new TreeMap<>(dynamicRoutingDataSource.getDataSources());
            DataSourceMonitorVo monitor = new DataSourceMonitorVo();
            DataSourceMonitorVo.Summary summary = new DataSourceMonitorVo.Summary();
            summary.setDataSourceCount(dataSources.size());
            summary.setActiveConnections(0);
            summary.setIdleConnections(0);
            summary.setTotalConnections(0);
            summary.setMaximumPoolSize(0);
            summary.setThreadsAwaitingConnection(0);
            monitor.setSummary(summary);
            dataSources.forEach((name, dataSource) -> {
                DataSourceMonitorVo.Pool pool = inspectPool(name, dataSource);
                monitor.getItems().add(pool);
                accumulate(summary, pool);
            });
            return monitor;
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("datasource monitor collection failed", e);
            throw new ServiceException("datasource monitor collection failed: {}", e.getMessage());
        }
    }

    private void accumulate(DataSourceMonitorVo.Summary summary, DataSourceMonitorVo.Pool pool) {
        summary.setActiveConnections(summary.getActiveConnections() + safeInt(pool.getActiveConnections()));
        summary.setIdleConnections(summary.getIdleConnections() + safeInt(pool.getIdleConnections()));
        summary.setTotalConnections(summary.getTotalConnections() + safeInt(pool.getTotalConnections()));
        summary.setMaximumPoolSize(summary.getMaximumPoolSize() + safeInt(pool.getMaximumPoolSize()));
        summary.setThreadsAwaitingConnection(summary.getThreadsAwaitingConnection() + safeInt(pool.getThreadsAwaitingConnection()));
    }

    private DataSourceMonitorVo.Pool inspectPool(String name, DataSource dataSource) {
        try {
            DataSourceSource source = resolveSource(dataSource);
            HikariDataSource hikariDataSource = unwrapHikari(source.candidateDataSource(), name);
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            HikariConfigMXBean configMXBean = hikariDataSource.getHikariConfigMXBean();

            DataSourceMonitorVo.Pool pool = new DataSourceMonitorVo.Pool();
            pool.setName(name);
            pool.setPoolName(hikariDataSource.getPoolName());
            pool.setDriverClassName(hikariDataSource.getDriverClassName());
            pool.setJdbcUrlMasked(maskJdbcUrl(hikariDataSource.getJdbcUrl()));
            pool.setUsernameMasked(maskUsername(hikariDataSource.getUsername()));
            pool.setP6spyEnabled(source.p6spyEnabled());
            pool.setSeataEnabled(source.seataEnabled());
            pool.setMetricsReady(poolMXBean != null);
            pool.setRunning(hikariDataSource.isRunning());
            pool.setActiveConnections(poolMXBean != null ? poolMXBean.getActiveConnections() : null);
            pool.setIdleConnections(poolMXBean != null ? poolMXBean.getIdleConnections() : null);
            pool.setTotalConnections(poolMXBean != null ? poolMXBean.getTotalConnections() : null);
            pool.setThreadsAwaitingConnection(poolMXBean != null ? poolMXBean.getThreadsAwaitingConnection() : null);
            pool.setMinimumIdle(configMXBean != null ? configMXBean.getMinimumIdle() : hikariDataSource.getMinimumIdle());
            pool.setMaximumPoolSize(configMXBean != null ? configMXBean.getMaximumPoolSize() : hikariDataSource.getMaximumPoolSize());
            pool.setConnectionTimeoutMs(configMXBean != null ? configMXBean.getConnectionTimeout() : hikariDataSource.getConnectionTimeout());
            pool.setValidationTimeoutMs(configMXBean != null ? configMXBean.getValidationTimeout() : hikariDataSource.getValidationTimeout());
            pool.setIdleTimeoutMs(configMXBean != null ? configMXBean.getIdleTimeout() : hikariDataSource.getIdleTimeout());
            pool.setMaxLifetimeMs(configMXBean != null ? configMXBean.getMaxLifetime() : hikariDataSource.getMaxLifetime());
            pool.setKeepaliveTimeMs(hikariDataSource.getKeepaliveTime());
            pool.setLeakDetectionThresholdMs(hikariDataSource.getLeakDetectionThreshold());
            pool.setUsagePercent(resolveUsagePercent(pool.getActiveConnections(), pool.getMaximumPoolSize()));
            pool.setState(resolveState(pool));
            return pool;
        } catch (ServiceException e) {
            log.error("datasource monitor collection failed datasource={}", name, e);
            throw e;
        } catch (Exception e) {
            log.error("datasource monitor collection failed datasource={}", name, e);
            throw new ServiceException("datasource[{}] monitor collection failed: {}", name, e.getMessage());
        }
    }

    private DataSourceSource resolveSource(DataSource dataSource) {
        if (dataSource instanceof ItemDataSource itemDataSource) {
            DataSource candidate = itemDataSource.getRealDataSource() != null ? itemDataSource.getRealDataSource() : itemDataSource.getDataSource();
            return new DataSourceSource(candidate, Boolean.TRUE.equals(itemDataSource.getP6spy()), Boolean.TRUE.equals(itemDataSource.getSeata()));
        }
        return new DataSourceSource(dataSource, false, false);
    }

    private HikariDataSource unwrapHikari(DataSource dataSource, String name) {
        if (dataSource == null) {
            throw new ServiceException("datasource[{}] is null", name);
        }
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            return hikariDataSource;
        }
        try {
            if (dataSource.isWrapperFor(HikariDataSource.class)) {
                return dataSource.unwrap(HikariDataSource.class);
            }
        } catch (SQLException e) {
            throw new ServiceException("datasource[{}] unwrap hikari failed: {}", name, e.getMessage());
        }
        throw new ServiceException("datasource[{}] is not a HikariDataSource", name);
    }

    private Double resolveUsagePercent(Integer activeConnections, Integer maximumPoolSize) {
        if (activeConnections == null || maximumPoolSize == null || maximumPoolSize <= 0) {
            return null;
        }
        return scale(activeConnections * 100D / maximumPoolSize, 2);
    }

    private String resolveState(DataSourceMonitorVo.Pool pool) {
        if (!Boolean.TRUE.equals(pool.getMetricsReady())) {
            return "UNINITIALIZED";
        }
        int active = safeInt(pool.getActiveConnections());
        int idle = safeInt(pool.getIdleConnections());
        int awaiting = safeInt(pool.getThreadsAwaitingConnection());
        int maxPoolSize = safeInt(pool.getMaximumPoolSize());
        double usage = pool.getUsagePercent() == null ? 0D : pool.getUsagePercent();

        if (maxPoolSize > 0 && active >= maxPoolSize) {
            return "SATURATED";
        }
        if (awaiting > 0 && idle == 0) {
            return "SATURATED";
        }
        if (awaiting > 0 || usage >= 80D) {
            return "BUSY";
        }
        return "RUNNING";
    }

    private String maskUsername(String username) {
        if (StringUtils.isBlank(username)) {
            return username;
        }
        return DesensitizedUtils.maskHighSecurity(username, 1, 0);
    }

    private String maskJdbcUrl(String jdbcUrl) {
        if (StringUtils.isBlank(jdbcUrl)) {
            return jdbcUrl;
        }
        int queryStart = jdbcUrl.indexOf('?');
        if (queryStart < 0) {
            return jdbcUrl;
        }
        String prefix = jdbcUrl.substring(0, queryStart + 1);
        String query = jdbcUrl.substring(queryStart + 1);
        String[] segments = query.split("&");
        Map<String, String> masked = new LinkedHashMap<>();
        for (String segment : segments) {
            int index = segment.indexOf('=');
            if (index < 0) {
                masked.put(segment, "");
                continue;
            }
            String key = segment.substring(0, index);
            String value = segment.substring(index + 1);
            if (SENSITIVE_KEYS.contains(key.toLowerCase(Locale.ROOT))) {
                masked.put(key, "***");
            } else {
                masked.put(key, value);
            }
        }
        return prefix + masked.entrySet().stream()
            .map(entry -> entry.getKey() + (entry.getValue().isEmpty() ? "" : "=" + entry.getValue()))
            .reduce((left, right) -> left + "&" + right)
            .orElse("");
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private double scale(double value, int scale) {
        return java.math.BigDecimal.valueOf(value)
            .setScale(scale, java.math.RoundingMode.HALF_UP)
            .doubleValue();
    }

    private record DataSourceSource(DataSource candidateDataSource, boolean p6spyEnabled, boolean seataEnabled) {}
}
