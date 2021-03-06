import express, { Request, Response } from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { loadConfig } from './configuration';
import { getStockAvailability } from './fake/stocks';
import { checkSession } from './middleware/session';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import logger from './logger';
import Concierge from './concierge';
import cors from 'cors';
import { hasAccepted, hasInvited, IRoomPass, noop, onAccept, onInvitation } from './common';

declare module 'express-session' {
  export interface SessionData {
    roomPass: IRoomPass;
  }
}

const app = express();
const log = logger('main');
const config = loadConfig();
const concierge = new Concierge({
  servingCapacity: config.servingRoomCapacity(),
  inivitationTimeout: config.joinTimeoutInMin(60 * 1000),
});
const upstreamMap = config.upstreamMap();

app.use(cors({
  //TODO: make it secure
  origin: (origin, cb) => {
    cb(null, true);
  },
  methods: ['GET', 'DELETE', 'OPTION'],
  credentials: true 
}));
app.use(cookieParser());
app.use(session({
  name: `_vwr_${config.appName()}`, 
  secret: config.signedSecret(),
  cookie: { 
    maxAge: config.waitingRoomValidityInHour(60 * 60 * 1000),
  },
  resave: false,
  saveUninitialized: true,
}));

// @ts-ignore
app.use('/', checkSession(concierge))


// @ts-ignore
app.get('/v1/stocks', getStockAvailability);

app.delete('/v1/invitations', (req, res) => {
  req.session.destroy(() => {
    res.json({});
  });
});

app.get('/v1/stats', async (req: Request, res: Response) => {
  let eta = {};
  const queueId = req.session?.roomPass?.queueId;
  const numberOfWaiting = (await concierge.runningAt() - await concierge.servingAt());
  if(queueId && queueId >= await concierge.servingAt()) {
    const numberOfAhead = (queueId - await concierge.servingAt());
    eta = {
     estimatedEarlyTimeMinute: numberOfAhead * (config.sessionTimeoutInMin() * 0.3),
     estimatedLateTimeMinute: numberOfAhead * (config.sessionTimeoutInMin() * 0.7),
     numberOfAhead,
     ticketNumber: queueId
    }
  }

  res.json({
    total: concierge.runningAt(),
    lastServedTicketNumber: concierge.servingAt(),
    numberOfWaiting,
    ...eta
  });
})

app.get('/v1/invitations', (req: Request, res: Response) => {
  log.debug(`Inspect Session: ${JSON.stringify(req.session.roomPass)}`);
  if(req.session.roomPass) {
    const { queueId = -1, expiredAfter = 0 } = req.session.roomPass;
    if(hasAccepted(req)) {
      const now = new Date().getTime()
      const invitationTimeout = expiredAfter - now;
      const bufferTime = 10 * 1000
      return res.json({
        ticketNumber: queueId,
        invitationTimeout,
        invited: (invitationTimeout >= bufferTime)
      })
    } else if(hasInvited(req)) {
      concierge.checkIn(queueId, {
        wait: noop,
        invite: onInvitation(req, res, () => {}),
        accept: onAccept(req, res, () => { })
      })
    } else {
      concierge.checkIn(queueId, {
        wait: noop,
        invite: onInvitation(req, res, () => {}),
        accept: noop
      })
    }
  }
  return res.json({
    invited: false
  })
});

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
