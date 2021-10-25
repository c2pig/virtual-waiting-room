interface IProxyConfigReader {
  upstreamMap: IUpstreamMap[];
  sessionTimeoutInMin: number;
  endSessionUrls: string[];
  byPassRules: IByPassRuleEntry[];
  waitingRoomValidityInHour: number;
  serverPort: number;
  servingRoomCapacity: number;
  joinTimeoutInMin: number;
}

interface IUpstreamMap {
  from: string;
  to: string;
}

interface IProxyConfigEnv {
  redisAddress: () => string;
  signedSecret: () => string;
  appName: () => string;
}

interface IByPassRuleEntry {
  name: string;
  url?: string;
  ipCidr?: string;
  ua?: string;
}

export interface IProxyConfig extends IProxyConfigEnv {
  upstreamMap: () => IUpstreamMap[];
  sessionTimeoutInMin:(minUnit?: number) => number;
  endSessionUrls: () => string[];
  byPassRules: () => IByPassRuleEntry[];
  waitingRoomValidityInHour: (hourUnit?: number) => number;
  serverPort: () => number;
  servingRoomCapacity: () => number;
  joinTimeoutInMin: (minUnit?: number) => number;
} 

export const loadConfig = (): IProxyConfig => {
  
  const path = require('path');
  const configPath = `config/${process.env.NODE_ENV ?? "default"}/proxy-config.json`;
  const config: IProxyConfigReader = require(path.join(__dirname, '../', configPath));

  return {
    upstreamMap: () => (config.upstreamMap),
    sessionTimeoutInMin: (minUnit: number = 1) => (config.sessionTimeoutInMin * minUnit),
    endSessionUrls: () => (config.endSessionUrls),
    byPassRules: () => (config.byPassRules),
    waitingRoomValidityInHour: (hourUnit: number = 1) => (config.waitingRoomValidityInHour * hourUnit),
    serverPort: () => (config.serverPort),
    servingRoomCapacity: () => (config.servingRoomCapacity),
    joinTimeoutInMin: (minUnit: number = 1) => (config.joinTimeoutInMin * minUnit),
    redisAddress: () => (
      process.env.NODE_ENV === "development" ? 
        "localhost:6379" : `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    ),
    signedSecret: () => (
      process.env.NODE_ENV === "development" ? 
        "onefineday" : `${process.env.SIGNED_SECRET}`
    ),
    appName: () => (require(path.join(__dirname, '../', 'package.json')).name),
  }
};
