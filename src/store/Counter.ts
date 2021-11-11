import redis, { RedisClient } from 'redis';
import { promisify } from 'util';

export interface ICounterOperation {
  incr: () => number | Promise<number | null>;
  decr: () => number | Promise<number | null>;
  count: () => number | Promise<number | null>; 
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

export const MemoryCounter = (): ICounterOperation => {
  let counter = 0;
  return {
    incr: () => ++counter,
    decr: () => --counter,
    count: () =>counter 
  }
}

export const RedisCounter = (keyName: string, redis: RedisClient): ICounterOperation => {
  const promiseGet = promisify<string, string|null>(redis.get).bind(redis);
  const promiseIncr = promisify<string, number|null>(redis.incr).bind(redis);
  const promiseDecr = promisify<string, number|null>(redis.decr).bind(redis);

  const incr = async () => {
    return await promiseIncr(keyName);
  }

  const decr = async () => {
    return await promiseDecr(keyName);
  }

  const count = async () => {
    const getCount = await promiseGet(keyName);

    if(!getCount) {
      return null;
    }

    return parseInt(getCount);
  }

  return {
    incr,
    decr,
    count
  }
}

export const Counter = (counterImpl: ICounterOperation):ICounterOperation => new CounterWrapper(counterImpl)


