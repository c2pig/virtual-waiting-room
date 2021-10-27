import logger from './logger';

const noop = () => {}
const log = logger('queue');

export interface IConciergeOptions {
  servingCapacity: number;
  inivitationTimeout: number;
}

export interface IRoomCallback {
  accept: (queueId: number, currentTimestamp: number) => void;
  invite: (queueId:number, currentTimestamp: number, expiredAfter: number) => void;
  wait: (queueId: number) => void

}

interface IQueueOperation {
  remove: (id: number) => Boolean;
  push: (id: number) => void;
  len: () => number;
}

interface IQueryable {
  has: (id: number) => Boolean;
}

class TimeoutQueue implements IQueueOperation, IQueryable {

  private _queue: Map<number, number>;

  ttl: number;

  constructor(ttl: number = -1) {
    this.ttl = ttl;
    this._queue = new Map();
  }

  remove(id: number): Boolean {
    return this._queue.delete(id);
  }

  push(id: number, ttlCb: ((id: number, queuedAt: number) => void) = noop) {
    this._queue.set(id, new Date().getTime())
    setTimeout(() => {
      const queueTs: number = this._queue.get(id) ?? -1;
      this._queue.delete(id);
      ttlCb(id, queueTs);
    }, this.ttl);
  }

  has(id: number): Boolean  {
    return this._queue.get(id) !== undefined;
  }

  len(): number {
    return this._queue.size;
  }
}

class ServingQueue implements IQueueOperation {

  private _queue: Map<number, number>;

  constructor() {
    this._queue = new Map();
  }

  remove(id: number): Boolean {
    return this._queue.delete(id);
  }

  push(id: number) {
    this._queue.set(id, new Date().getTime());
  }

  len(): number {
    return this._queue.size;
  }
}

class TicketIssuer {

  _issuedTicketCount: number = 0;
  _surrenderTicketCount: number = 0;

  issue(): number {
    return ++this._issuedTicketCount;
  }

  surrender(queueId: number): number {
    return ++this._surrenderTicketCount;
  }

  totalIssuedTicket(): number {
    return this._issuedTicketCount;
  }

  totalSurrenderTicket() : number {
    return this._surrenderTicketCount;
  }
}

/* 
  TODO: enable distributed queue and in-memory queue
*/
export default class Concierge {

  private _servingQueue: ServingQueue = new ServingQueue();
  private _ticketIssuer: TicketIssuer = new TicketIssuer();
  private _invitations: TimeoutQueue; 
  private _freeCapacityBuffer: number = 0;

  private capacity: number;
  private invitationTimeout: number;

  constructor(options: IConciergeOptions) {
    this.capacity = options.servingCapacity;
    this.invitationTimeout = options.inivitationTimeout ?? (60 * 1000);
    this._invitations = new TimeoutQueue(this.invitationTimeout);
    log.info(`serving room running at capacity(${this.capacity})`);
    log.info(`serving room has invitation timeout(${this.invitationTimeout})`);
  }

  exit(queueId: number) {
    log.debug(`remove ${queueId} from serving room`); 
    this._servingQueue.remove(queueId);
    this._ticketIssuer.surrender(queueId);
  }

  checkIn(queueId: number| null, cb: IRoomCallback) {
    let qId = queueId;

    if(!qId) {
      qId = this._ticketIssuer.issue();
    }

    if(this._invitations.has(qId)) {
      log.debug(`${queueId} accepted invitation`);
      cb.accept(qId, new Date().getTime());
      this._servingQueue.push(qId);
    } else if((this._servingQueue.len() + this._invitations.len()) < this.capacity) {
      const ts = new Date().getTime();
      log.debug(`invite ${qId} to serving room`); 
      this._invitations.push(qId, (id) => {
        log.debug(`${id} invitation has expired`); 
      });
      cb.invite(qId, ts, ts + this.invitationTimeout);
    } else {
      cb.wait(qId);
    }
  }

  isInvited = (queueId: number) => {
    return this._invitations.has(queueId);
  }

  servingAt(): number {
    return this._ticketIssuer.totalSurrenderTicket() + this._servingQueue.len();
  }

  runningAt(): number  {
    return this._ticketIssuer.totalIssuedTicket();
  }
}
