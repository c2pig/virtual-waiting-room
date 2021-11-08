import { QueryableStore, Store } from "./Store";

const queue: Map<string, number> = new Map();

export class QueryStore implements QueryableStore {
  has(value: string)  {
    return queue.get(value) !== undefined;
  }
  len() {
    return queue.entries.length;
  }
}

export class MemoryStore implements Store {


  set(value: Object) {
    queue.set(JSON.stringify(value), new Date().getTime());
  }

  delete(value: string) {
    queue.delete(value);
  }

  expire(ttl: number) {
    const now = new Date().getTime();
    for(const i in queue) {
      const ts = queue.get(i) ?? 0;
      if(ts < (now - ttl)) {
        queue.delete(i);
      }
    }
  }
}
