import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import songRoutes from './routes/songs';
import { WebSocketServer } from 'ws';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app); // servidor compartilhado

// Configura WebSocket na mesma porta
const wss = new WebSocketServer({ server });

// Configuração CORS: permita só seu frontend
app.use(cors({
  origin: 'https://ja-moveo-client-eta.vercel.app', // Substitua pela URL real do seu frontend no Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.send('🚀 API online');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});

// Exporta função para enviar atualizações via WebSocket
export function broadcastSong(song: Record<string, any>) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'update', song }));
    }
  });
}
