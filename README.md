# virtual-waiting-room


### HOW TO DEBUG
turn on debug logging to monitor following modules output
* session - session middleware
* main - main application
* queue - waiting room queue

To turn on level for module logging 
```
NODE_DEBUG=app.<session|main|queue>.<debug|info|error>

Example: NODE_DEBUG=app.session.info
Example: NODE_DEBUG="app.main.*,app.session.*"
```

Turn on all level/module logging
```
NODE_DEBUG=app.*
```

### How to test memory based virtual room 
##### Mock microsite domain
* vi /etc/hosts
* add:  `iphone.celcom.com.my   127.0.0.1` 

##### Start backend
* yarn 
* yarn start

##### Start frontend
* yarn
* yarn start

##### Waiting room page
* browse http://iphone.celcom.com.my/

##### Queue in waiting room page
* ./tests/pre-queue 7
* browse http://iphone.celcom.com.my/

### How to test Redis based virtual room (WIP for end-to-end testing)
* Create Redis instance in VirtualBox (multipass)
  * ./setups/init-redis.sh
* Run test suite
  * ts-node tests/test.ts
* Download RedisInsight to monitor queue status



### Task:
* Session Exit
