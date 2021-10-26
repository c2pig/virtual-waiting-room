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

### Task:
* Distributed Session Store
* Session Exit
