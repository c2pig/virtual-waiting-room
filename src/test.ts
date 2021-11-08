import RedisStore, { QueryStore } from "./store/RedisStore";
import redis, { RedisClient } from 'redis';
import Concierge from "./concierge";
const host = '192.168.64.8'
const redisClient: RedisClient = redis.createClient(6379, host);
const store = new RedisStore(redisClient, "queue1");
const queryStore = new QueryStore(redisClient, "queue1");

const test1 = async () => {


  const purge = () => {
    setTimeout( async() => {
      
      store.expire(15 * 1000);
      const len = await queryStore.len();
      console.log("purge data: " + len);
      purge();
    }, 5000)
  }

  const add = () => {
    setTimeout( async() => {
      store.set(new Date().getTime().toString());
      const len = await queryStore.len();
      console.log("add data: " + len);
      add();
    }, 2000)
  }

  add();
  purge();
}

const test2 = async () => {
  let queue = 0;
  const concierge = new Concierge({
    servingCapacity: 5,
    inivitationTimeout: 10 * 1500,
    redisClient
  });
  const waitQueue: number[] = [];
  const accept = (queueId: number, currentTimestamp: number) => {
    console.log(`<< [Accept] ${queueId} | ${currentTimestamp}`);
    setTimeout(async () => {
      console.log(">>>> Exit " + queueId)
      concierge.exit(queueId);
    }, 8000);

  }
  const invite = (queueId:number, currentTimestamp: number, expiredAfter: number) => {
    console.log(`<<<< [Invite] ${queueId} | ${currentTimestamp} | ${expiredAfter}`);
    setTimeout(() => {

    console.log(`<<<< [Accept Invite] ${queueId}`);
      concierge.checkIn(queueId, {
        accept,
        invite,
        wait
      });
    }, 1000)
  }
  const wait = (queueId: number) => {
    console.log(`|| [Wait] ${queueId} len of queue: ${waitQueue.length}`);
    waitQueue.push(queueId);
    setTimeout(() => {
      for(const v of waitQueue) {
        console.log("** Re-Check in: " + v)
        concierge.checkIn(v, {
          accept, invite, wait
        });
      }

    }, 3000);
  }

  const add = () => {
    setTimeout( async() => {
      const q = ++ queue;
      console.log("** Check in: " + q)
      concierge.checkIn(q, {
        accept,
        invite,
        wait
      });
      console.log(`Running At: ${await concierge.runningAt()}`);
      console.log(`Serving At: ${await concierge.servingAt()}`);

      add();
    }, 8000)
  }

  add();

}

test2();
