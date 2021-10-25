import { Request, Response, NextFunction } from "express";
import ServingRoom from "../serving-room";

export interface IWaitingRoom {
  queuedAt?: number; // non-exist, when a visitor does not need to queue
  acceptedAt?: number; // non-exist, user does not accept invitation in waiting room when is their turn
  queueId?: number;
  queueLength: number;
}

export const endSession = () => {
}

export const checkSession = (room: ServingRoom) => async(req: Request, res: Response, next: NextFunction) => {
  console.log('----- check session ---');
  console.log(req.session.id);
  console.log(req.sessionID);
  req.sessionStore.all!((err, sessions) => {
    console.log(sessions);
  });

  next();
}
