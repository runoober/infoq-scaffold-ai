export interface ServerCpu {
  cpuNum: number;
  used: number;
  sys: number;
  wait: number;
  free: number;
}

export interface ServerMem {
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface ServerJvm {
  total: number;
  max: number;
  used: number;
  free: number;
  usage: number;
  name: string;
  version: string;
  home: string;
  startTime: string;
  runTime: string;
  inputArgs: string;
}

export interface ServerSys {
  computerName: string;
  computerIp: string;
  osName: string;
  osArch: string;
  userDir: string;
}

export interface ServerSysFile {
  dirName: string;
  sysTypeName: string;
  typeName: string;
  total: string;
  free: string;
  used: string;
  usage: number;
}

export interface ServerMonitorVO {
  cpu: ServerCpu;
  mem: ServerMem;
  jvm: ServerJvm;
  sys: ServerSys;
  sysFiles: ServerSysFile[];
}
