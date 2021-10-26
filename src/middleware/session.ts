import { Request, Response, NextFunction } from "express";
import ServingRoom from "../serving-room";
import logger from '../logger';

import { hasAccepted, onAccept, onInvitation, onWait, requestBypass } from '../common'

const log = logger('session');

export const endSession = () => {
  //TODO
}

export const checkSession = (room: ServingRoom) => async(req: Request, res: Response, next: NextFunction) => {
  log.debug(`Inspect Session: ${JSON.stringify(req.session.roomPass)}`);
  if(hasAccepted(req)) {
    next();
    return;
  }
  if(! requestBypass(req)) {
    log.debug(`Room Check In: ${req.path}`);
    const queueId = req.session.roomPass?.queueId ?? null;
    room.checkIn(queueId, {
      wait: onWait(req, res),
      invite: onInvitation(req, res),
      accept: onAccept(req, res)
    })
  }
  next();
}
