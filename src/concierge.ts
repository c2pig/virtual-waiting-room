import logger from './logger';
import { Store, QueryableStore, TransactionalStore } from './store/Store';
import { promisify } from 'util';
import { MemoryStore, QueryStore as MemoryQueryStore } from './store/MemoryStore';
import { QueryStore as RedisQueryStore} from './store/RedisStore';
import { RedisClient } from 'redis';
import RedisStore from './store/RedisStore';
import { Counter, ICounterOperation, MemoryCounter, RedisCounter } from './store/Counter';

const noop = () => {}
const log = logger('queue');

export interface IConciergeOptions {
  servingCapacity: number;
  inivitationTimeout: number;
  redisClient?: RedisClient;
}

export interface IRoomCallback {
  accept: (queueId: number, currentTimestamp: number) => void;
  invite: (queueId:number, currentTimestamp: number, expiredAfter: number) => void;
  wait: (queueId: number) => void

}

interface IQueueOperation {
  remove: (id: number) => void | Promise<void>;
  push: (id: number) => void;
  len: () => number | Promise<number>;
  has: (id: number) => Promise<Boolean>;
}

class TimeoutQueue implements IQueueOperation {

  private _store: Store & QueryableStore;
  private purge = (ttl: number, ttlCb: (msg: string) => void) => {
    setTimeout(async() => {
      this._store.expire(ttl);
      ttlCb("Expiry purge run");
      this.purge(ttl, ttlCb);
    }, ttl);
  }

  constructor(ttl: number = -1, store: Store & QueryableStore, ttlCb: (msg: string) => void = noop) {
    this._store = store;
    this.purge(ttl, ttlCb);
  }

  async remove(id: number) {
    return await this._store.delete(id.toString());
  }

  push(id: number) {
    this._store.set(id.toString())
  }

  async has(id: number) {
    return this._store.has(id.toString());
  }

  len() {
    return this._store.len();
  }
}

class ServingQueue implements IQueueOperation {

  private _set: (value: string) => Promise<void>;
  private _delete: (value: string) => void;
  private _store: Store & QueryableStore;

  constructor(store: Store & QueryableStore) {
    this._delete = promisify<string>(store.delete).bind(store);
    this._set = promisify<string>(store.set).bind(store);
    this._store = store;
  }

  remove(id: number) {
    return this._delete(id.toString());
  }

  push(id: number) {
    this._set(id.toString());
  }

  len() {
    return this._store.len();
  }

  async has(id: number) {
    return this._store.has(id.toString());
  }
}

class TicketCounter {
  private _counter: ICounterOperation;
  
  constructor(counter: ICounterOperation) {
    this._counter = counter;
  }

  async count() {
    const count = await this._counter.incr();
    return count ?? -1;
  }

  uncount() {
    return this._counter.decr();
  }

  async total() {
    const total = await this._counter.count();
    return total ?? -1;
  }
}

class QueueStore implements Store, QueryableStore {
  private _store: Store;
  private _queryStore: QueryableStore;

  constructor(store: Store, queryStore: QueryableStore) {
    this._store = store;
    this._queryStore = queryStore;
  }

  has(value: string) { return this._queryStore.has(value); }
  len() { return this._queryStore.len(); }
  set(value: string) { this._store.set(value); }
  delete(value: string) { this._store.delete(value); }
  expire(ttl: number) { this._store.expire(ttl); }
}

export default class Concierge {

  private _servingQueue: ServingQueue;
  private _ticketIssuer: TicketCounter;
  private _ticketProcessor: TicketCounter;
  private _invitations: TimeoutQueue; 
  private _freeCapacityBuffer: number = 0;
  private _servingTransaction: TransactionalStore; 

  private capacity: number;
  private invitationTimeout: number;
  private options:IConciergeOptions; 

  constructor(options: IConciergeOptions) {
    const queueName = "queue";
    const invitationQueueName = "invitation_queue";
    this.options = options;
    this.capacity = options.servingCapacity;
    const store = options.redisClient ? new RedisStore(options.redisClient, queueName) : new MemoryStore();
    this._servingTransaction = store as TransactionalStore;
    const queryStore = options.redisClient ? new RedisQueryStore(options.redisClient, queueName) : new MemoryQueryStore();
    const invitationStore = options.redisClient ? new RedisStore(options.redisClient, invitationQueueName) : new MemoryStore();
    const invitationQueryStore = options.redisClient ? new RedisQueryStore(options.redisClient, invitationQueueName) : new MemoryQueryStore();
    const issuerCounter = options.redisClient ? RedisCounter("issuer", options.redisClient) : MemoryCounter();
    const processorCounter = options.redisClient ? RedisCounter("processor", options.redisClient) : MemoryCounter();
    this.invitationTimeout = options.inivitationTimeout ?? (60 * 1000);
    this._invitations = new TimeoutQueue(this.invitationTimeout, new QueueStore(invitationStore, invitationQueryStore), () => {
      log.debug(`invitation has expired`); 
    });
    this._servingQueue = new ServingQueue(new QueueStore(store, queryStore));
    this._ticketIssuer = new TicketCounter(Counter(issuerCounter));
    this._ticketProcessor = new TicketCounter(Counter(processorCounter));
    log.info(`serving room running at capacity(${this.capacity})`);
    log.info(`serving room has invitation timeout(${this.invitationTimeout})`);
  }

  exit(queueId: number) {
    log.debug(`remove ${queueId} from serving room`); 
    this._servingQueue.remove(queueId);
    this._ticketProcessor.count();
  }

  async checkIn(queueId: number| null, cb: IRoomCallback) {
    let qId = queueId;

    if(!qId) {
      qId = await this._ticketIssuer.count();
    }

    this._servingTransaction.begin(); 
    const queueLen = await this._servingQueue.len();
    const invitationLen = await this._invitations.len();
    if(await this._invitations.has(qId)) {
      log.debug(`${queueId} accepted invitation`);
      cb.accept(qId, new Date().getTime());
      this._invitations.remove(qId);
      this._servingQueue.push(qId);
    } else if((await this._servingQueue.len() + await this._invitations.len()) < this.capacity) {
      const ts = new Date().getTime();
      log.debug(`invite ${qId} to serving room`); 
      this._invitations.push(qId);
      cb.invite(qId, ts, ts + this.invitationTimeout);
    } else {
      cb.wait(qId);
    }
    this._servingTransaction.end((err) => {
      if(err) {
        log.error(err);
      }
    }); 
  }

  isInvited = (queueId: number) => {
    return this._invitations.has(queueId);
  }

  async servingAt() {
    return await this._ticketProcessor.total();
  }

  async runningAt() {
    return await this._ticketIssuer.total();
  }
}
