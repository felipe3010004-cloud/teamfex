import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateGroundedChatResponse } from './server/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API Endpoint for Gemini AI chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body || {};
    const result = await generateGroundedChatResponse(prompt || '', history);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/chat endpoint:', err);
    res.status(500).json({ 
      reply: 'Ocurrió un error al procesar tu consulta con la inteligencia artificial. Por favor intenta de nuevo.' 
    });
  }
});

// Serve static frontend assets in production
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Team Life Server running on http://0.0.0.0:${PORT}`);
});
