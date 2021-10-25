import log from 'util';

const logger = (namespace: string = "app") => {
  return {
    debug: (msg: string) => {
      log.debuglog(`all-${namespace}-debug`)(msg);
    },
    info: (msg: string) => {
      log.debuglog(`all-${namespace}-info`)(msg);
    },
    error: (msg: string) => {
      log.debuglog(`all-${namespace}-error`)(msg);
    }
  }
}

export default logger;