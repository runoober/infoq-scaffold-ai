import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../helpers/renderWithRouter';

const dataSourceMocks = vi.hoisted(() => ({
  getDataSourceMonitor: vi.fn(),
  modalLoading: vi.fn(),
  modalCloseLoading: vi.fn()
}));

vi.mock('@/api/monitor/dataSource', () => ({
  getDataSourceMonitor: dataSourceMocks.getDataSourceMonitor
}));

vi.mock('@/utils/modal', () => ({
  default: {
    loading: dataSourceMocks.modalLoading,
    closeLoading: dataSourceMocks.modalCloseLoading,
    msgSuccess: vi.fn(),
    msgWarning: vi.fn(),
    msgError: vi.fn(),
    confirm: vi.fn()
  }
}));

const { default: DataSourcePage } = await import('@/pages/monitor/dataSource/index');

describe('pages/dataSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataSourceMocks.getDataSourceMonitor.mockResolvedValue({
      data: {
        summary: {
          dataSourceCount: 1,
          activeConnections: 3,
          idleConnections: 7,
          totalConnections: 10,
          maximumPoolSize: 20,
          threadsAwaitingConnection: 0
        },
        items: [
          {
            name: 'master',
            poolName: 'HikariPool-1',
            driverClassName: 'com.mysql.cj.jdbc.Driver',
            jdbcUrlMasked: 'jdbc:mysql://localhost:3306/infoq',
            usernameMasked: 'r***',
            p6spyEnabled: true,
            seataEnabled: false,
            metricsReady: true,
            running: true,
            activeConnections: 3,
            idleConnections: 7,
            totalConnections: 10,
            threadsAwaitingConnection: 0,
            minimumIdle: 10,
            maximumPoolSize: 20,
            connectionTimeoutMs: 30000,
            validationTimeoutMs: 5000,
            idleTimeoutMs: 300000,
            maxLifetimeMs: 840000,
            keepaliveTimeMs: 120000,
            leakDetectionThresholdMs: 0,
            usagePercent: 15,
            state: 'RUNNING'
          }
        ]
      }
    });
  });

  it('loads datasource monitor data and renders hikari pool details', async () => {
    renderWithRouter(<DataSourcePage />, '/monitor/dataSource');

    expect(await screen.findByText('连接池监控')).toBeInTheDocument();
    await waitFor(() => {
      expect(dataSourceMocks.getDataSourceMonitor).toHaveBeenCalledTimes(1);
    });

    expect(dataSourceMocks.modalLoading).toHaveBeenCalledWith('正在加载连接池监控数据，请稍候！');
    expect(dataSourceMocks.modalCloseLoading).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('master')).toBeInTheDocument();
    expect(await screen.findByText('HikariPool-1')).toBeInTheDocument();
    expect(await screen.findByText('jdbc:mysql://localhost:3306/infoq')).toBeInTheDocument();
    expect(await screen.findByText('运行中')).toBeInTheDocument();
    expect(await screen.findByText('P6Spy')).toBeInTheDocument();
  });
});
