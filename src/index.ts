import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { loadConfig } from './configuration';
import { getStockAvailability } from './fake/stocks';
import { checkSession, IWaitingRoom } from './middleware/session';
import session, { Store } from 'express-session';
import cookieParser from 'cookie-parser';
import logger from './logger';
import ServingRoom from './serving-room';

declare module 'express-session' {
  export interface SessionData {
    vwr: IWaitingRoom;
  }
}

declare module 'express' {
  export interface Request {
    sessionStore: Store;
  }
}

const app = express();
const log = logger('main');
const config = loadConfig();
const room = new ServingRoom({
  servingCapacity: config.servingRoomCapacity(),
  inivitationTimeout: config.joinTimeoutInMin(60) 
});
const upstreamMap = config.upstreamMap();

app.use(cookieParser());
app.use(session({
  name: `_vwr_${config.appName()}`, 
  secret: config.signedSecret(),
  cookie: { maxAge: config.waitingRoomValidityInHour(60 * 60) },
}));

// @ts-ignore
app.use('/', checkSession(room))
// @ts-ignore
app.get('/v1/stocks', getStockAvailability);

upstreamMap.forEach(({from, to}) => {
  log.info(`[Proxy] ${from} -> ${to}`);
  app.use(from, createProxyMiddleware({ 
    logLevel: 'debug',
    changeOrigin: true,
    target: to,
  }));
}) 

app.listen(config.serverPort(), () => {
  log.info(`Waiting Room listening at http://localhost:${config.serverPort()}`);
})
