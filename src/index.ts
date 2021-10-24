import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { loadConfig } from './configuration';
import { getStockAvailability } from './fake/stocks';

export const app = express();
const config = loadConfig();

const port: number = 80;
const upstreamMap = config.upstreamMap();

app.get('/v1/stocks', getStockAvailability);

upstreamMap.forEach(({from, to}) => {
  console.log(`[Proxy] ${from} -> ${to}`);
  app.use(from, createProxyMiddleware({ 
    logLevel: 'debug',
    changeOrigin: true,
    target: to,
  }));
}) 


// app.get('/', (req: Request, res: Response) => {

// ballot = ticket no, curr running num, hash key, timestamp
// session = ballot hash key,   

  // does session cookie exist?
  //   - yes
  //     proxy_pass
  //   - no
      // does ballot cookie exist?
      //   - yes
      //     - is ballot valid?
      //       - yes
      //         is ballot eligible visit?
      //         - yes
      //           create session (ballot) - redis + cookie
      //           decrease waiting count
      //           proxy_pass
      //         - no
      //           redirect to waiting room
      //       - no 
      //         issue new ballot
      //         increase waiting count
      //         redirect to waiting room
      //   - no
      //         issue new ballot
      //         increase waiting count
      //         redirect to waiting room

//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Waiting Room listening at http://localhost:${port}`)
})
