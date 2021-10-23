import express from 'express';
import { Request, Response } from 'express';

export const app = express();
const port: number = 80

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Waiting Room listening at http://localhost:${port}`)
})
