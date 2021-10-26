
import { Request, Response } from "express";
import { loadConfig } from './configuration';
import logger from './logger';
import ipRangeCheck from 'ip-range-check';

const config = loadConfig();
const log = logger('common');

export const upsertRoomPass = (roomPass: IRoomPass) => async (req: Request) => {
  return new Promise((resolve, reject) => {
    if(req.session.roomPass) {
      const snapshot = req.session.roomPass;
      req.session.roomPass = {
        ...snapshot,
        ...roomPass,
      }
    } else {
      req.session.roomPass = roomPass;
    }
    req.session.save((err) => {
      if(err) {
        reject(err);
      }
      resolve(req.session.roomPass);
    });
  }) 
}

export const onWait = (req: Request, res: Response) => (queueId: number) => {
  log.debug(`wait(${queueId})`);
  const doRedirect = (data: unknown) => { 
    res.redirect(`${config.waitingRoomPage()}`);
  }
  if(req.session.roomPass?.queueId) {
    upsertRoomPass({
      retry: req.session.roomPass.retry + 1
    })(req).then(doRedirect)
  } else {
    upsertRoomPass({
      retry: 0,
      queueId,
      queuedAt: new Date().getTime()
    })(req).then(doRedirect);
  }
}

export const onInvitation = (req: Request, res: Response, postInvite?: () => void) => (queueId: number, currTs: number, expiredAfter: number) => {
  log.debug(`invite(${queueId})`);
  const postAction = postInvite ? postInvite : () => {
    res.redirect(`${config.waitingRoomPage()}`);
  }
  upsertRoomPass({
    queueId,
    invitedAt: currTs,
    retry: 0,
    expiredAfter
  })(req).then(postAction);
}

export const onAccept = (req: Request, res: Response, postAccept?: () => void) => (queueId: number, currTs: number) => {
  log.debug(`accept(${queueId})`);
  const { retry = 0, queuedAt = currTs } = req.session.roomPass || {};
  const postAction = postAccept ? postAccept : () => {
    req.session.cookie.expires = new Date(currTs + config.sessionTimeoutInMin(60 * 1000));
    res.redirect( config.redirectToUpstream());
  }
  upsertRoomPass({
    queueId,
    acceptedAt: currTs,
    retry,
    queuedAt
  })(req).then(postAction);
}

export const byPassRules: IByPassRules[] = config.byPassRules().map(({urlPattern, uaPattern, ipCidr, name}) => {
  let headerCheck, ipCheck, pathCheck;
  if(urlPattern) {
    pathCheck = (test: string) => new RegExp(urlPattern ?? "", "i").test(test);
  }
  if(uaPattern) {
    headerCheck = (test: string) => new RegExp(uaPattern ?? "", "i").test(test);
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

export const noop = () => (false);

export const requestBypass = (req: Request): boolean => {
  let byPass = false;
  //@ts-ignore
  byPass = byPassRules.some(({name, headerCheck = noop, ipCheck = noop, pathCheck = noop}) => {
     if(pathCheck(req.path)) {
       return true;
     } else if(headerCheck(req.headers["user-agent"] ?? '')) {
       return true;
     } else if(ipCheck(req.ip)) {
       return true;
     }
  });
  return byPass;
}

export const hasAccepted = (req: Request) => {
  return req.session?.roomPass?.acceptedAt !== undefined;
}

export const hasInvited = (req: Request) => {
  return req.session?.roomPass?.invitedAt !== undefined;
}

export interface IByPassRules {
  name: string;
  headerCheck?: ((test: string) => boolean);
  ipCheck?: ((test: string) => boolean);
  pathCheck?: ((test: string) => boolean);
}

export interface IRoomPass {
  queuedAt?: number; 
  acceptedAt?: number; 
  queueId?: number;
  invitedAt?: number;
  expiredAfter?: number;
  retry: number;
}