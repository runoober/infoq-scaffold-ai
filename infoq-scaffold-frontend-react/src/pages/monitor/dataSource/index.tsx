import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Empty, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DatabaseOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons';
import { getDataSourceMonitor } from '@/api/monitor/dataSource';
import type { DataSourceMonitorSummary, DataSourceMonitorVO, DataSourcePoolVO } from '@/api/monitor/dataSource/types';
import modal from '@/utils/modal';

const createDefaultSummary = (): DataSourceMonitorSummary => ({
  dataSourceCount: 0,
  activeConnections: 0,
  idleConnections: 0,
  totalConnections: 0,
  maximumPoolSize: 0,
  threadsAwaitingConnection: 0
});

const createDefaultMonitor = (): DataSourceMonitorVO => ({
  summary: createDefaultSummary(),
  items: []
});

const normalizePool = (pool?: Partial<DataSourcePoolVO>): DataSourcePoolVO => ({
  name: pool?.name ?? '',
  poolName: pool?.poolName ?? '',
  driverClassName: pool?.driverClassName ?? '',
  jdbcUrlMasked: pool?.jdbcUrlMasked ?? '',
  usernameMasked: pool?.usernameMasked ?? '',
  p6spyEnabled: pool?.p6spyEnabled ?? false,
  seataEnabled: pool?.seataEnabled ?? false,
  metricsReady: pool?.metricsReady ?? false,
  running: pool?.running ?? false,
  activeConnections: pool?.activeConnections ?? null,
  idleConnections: pool?.idleConnections ?? null,
  totalConnections: pool?.totalConnections ?? null,
  threadsAwaitingConnection: pool?.threadsAwaitingConnection ?? null,
  minimumIdle: pool?.minimumIdle ?? null,
  maximumPoolSize: pool?.maximumPoolSize ?? null,
  connectionTimeoutMs: pool?.connectionTimeoutMs ?? null,
  validationTimeoutMs: pool?.validationTimeoutMs ?? null,
  idleTimeoutMs: pool?.idleTimeoutMs ?? null,
  maxLifetimeMs: pool?.maxLifetimeMs ?? null,
  keepaliveTimeMs: pool?.keepaliveTimeMs ?? null,
  leakDetectionThresholdMs: pool?.leakDetectionThresholdMs ?? null,
  usagePercent: pool?.usagePercent ?? null,
  state: pool?.state ?? 'UNINITIALIZED'
});

const normalizeMonitor = (value?: Partial<DataSourceMonitorVO> | null): DataSourceMonitorVO => ({
  summary: {
    ...createDefaultSummary(),
    ...(value?.summary ?? {})
  },
  items: (value?.items ?? []).map((item) => normalizePool(item))
});

const displayText = (value?: string | null) => value || '-';

const displayCount = (value?: number | null) => (value ?? 0).toString();

const formatPercent = (value?: number | null) => `${Number(value ?? 0).toFixed(2)}%`;

const formatDuration = (value?: number | null) => {
  if (value == null) {
    return '-';
  }
  if (value >= 60_000) {
    return `${(value / 60_000).toFixed(value % 60_000 === 0 ? 0 : 1)} min`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)} s`;
  }
  return `${value} ms`;
};

const getStateMeta = (state?: string) =>
  (
    ({
      RUNNING: { label: '运行中', color: 'success' },
      BUSY: { label: '繁忙', color: 'orange' },
      SATURATED: { label: '饱和', color: 'error' },
      UNINITIALIZED: { label: '未初始化', color: 'default' }
    }) as Record<string, { label: string; color: string }>
  )[state || ''] || { label: state || '-', color: 'default' };

export default function DataSourcePage() {
  const [monitor, setMonitor] = useState<DataSourceMonitorVO>(createDefaultMonitor);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadMonitor = async () => {
      modal.loading('正在加载连接池监控数据，请稍候！');
      setErrorMessage('');
      try {
        const response = await getDataSourceMonitor();
        setMonitor(normalizeMonitor(response.data));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载连接池监控数据失败');
      } finally {
        modal.closeLoading();
      }
    };

    loadMonitor();
  }, []);

  const columns = useMemo<ColumnsType<DataSourcePoolVO>>(
    () => [
      {
        title: '数据源',
        dataIndex: 'name',
        key: 'name',
        width: 180,
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text strong>{displayText(record.name)}</Typography.Text>
            <Typography.Text type="secondary">{displayText(record.poolName)}</Typography.Text>
            <Typography.Text type="secondary">{displayText(record.driverClassName)}</Typography.Text>
          </Space>
        )
      },
      {
        title: '状态',
        dataIndex: 'state',
        key: 'state',
        width: 140,
        render: (value: string, record) => {
          const meta = getStateMeta(value);
          return (
            <Space orientation="vertical" size={4}>
              <Tag color={meta.color}>{meta.label}</Tag>
              <Typography.Text type="secondary">{record.running ? '池已启动' : '池未启动'}</Typography.Text>
            </Space>
          );
        }
      },
      {
        title: '连接概览',
        key: 'connections',
        width: 170,
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <span>活跃 {displayCount(record.activeConnections)}</span>
            <span>空闲 {displayCount(record.idleConnections)}</span>
            <span>总数 {displayCount(record.totalConnections)}</span>
          </Space>
        )
      },
      {
        title: '池配置',
        key: 'poolConfig',
        width: 150,
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <span>最小 {displayCount(record.minimumIdle)}</span>
            <span>最大 {displayCount(record.maximumPoolSize)}</span>
            <span>账号 {displayText(record.usernameMasked)}</span>
          </Space>
        )
      },
      {
        title: '等待线程',
        dataIndex: 'threadsAwaitingConnection',
        key: 'threadsAwaitingConnection',
        width: 110,
        align: 'center',
        render: (value: number | null) => displayCount(value)
      },
      {
        title: '占用率',
        dataIndex: 'usagePercent',
        key: 'usagePercent',
        width: 180,
        render: (value: number | null) => {
          const usage = value ?? 0;
          return (
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text style={{ color: usage >= 80 ? '#cf1322' : undefined }}>{formatPercent(usage)}</Typography.Text>
              <Progress percent={usage} size="small" status={usage >= 90 ? 'exception' : undefined} />
            </Space>
          );
        }
      },
      {
        title: '超时配置',
        key: 'timeouts',
        width: 190,
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <span>获取 {formatDuration(record.connectionTimeoutMs)}</span>
            <span>校验 {formatDuration(record.validationTimeoutMs)}</span>
            <span>生命周期 {formatDuration(record.maxLifetimeMs)}</span>
          </Space>
        )
      },
      {
        title: '特性',
        key: 'features',
        width: 140,
        render: (_, record) => (
          <Space size={4} wrap>
            {record.p6spyEnabled ? <Tag color="gold">P6Spy</Tag> : null}
            {record.seataEnabled ? <Tag color="success">Seata</Tag> : null}
            {!record.p6spyEnabled && !record.seataEnabled ? <span>-</span> : null}
          </Space>
        )
      },
      {
        title: 'JDBC URL',
        dataIndex: 'jdbcUrlMasked',
        key: 'jdbcUrlMasked',
        width: 320,
        render: (value: string) => <Typography.Text style={{ wordBreak: 'break-all' }}>{displayText(value)}</Typography.Text>
      }
    ],
    []
  );

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Card hoverable>
            <Statistic title="数据源数" value={monitor.summary.dataSourceCount} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable>
            <Statistic title="活跃连接" value={monitor.summary.activeConnections} prefix={<LinkOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable>
            <Statistic title="空闲连接" value={monitor.summary.idleConnections} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable>
            <Statistic title="等待线程" value={monitor.summary.threadsAwaitingConnection} prefix={<LoadingOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card hoverable title="连接池监控">
        <Table<DataSourcePoolVO>
          rowKey="name"
          columns={columns}
          dataSource={monitor.items}
          pagination={false}
          scroll={{ x: 1500 }}
          locale={{ emptyText: <Empty description="暂无连接池数据" /> }}
        />
      </Card>
    </Space>
  );
}
