import redis, { RedisClient } from 'redis';

export interface Indexable {
  key: number;
}

export interface ICounterOperation {
  incr: () => number | Promise<number>;
  decr: () => number | Promise<number>;
  count: () => number | Promise<number>;
}

export abstract class Store {
  abstract set: (value: string) => void;
  abstract delete: (value: string) => void;
  abstract expire: (ttl: number) => void;
}

export abstract class QueryableStore {
  abstract has: (value: string) => Boolean | Promise<Boolean>;
  abstract len: () => number | Promise<number>;
}

export class CounterWrapper implements ICounterOperation {
  
  protected counter: ICounterOperation;

  constructor(counter: ICounterOperation) {
    this.counter = counter;
  }

  incr() {
    return this.counter.incr(); 
  }
  decr() {
    return this.counter.decr(); 
  }
  count() {
    return this.counter.count(); 
  }
}

const MemoryCounter = (): ICounterOperation => {
  let counter = 0;
  return {
    incr: () => ++counter,
    decr: () => --counter,
    count: () =>counter 
  }
}

export const Counter = ():ICounterOperation => (new CounterWrapper(MemoryCounter()))
