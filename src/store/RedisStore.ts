import { RedisClient } from 'redis';
import { promisify } from 'util';
import { Indexable, QueryableStore, Store } from './Store';

export class QueryStore implements QueryableStore {

  private _index: (value: string) => Promise<number|null>;
  private _len: () => Promise<number>;

  constructor(redis: RedisClient, storeName: string) {
    const promiseIndex = promisify<string, string, number|null>(redis.zrank).bind(redis);
    const promiseLen= promisify<string, number>(redis.zcard).bind(redis);
    this._index = (value: string) => (promiseIndex(storeName, value));
    this._len = () => promiseLen(storeName);
  }

  async has(value: string)  {
    return  await (this._index(value)) !== null;
  }

  len() {
    return this._len();
  }
}

export default class RedisStore implements Store {

  private _set: (pos: number, value: string) => void;
  private _delete: (value: string) => void;
  private _expire: (fromTs: number, toTs: number) => void;

  constructor(redis: RedisClient, storeName: string) {
    const promiseSet = promisify<string, number, string>(redis.zadd).bind(redis);
    const promiseDelete = promisify<string, string>(redis.zrem).bind(redis); 
    //ZREMRANGEBYSCORE
    const promiseExpire = promisify<string, number, number, number>(redis.zremrangebyscore).bind(redis); 
    // const promiseRange = promisify<string, number, number, string[]>(redis.lrange).bind(redis);
    // const promiseFind = promisify<string, number>(redis.lindex).bind(redis);
    this._set = (index: number, value: string) => (promiseSet(storeName, index, value));
    this._delete = (value: string) => (promiseDelete(storeName, value));
    this._expire = (fromTs: number, toTs: number) => promiseExpire(storeName, fromTs, toTs);
    // this._index = (value: string) => (promiseIndex(keyName, value));
    // this._range = (start: number, end: number) => (promiseRange(keyName, start, end));
    // this._query = () => {
    //   return {
    //     has: async (index: Indexable) => {
    //       return (await promiseFind(keyName, index.key) !== null)
    //     },
    //     len: async() => {
    //       return await promiseLen(keyName);
    //     }
    //   }
    // }
  }
  // async getByIndex(key: Indexable) {
  //   return this.get(key.key.toString())
  // }

  // async get(value: string) {
  //   return this._index(value);
  //   // TODO: migrate to new class
  //   // return await new Promise<string|null>((resolve, reject) => {
  //   //   this._redis.get(`${this._prefix}${key.key}` as string, (err, reply) => {
  //   //     resolve(reply);
  //   //   });
  //   // });
  // }

  // async getSome(start?: number, end?: number) {
  //   return this._range(start = 0, end = 100);
  //   // TODO: migrate to new class
  //   // return await new Promise<string[]>((resolve, reject) => {
  //   //   const arr: string[] = [];
  //   //   const loop = (cursor: string, pattern: string, limit: number) => {
  //   //     this._redis.scan(cursor, "MATCH", pattern, "COUNT", limit.toString(), (err, data) => {
  //   //       arr.push(...data[1]);
  //   //       if(arr.length < limit) {
  //   //         loop(data[0], pattern, limit);
  //   //       } else {
  //   //         resolve(arr.slice(offset ?? 0, limit));
  //   //       }
  //   //     });
  //   //   }
  //   //   loop("0", `${this._prefix}*`, limit ?? 10);
  //   // });
  // } 

  set(value: any) {
    this._set(new Date().getTime(), value);
    // TODO: migrate to new class
    // this._redis.set(`${this._prefix}${key.key}` as string, JSON.stringify(value));
  }

  delete(value: string) {
    return this._delete(value);
    // return this._redis.del(`${this._prefix}${key.key}`);
  }

  expire(ttl: number) {

    const now = new Date().getTime();
    this._expire(0, now - ttl);

  }
}
