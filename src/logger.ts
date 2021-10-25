import log from 'util';

const logger = (namespace: string = "unknown") => {
  return {
    debug: (msg: string) => {
      log.debuglog(`app.${namespace}.debug`)(msg);
    },
    info: (msg: string) => {
      log.debuglog(`app.${namespace}.info`)(msg);
    },
    error: (msg: string) => {
      log.debuglog(`app.${namespace}.error`)(msg);
    }
  }
}

export default logger;