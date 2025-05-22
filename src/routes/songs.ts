import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { broadcastSong } from '../index';
import fetch from 'node-fetch';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/songs/current
router.post('/current', async (req: Request, res: Response): Promise<any> => {
  const song = req.body;

  if (!song || !song.trackId) {
    return res.status(400).json({ message: 'Invalid song data' });
  }

  // 👉 Verifica se já existe a música
  const existing = await prisma.song.findFirst({
    where: { trackId: song.trackId },
    orderBy: { timestamp: 'desc' },
  });

  if (existing) {
    broadcastSong(existing);
    return res.status(200).json(existing);
  }

  const lyrics = await fetchLyrics(song.artistName, song.trackName);

  const saved = await prisma.song.create({
    data: {
      trackId: song.trackId,
      trackName: song.trackName,
      artistName: song.artistName,
      artworkUrl100: song.artworkUrl100,
      previewUrl: song.previewUrl,
      lyrics,
      chords: null,
    },
  });

  const full = await prisma.song.findUnique({ where: { id: saved.id } });

  broadcastSong(full!);
  return res.status(200).json(saved);
});


// GET /api/songs/current
router.get('/current', async (_req: Request, res: Response): Promise<any> => {
  const last = await prisma.song.findFirst({
    orderBy: { timestamp: 'desc' },
  });

  if (!last) return res.status(404).json({ message: 'No song selected' });
  return res.json(last);
});

// GET /api/songs/history
router.get('/history', async (_req, res) => {
  const songs = await prisma.song.findMany({
    orderBy: { timestamp: 'desc' },
  });

  res.json(songs);
});

// DELETE /api/songs/history
router.delete('/history', async (_req, res) => {
  await prisma.song.deleteMany();
  res.status(200).json({ message: 'History cleared' });
});

// API Lyrics.ovh
async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    const data = await res.json() as { lyrics?: string };
    return data.lyrics || null;
  } catch (err) {
    console.error('Lyrics fetch error:', err);
    return null;
  }
}

// PATCH /api/songs/:id/chords
router.patch('/:id/chords', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { chords } = req.body;

  if (!chords) {
    return res.status(400).json({ message: 'Missing chords in request body' });
  }

  try {
    const updated = await prisma.song.update({
      where: { id: Number(id) },
      data: { chords: JSON.stringify(chords) },
    });

    // ✅ Dispara o broadcast com a nova versão da música
    broadcastSong(updated);

    return res.status(200).json({ message: 'Chords updated', song: updated });
  } catch (err) {
    console.error('Error updating chords:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/songs/:id
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const song = await prisma.song.findUnique({
      where: { id: Number(id) },
    });

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.status(200).json(song);
  } catch (error) {
    console.error('Erro ao buscar música por ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




export default router;
