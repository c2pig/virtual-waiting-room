import { Request, Response, NextFunction } from "express";
import ServingRoom from "../serving-room";
import { loadConfig } from '../configuration';
import ipRangeCheck from 'ip-range-check';

const config = loadConfig();

interface IByPassRules {
  name: string;
  conditions: ((test: string) => Boolean)[];
}

const byPassRules: IByPassRules[] = config.byPassRules().map(({urlPattern, uaPattern, ipCidr, name}) => {
  const conditions = [];
  if(urlPattern) {
    conditions.push((test: string) => new RegExp(urlPattern ?? "").test(test));
  }
  if(uaPattern) {
    conditions.push((test: string) => new RegExp(uaPattern ?? "").test(test));
  }
  if(ipCidr) {
    conditions.push((test: string) => ipRangeCheck(test, ipCidr ?? ""));
  }
  return {
    name,
    conditions
  }
});

const requestBypass = (req: Request): Boolean => {
  let toBypass = true;
  return toBypass;
}

export interface IRoomPass {
  queuedAt?: number; // non-exist, when a visitor does not need to queue
  acceptedAt?: number; // non-exist, user does not accept invitation in waiting room when is their turn
  queueId?: number;
  invitedAt?: number;
  retry: number;
}

export const endSession = () => {
}

const onWait = (req: Request) => (queueId: number) => {
  console.log(`----- wait(${queueId}) ---`);
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
  console.log(`----- invite(${queueId}) ----`);
  if(req.session.roomPass) {
    req.session.roomPass.queueId = queueId;
    req.session.roomPass.invitedAt = currTs;
    req.session.cookie.expires = new Date(expiredAfter);
  }
}

const onAccept = (req: Request) => (queueId: number, currTs: number) => {
  console.log(`----- accept(${queueId}) ----`);
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
    console.log(`----- check waiting room (${req.path}) ---`);
    const queueId = req.session.roomPass?.queueId ?? null;
    room.checkIn(queueId, {
      wait: onWait(req),
      invite: onInvitation(req),
      accept: onAccept(req)
    })
  }
  next();
}
