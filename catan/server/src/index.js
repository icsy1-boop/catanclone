import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerHandlers } from './socketHandlers.js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, '../../client/dist');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.get('/health', (_, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  registerHandlers(io, socket);
});

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Catan server running on port ${PORT}`);
});
