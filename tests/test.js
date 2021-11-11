const redis = require('redis');
const RedisStore = require('../src/store/RedisStore')
const QueryStore = require('../src/store/RedisStore').QueryStore
const host = '192.168.64.8'
const client = redis.createClient(6379, host);

client.on('connect', function() {
  console.log('Connected!');
});

const test = () => {
  client.set('framework', 'ReactJS'); 
  client.set(['key', 'value']);
  
  client.hmset('frameworks_hash1', 'javascript', 'ReactJS', 'css', 'TailwindCSS', 'node', 'Express');
  client.hgetall('frameworks_hash1', function(err, object) {
    console.log("hgetall");
    console.log(object); // { javascript: 'ReactJS', css: 'TailwindCSS', node: 'Express' }
  });
  
  client.hmset('frameworks_hash2', {
    'javascript': 'ReactJS',
    'css': 'TailwindCSS',
    'node': 'Express'
  });
  
  client.rpush(['frameworks_list', 'ReactJS', 'Angular'], function(err, reply) {
    console.log("rpush");
    console.log(reply); // 2
  });
  
  client.lrange('frameworks_list', 0, -1, function(err, reply) {
    console.log("lrange");
    console.log(reply); // [ 'ReactJS', 'Angular' ]
  });
  
  client.sadd(['frameworks_set', 'ReactJS', 'Angular', 'Svelte', 'VueJS', 'VueJS'], function(err, reply) {
    console.log("sadd");
    console.log(reply); // 4
  });
  
  client.smembers('frameworks_set', function(err, reply) {
    console.log("smembers");
    console.log(reply); 
  });
  
  for(v of Array(50).keys()) {
    client.set(`mykey_${v}`, `${v}`); 
  }
  
  setTimeout(async() => {
    const array = await new Promise((resolve, reject) => {
      const arr = [];
      const loop = (cursor, pattern, limit) => {
        client.scan(cursor, "MATCH", pattern, "COUNT", limit, (err, data) => {
          arr.push(...data[1]);
          if(arr.length < limit) {
            loop(data[0], pattern, limit);
          } else {
            resolve(arr.slice(0, limit));
          }
        });
      }
      loop(0, "mykey_*", 10)
    });
    console.log(array);
  
  }, 1000)
}

const test1 = () => {
  const store = new RedisStore(client);
  const queryStore = new QueryStore(client);
  store.set("1");
  console.log(queryStore.len());
}

test1();