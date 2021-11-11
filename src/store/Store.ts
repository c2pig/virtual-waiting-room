export interface Indexable {
  key: number;
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

export interface TransactionalStore {
  begin: () => void;
  end: (cb?: (value: any) => void) => void;
}