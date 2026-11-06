import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const topPlayers = await redis.zrange('resell:leaderboard', 0, 9, { rev: true, withScores: true });
      const formatted = [];
      for (let i = 0; i < topPlayers.length; i += 2) {
        formatted.push({ name: topPlayers[i], money: topPlayers[i + 1] });
      }
      return res.status(200).json({ leaderboard: formatted });
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, money } = req.body;
      if (!name || typeof money !== 'number') return res.status(400).json({ error: 'Неверные данные' });
      
      await redis.zadd('resell:leaderboard', { score: money, member: name });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка сохранения' });
    }
  }

  return res.status(405).json({ error: 'Метод не разрешён' });
}
