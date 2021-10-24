interface IProxyConfigReader {
  upstreamMap: IUpstreamMap[];
  sessionTimeoutInMs: number;
  endSessionUrls: string[];
  byPassRules: IByPassRuleEntry[];
}

interface IUpstreamMap {
  from: string;
  to: string;
}

interface IProxyConfigEnv {
  redisAddress: () => string;
}

interface IByPassRuleEntry {
  name: string;
  url?: string;
  ipCidr?: string;
  ua?: string;
}

export interface IProxyConfig extends IProxyConfigEnv {
  upstreamMap: () => IUpstreamMap[];
  sessionTimeoutInMs:() => number;
  endSessionUrls: () => string[];
  byPassRules: () => IByPassRuleEntry[];
} 

export const loadConfig = (): IProxyConfig => {
  
  const path = require('path');
  const configPath = `config/${process.env.NODE_ENV ?? "default"}/proxy-config.json`;
  const config: IProxyConfigReader = require(path.join(__dirname, '../', configPath));

  return {
    upstreamMap: () => (config.upstreamMap),
    sessionTimeoutInMs: () => (config.sessionTimeoutInMs),
    endSessionUrls: () => (config.endSessionUrls),
    byPassRules: () => (config.byPassRules),
    redisAddress: () => (`process.env.REDIS_HOST:process.env.REDIS_PORT` ?? "localhost:6379")
  }
};
