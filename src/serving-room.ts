import logger from './logger';

const noop = () => {}
const log = logger('room');

export interface IServingRoomOptions {
  servingCapacity: number;
  inivitationTimeout: number;
}

export interface IAcceptOrWait {
  accept: (queueId:number, currentTimestamp: number, expiredAfter: number) => {};
  wait: (queueId: number) => {}
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

  _queue: Map<number, number>;

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

  _counter: number = 0;
  _queue: Map<number, number>;

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
export default class ServingRoom {

  _servingQueue: ServingQueue = new ServingQueue();
  _ticketIssuer: TicketIssuer = new TicketIssuer();
  _invitations: TimeoutQueue; 
  _freeCapacityBuffer: number = 0;

  capacity: number;
  invitationTimeout: number;

  constructor(options: IServingRoomOptions) {
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

  checkIn(queueId: number, cb: IAcceptOrWait) {
    if(!queueId) {
      cb.wait(this._ticketIssuer.issue());
    } else {
      if(this._invitations.has(queueId)) {
        log.debug(`${queueId} accepted invitation`); 
        this._servingQueue.push(queueId);
      } else if((this._servingQueue.len() + this._invitations.len()) < this.capacity) {
      /*
        TODO: how to safely ensure serverQueue does not overflow?
          - maybe safetyBuffer?
      */
        const ts = new Date().getTime();
        log.debug(`invite ${queueId} to serving room`); 
        this._invitations.push(queueId, (id) => {
          log.debug(`${id} invitation has expired`); 
        });
        cb.accept(queueId, ts, ts + this.invitationTimeout);
      } else {
        cb.wait(queueId);
      }
    }
  }

  servingAt(): number {
    return this._ticketIssuer.totalSurrenderTicket() + this._servingQueue.len();
  }

  runningAt(): number  {
    return this._ticketIssuer.totalIssuedTicket();
  }
}
