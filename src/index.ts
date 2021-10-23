import express, { Request, Response } from 'express';

const app = express();

const heroes = [
  { id: 1, name: 'Iron Man' },
  { id: 2, name: 'Thor' },
  { id: 3, name: 'Black Widow' },
  { id: 4, name: 'Hulk' },
]

app.get('/', async (req: Request, res: Response) => {
  return { works: true }
})

app.get('/heroes', async (req: Request, res: Response) => {
  return heroes
})

app.get('/heroes/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  return heroes.find((h) => h.id === Number(id))
})

const port = 80;
app.listen(port, () => {
  console.log(`[Waiting Room Proxy] listening at http://localhost:${port}`)
});

exports.app = app;
