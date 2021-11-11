import redis, { RedisClient } from 'redis';
import Concierge from "../src/concierge";
const host = '192.168.64.8'
const rc: RedisClient = redis.createClient(6379, host);

const log = (level: number, msg: string) => {
  const prefix = "-".repeat(level*2);
  console.log(`|${prefix} ${msg}`);
}


const main = async (redisClient?: RedisClient) => {
  const concierge = new Concierge({
    servingCapacity: 50,
    inivitationTimeout: 10 * 1000,
    redisClient 
  });
  let waitQueue: Map<number, number> = new Map();
  const accept = (queueId: number, currentTimestamp: number) => {
    log(2, `[Accept] ${queueId} | ${currentTimestamp}`);
    setTimeout(async () => {
      log(3, "[Exit] " + queueId)
      concierge.exit(queueId);
    }, Math.random() * 30000);
  }
  const invite = (queueId:number, currentTimestamp: number, expiredAfter: number) => {
    log(2, `[Invite] ${queueId} | ${currentTimestamp} | ${expiredAfter}`);
    setTimeout(() => {
    log(3, `[Accept Invite] ${queueId}`);
      concierge.checkIn(queueId, {
        accept,
        invite,
        wait
      });
    }, Math.random() * 1000)
  }
  const reCheckin = () => {
    debug();
    setTimeout(() => {
      log(3, `[Re-Check in] queue len ${waitQueue.size}` )
      for(const v of waitQueue.keys()) {
        concierge.checkIn(v, {
          accept, invite, wait
        });
      }
      reCheckin();
    }, 5000);
  }
  const wait = (queueId: number) => {
    log(2, `[Wait] qid: ${queueId} length: ${waitQueue.size}`); 
    waitQueue.set(queueId, queueId);
  }

  const debug = () => {
    rc.zcard("queue", (err, reply) => {
      log(7, `serving queue len: ${reply} | wait queue len: ${waitQueue.size}`)
    })
  }

  const add = () => {
    setTimeout( async() => {
      log(1, "[Check In]" )
      if(waitQueue.size > 50) {
        return;
      }
      concierge.checkIn(null, {
        accept,
        invite,
        wait
      });
      log(4, `wait queue length: ${waitQueue.size}`);
      log(4, `Running At: ${await concierge.runningAt()}`);
      log(4, `Serving At: ${await concierge.servingAt()}`);

      add();
    }, Math.random() * 1500)
  }

  add();
  reCheckin();
}
(() => {
  rc.flushdb();
  main(rc);
})()
