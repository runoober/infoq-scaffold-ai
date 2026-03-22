import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../helpers/renderWithRouter';

const cacheMocks = vi.hoisted(() => ({
  getCache: vi.fn(),
  modalLoading: vi.fn(),
  modalCloseLoading: vi.fn(),
  chartInit: vi.fn(),
  chartSetOption: vi.fn(),
  chartResize: vi.fn(),
  chartDispose: vi.fn()
}));

vi.mock('@/api/monitor/cache', () => ({
  getCache: cacheMocks.getCache
}));

vi.mock('@/utils/modal', () => ({
  default: {
    loading: cacheMocks.modalLoading,
    closeLoading: cacheMocks.modalCloseLoading,
    msgSuccess: vi.fn(),
    msgWarning: vi.fn(),
    msgError: vi.fn(),
    confirm: vi.fn()
  }
}));

vi.mock('@/utils/echarts', () => ({
  default: {
    init: cacheMocks.chartInit
  }
}));

const { default: CachePage } = await import('@/pages/monitor/cache/index');

describe('pages/cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheMocks.getCache.mockResolvedValue({
      data: {
        dbSize: 128,
        info: {
          redis_version: '7.2.0',
          redis_mode: 'standalone',
          tcp_port: '6379',
          connected_clients: '8',
          uptime_in_days: '12',
          used_memory_human: '123.45',
          used_cpu_user_children: '3.14',
          maxmemory_human: '1G',
          aof_enabled: '1',
          rdb_last_bgsave_status: 'ok',
          instantaneous_input_kbps: '10',
          instantaneous_output_kbps: '12'
        },
        commandStats: [
          { name: 'get', value: '20' },
          { name: 'set', value: '10' }
        ]
      }
    });
    cacheMocks.chartInit.mockReturnValue({
      setOption: cacheMocks.chartSetOption,
      resize: cacheMocks.chartResize,
      dispose: cacheMocks.chartDispose
    });
  });

  it('loads cache metrics and initializes pie and gauge charts', async () => {
    renderWithRouter(<CachePage />, '/monitor/cache');

    expect(screen.getByText('基本信息')).toBeInTheDocument();

    await waitFor(() => {
      expect(cacheMocks.getCache).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByTestId('cache-command-chart')).toBeInTheDocument();
    expect(await screen.findByTestId('cache-memory-chart')).toBeInTheDocument();

    expect(cacheMocks.modalLoading).toHaveBeenCalledWith('正在加载缓存监控数据，请稍候！');
    expect(cacheMocks.modalCloseLoading).toHaveBeenCalledTimes(1);
    expect(cacheMocks.chartInit).toHaveBeenCalledTimes(2);
    expect(cacheMocks.chartSetOption).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        series: [expect.objectContaining({ type: 'pie', data: [{ name: 'get', value: '20' }, { name: 'set', value: '10' }] })]
      })
    );
    expect(cacheMocks.chartSetOption).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        series: [expect.objectContaining({ type: 'gauge', data: [expect.objectContaining({ value: 123.45, name: '内存消耗' })] })]
      })
    );
  });

  it('resizes and disposes both charts with the page lifecycle', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderWithRouter(<CachePage />, '/monitor/cache');

    await waitFor(() => {
      expect(cacheMocks.chartInit).toHaveBeenCalledTimes(2);
    });

    const resizeHandler = addEventListenerSpy.mock.calls.find((call) => call[0] === 'resize')?.[1];
    expect(resizeHandler).toBeInstanceOf(Function);

    (resizeHandler as EventListener)(new Event('resize'));

    expect(cacheMocks.chartResize).toHaveBeenCalledTimes(2);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', resizeHandler);
    expect(cacheMocks.chartDispose).toHaveBeenCalledTimes(2);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
