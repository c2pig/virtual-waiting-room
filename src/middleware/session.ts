import { Request, Response, NextFunction } from "express";
import ServingRoom from "../serving-room";
import { loadConfig } from '../configuration';
import ipRangeCheck from 'ip-range-check';
import logger from '../logger';
const config = loadConfig();

interface IByPassRules {
  name: string;
  headerCheck?: ((test: string) => boolean);
  ipCheck?: ((test: string) => boolean);
  pathCheck?: ((test: string) => boolean);
}

const log = logger('session');

const byPassRules: IByPassRules[] = config.byPassRules().map(({urlPattern, uaPattern, ipCidr, name}) => {
  let headerCheck, ipCheck, pathCheck;

  if(urlPattern) {
    pathCheck = (test: string) => new RegExp(urlPattern ?? "", "i").test(test);
  }
  if(uaPattern) {
    headerCheck = (test: string) => new RegExp(uaPattern ?? "", "i").compile().test(test);
  }
  if(ipCidr) {
    ipCheck = (test: string) => ipRangeCheck(test, ipCidr ?? "");
  }
  return {
    name,
    headerCheck,
    ipCheck,
    pathCheck
  }
});

const noop = () => (true);

const requestBypass = (req: Request): Boolean => {
  let toBypass = false;
  //@ts-ignore
  byPassRules.forEach(({name, headerCheck = noop, ipCheck = noop, pathCheck = noop}) => {
    toBypass = headerCheck(req.headers["user-agent"] ?? '')
     && ipCheck(req.ip)
     && pathCheck(req.path);

    if(toBypass === true) {
      return true
    }
  }) 
  return toBypass;
}

export interface IRoomPass {
  queuedAt?: number; 
  acceptedAt?: number; 
  queueId?: number;
  invitedAt?: number;
  retry: number;
}

export const endSession = () => {
}

const onWait = (req: Request) => (queueId: number) => {
  log.debug(`wait(${queueId})`);
  if(req.session.roomPass?.queueId) {
    req.session.roomPass.retry++;
  } else {
    req.session.roomPass = {
      retry: 0,
      queueId,
      queuedAt: new Date().getTime()
    }
  }
}

const onInvitation = (req: Request) => (queueId: number, currTs: number, expiredAfter: number) => {
  log.debug(`invite(${queueId})`);
  if(req.session.roomPass) {
    req.session.roomPass.queueId = queueId;
    req.session.roomPass.invitedAt = currTs;
    req.session.cookie.expires = new Date(expiredAfter);
  }
}

const onAccept = (req: Request) => (queueId: number, currTs: number) => {
  log.debug(`accept(${queueId})`);
  const { retry = 0, queuedAt = currTs } = req.session.roomPass || {};
  req.session.roomPass = {
    queueId,
    acceptedAt: currTs,
    retry,
    queuedAt
  }
  req.session.cookie.expires = new Date(currTs + config.sessionTimeoutInMin(60 * 1000));
}

export const checkSession = (room: ServingRoom) => async(req: Request, res: Response, next: NextFunction) => {

  if(! requestBypass(req)) {
    log.debug(`check waiting room (${req.path})`);
    const queueId = req.session.roomPass?.queueId ?? null;
    room.checkIn(queueId, {
      wait: onWait(req),
      invite: onInvitation(req),
      accept: onAccept(req)
    })
  }
  next();
}
