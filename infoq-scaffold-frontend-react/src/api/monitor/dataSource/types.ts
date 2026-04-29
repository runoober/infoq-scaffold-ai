export interface DataSourceMonitorSummary {
  dataSourceCount: number;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maximumPoolSize: number;
  threadsAwaitingConnection: number;
}

export interface DataSourcePoolVO {
  name: string;
  poolName: string;
  driverClassName: string;
  jdbcUrlMasked: string;
  usernameMasked: string;
  p6spyEnabled: boolean;
  seataEnabled: boolean;
  metricsReady: boolean;
  running: boolean;
  activeConnections: number | null;
  idleConnections: number | null;
  totalConnections: number | null;
  threadsAwaitingConnection: number | null;
  minimumIdle: number | null;
  maximumPoolSize: number | null;
  connectionTimeoutMs: number | null;
  validationTimeoutMs: number | null;
  idleTimeoutMs: number | null;
  maxLifetimeMs: number | null;
  keepaliveTimeMs: number | null;
  leakDetectionThresholdMs: number | null;
  usagePercent: number | null;
  state: string;
}

export interface DataSourceMonitorVO {
  summary: DataSourceMonitorSummary;
  items: DataSourcePoolVO[];
}
