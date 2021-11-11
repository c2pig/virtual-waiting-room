import { Commands, Multi, RedisClient } from 'redis';
import { promisify } from 'util';
import { QueryableStore, Store, TransactionalStore, } from './Store';

export class QueryStore implements QueryableStore {

  private _index: (value: string) => Promise<number|null>;
  private _len: () => Promise<number>;
  constructor(redis: Commands<any>, storeName: string) {
    const promiseIndex = promisify<string, string, number|null>(redis.zrank).bind(redis);
    const promiseLen = promisify<string, number, number, number>(redis.zcount).bind(redis);
    this._index = (value: string) => promiseIndex(storeName, value);
    this._len = () => promiseLen(storeName, 0, new Date().getTime());
  }

  async has(value: string)  {
    return  await (this._index(value)) !== null;
  }

  len() {
    return this._len();
  }
}

export default class RedisStore implements Store, TransactionalStore {

  private _set: (pos: number, value: string) => void;
  private _delete: (value: string) => void;
  private _expire: (fromTs: number, toTs: number) => void;
  private  _redis: RedisClient;
  private _storeName: string;
  private _multi: Multi | null = null;
  private hasTranactionBegin = false;

  private command = () => {
    if(this.hasTranactionBegin && this._multi !== null) {
      return this._multi;
    } else {
      return this._redis;
    }
  }

  constructor(redis: RedisClient, storeName: string) {
    this._redis = redis;
    this._storeName = storeName;
    const promiseSet = promisify<string, number, string>(this.command().zadd).bind(redis);
    const promiseDelete = promisify<string, string>(this.command().zrem).bind(redis); 
    const promiseExpire = promisify<string, number, number, number>(this.command().zremrangebyscore).bind(redis); 

    this._set = async (index: number, value: string) => {
      return promiseSet(storeName, index, value);
    };

    this._delete = (value: string) => (promiseDelete(storeName, value));
    this._expire = (fromTs: number, toTs: number) => promiseExpire(storeName, fromTs, toTs);
  }

  begin() {
    this.hasTranactionBegin = true;
    this._redis.watch(this._storeName);
    this._multi = this._redis.multi();
  }

  end(cb?: (value: any) => void) {
    if(this._multi) {
      this._multi.exec((values) => {
        if(cb) {
          cb(values);
        }
      });
      this.hasTranactionBegin = false;
      this._multi = null;
    }
  }
 
  set(value: any) {
    this._set(new Date().getTime(), value);
  }

  delete(value: string) {
    return this._delete(value);
  }

  expire(ttl: number) {
    const now = new Date().getTime();
    this._expire(0, now - ttl);
  }
}
