import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import songRoutes from './routes/songs';
import http from 'http';
import { Server, Socket } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);


app.use(cors({
  origin: ['https://ja-moveo-client-eta.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.send('🚀 API online');
});

const io = new Server(server, {
  cors: {
    origin: ['https://ja-moveo-client-eta.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket: Socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

export function broadcastSong(song: Record<string, any>) {
  io.emit('song-selected', song);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is listening on ${PORT}`);
});
