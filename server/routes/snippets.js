const express = require('express');
const Snippet = require('../models/Snippet');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

const SYSTEM_PROMPT = `You are a patient programming tutor. The user sends a code snippet.
Respond with a single JSON object and nothing else, using exactly these keys:
{
  "summary": "one or two sentences on what the code does",
  "lineByLine": [{ "lines": "1-3", "explanation": "plain-English explanation" }],
  "timeComplexity": "for example O(n)",
  "spaceComplexity": "for example O(1)",
  "complexityReason": "short justification for both",
  "improvements": ["optional suggestion"]
}`;

// POST /api/snippets/explain
router.post('/explain', async (req, res) => {
  const { code, language } = req.body;

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ message: 'Code is required' });
  }
  if (code.length > 6000) {
    return res.status(400).json({ message: 'Code is too long (max 6000 characters)' });
  }
try {
    console.log('Calling Groq, model:', process.env.GROQ_MODEL, 'key loaded:', Boolean(process.env.GROQ_API_KEY));
    
    // Add line numbers to the code
    const numbered = code.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: SYSTEM_PROMPT + ' Each line of the code starts with its line number and a colon. Use those numbers in the "lines" field.' 
          },
          {
            role: 'user',
            content: `Language: ${language || 'auto-detect'}\n\nExplain this code in JSON:\n\n${numbered}`,
          },
        ],
        temperature: 0.2,
      }),
    });
    if (response.status === 429) {
      return res.status(429).json({ message: 'AI service is busy, try again in a minute' });
    }
    if (!response.ok) {
      console.error('Groq error:', response.status, await response.text());
      return res.status(502).json({ message: 'AI service error' });
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;
    const explanation = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

    const snippet = await Snippet.create({
      user: req.user._id,
      language: language || 'Unknown',
      code,
      explanation,
    });

    res.status(201).json(snippet);
  } catch (err) {
    console.error('Explain failed:', err.name, err.message);
    if (err.name === 'TimeoutError') {
      return res.status(504).json({ message: 'AI service timed out, please try again' });
    }
    res.status(502).json({ message: 'Could not generate an explanation' });
  }
});

// GET /api/snippets  -> my recent snippets
router.get('/', async (req, res) => {
  try {
    const snippets = await Snippet.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('language code createdAt');
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: 'Could not load history' });
  }
});

// GET /api/snippets/:id  -> one saved snippet with its explanation
router.get('/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.id, user: req.user._id });
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    res.json(snippet);
  } catch (err) {
    res.status(400).json({ message: 'Invalid snippet ID' });
  }
});

module.exports = router;