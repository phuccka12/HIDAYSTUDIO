import { Router } from 'express';
import { callLLMForText } from '../services/llm';

const router = Router();

/**
 * POST /llm
 * Body: { prompt: string }
 * Trả về: { text, raw } - raw là response đầy đủ từ OpenAI
 * (Route này là proxy nội bộ, nhớ bảo vệ / rate-limit nếu public)
 */
router.post('/', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing required field: prompt (string)' });
  }

  try {
    const { text, raw } = await callLLMForText(prompt);
    return res.json({ text, raw });
  } catch (err: any) {
    console.error('LLM proxy error:', err?.message ?? err);
    return res.status(500).json({ error: String(err?.message ?? err) });
  }
});

export default router;