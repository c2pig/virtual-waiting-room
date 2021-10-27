import { Request, Response, NextFunction } from "express";
import Concierge from "../concierge";
import logger from '../logger';

import { hasAccepted, onAccept, onInvitation, onWait, requestBypass } from '../common'

const log = logger('session');

export const endSession = () => {
  //TODO
}

export const checkSession = (concierge: Concierge) => async(req: Request, res: Response, next: NextFunction) => {
  log.debug(`Inspect Session: ${JSON.stringify(req.session.roomPass)}`);
  if(hasAccepted(req) && concierge.isInvited(req.session.roomPass?.queueId ?? -1)) {
    next();
    return;
  }
  if(! requestBypass(req)) {
    log.debug(`Room Check In: ${req.path}`);
    const queueId = req.session.roomPass?.queueId ?? null;
    concierge.checkIn(queueId, {
      wait: onWait(req, res),
      invite: onInvitation(req, res),
      accept: onAccept(req, res)
    })
  }
  next();
}
