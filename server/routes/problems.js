const express = require('express');
const Problem = require('../models/Problem');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/problems  -> add a problem
router.post('/', async (req, res) => {
  try {
    const { title, platform, url, difficulty, patterns, status, notes, dateSolved } = req.body;

    const problem = await Problem.create({
      user: req.user._id,
      title,
      platform,
      url,
      difficulty,
      patterns,
      status,
      notes,
      dateSolved,
    });

    res.status(201).json(problem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/problems  -> list my problems (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { difficulty, status, pattern, search } = req.query;

    const filter = { user: req.user._id };
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (pattern) filter.patterns = pattern;
    if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

    const problems = await Problem.find(filter).sort({ dateSolved: -1 });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/problems/:id  -> one problem
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, user: req.user._id });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (err) {
    res.status(400).json({ message: 'Invalid problem ID' });
  }
});

// PATCH /api/problems/:id  -> edit a problem
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'platform', 'url', 'difficulty', 'patterns', 'status', 'notes', 'dateSolved'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/problems/:id  -> remove a problem
router.delete('/:id', async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ message: 'Problem deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid problem ID' });
  }
});

module.exports = router;