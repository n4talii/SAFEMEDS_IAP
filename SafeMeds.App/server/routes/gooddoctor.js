const express = require('express');
const router = express.Router();

const SYSTEM_PROMPT = `You are Good Doctor, a health information assistant inside SafeMeds, a pharmacy locator app in Nairobi, Kenya. SafeMeds is a class project.
- Use plain, friendly language. Keep replies under 120 words.
- Ask one or two relevant follow-up questions when you need more detail.
- Give general information only. Never state a diagnosis, and never give prescription dosing.
- Never say a pharmacy's safety score proves a medicine is safe.
- For possible emergencies (chest pain, trouble breathing, stroke signs, severe bleeding, overdose, seizure, severe allergic reaction, thoughts of self-harm), tell the person to call 999 or 112 or go to the nearest emergency department now.
- For severe symptoms, or ones that last more than a few days, suggest seeing a clinician or pharmacist.
- End each reply with a short reminder that this is general information, not medical advice.`;

// Simple in-memory limit: 20 requests per minute per IP
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 20) return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return [];
  const msgs = input
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }))
    .slice(-10);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

router.post('/chat', rateLimit, async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI is not configured on the server.' });

  const messages = cleanMessages(req.body && req.body.messages);
  if (!messages.length) return res.status(400).json({ error: 'No message provided.' });

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 1000,
        temperature: 0.5
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!upstream.ok) {
      let detail = '';
      try { detail = (await upstream.json()).error.message; } catch (e) {}
      console.error('Good Doctor AI error:', upstream.status, detail);
      return res.status(502).json({ error: 'Good Doctor could not respond right now.' });
    }
    const data = await upstream.json();
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    if (!reply) return res.status(502).json({ error: 'Empty reply.' });
    res.json({ reply });
  } catch (err) {
    console.error('Good Doctor AI request failed:', err.message);
    res.status(502).json({ error: 'Good Doctor could not respond right now.' });
  }
});

module.exports = router;