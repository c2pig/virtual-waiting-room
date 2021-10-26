interface IProxyConfigReader {
  upstreamMap: IUpstreamMap[];
  byPassRules: IByPassRuleEntry[];
  serverPort: number;
  servingRoomCapacity: number;
  session: ISessionConfig;
  waitingRoom: IWaitingRoomConfig;
}

interface ISessionConfig {
  sessionDurationInMin: number;
  endSessionUrls: string[];
}

interface IWaitingRoomConfig {
  page: string;
  errorPage: string;
  redirectToUpstream: string;
  joinTimeoutInMin: number;
  validityInHour: number;
}

interface IUpstreamMap {
  name: string;
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
  urlPattern?: string;
  ipCidr?: string;
  uaPattern?: string;
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
  errorPage: () => string;
  waitingRoomPage: () => string;
  redirectToUpstream: () => string;
} 

export const loadConfig = (): IProxyConfig => {
  
  const path = require('path');
  const configPath = `config/${process.env.NODE_ENV ?? "default"}/proxy-config.json`;
  const config: IProxyConfigReader = require(path.join(__dirname, '../', configPath));

  return {
    upstreamMap: () => (config.upstreamMap),
    sessionTimeoutInMin: (minUnit: number = 1) => (config.session.sessionDurationInMin * minUnit),
    endSessionUrls: () => (config.session.endSessionUrls),
    byPassRules: () => (config.byPassRules),
    waitingRoomValidityInHour: (hourUnit: number = 1) => (config.waitingRoom.validityInHour * hourUnit),
    serverPort: () => (config.serverPort),
    servingRoomCapacity: () => (config.servingRoomCapacity),
    joinTimeoutInMin: (minUnit: number = 1) => (config.waitingRoom.joinTimeoutInMin * minUnit),
    redisAddress: () => (
      process.env.NODE_ENV === "development" ? 
        "localhost:6379" : `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    ),
    signedSecret: () => (
      process.env.NODE_ENV === "development" ? 
        "onefineday" : `${process.env.SIGNED_SECRET}`
    ),
    appName: () => (require(path.join(__dirname, '../', 'package.json')).name),
    errorPage: () => (config.waitingRoom.errorPage),
    waitingRoomPage: () => (config.waitingRoom.page),
    redirectToUpstream: () => (config.waitingRoom.redirectToUpstream)
  }
};
