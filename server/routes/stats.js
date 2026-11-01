const express = require('express');
const Problem = require('../models/Problem');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

const TIMEZONE = 'Asia/Kolkata';

const toObject = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const [byDifficulty, byStatus, byPattern, solvedDays] = await Promise.all([
      Problem.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),

      Problem.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Problem.aggregate([
        { $match: { user: userId } },
        { $unwind: '$patterns' },
        {
          $group: {
            _id: '$patterns',
            total: { $sum: 1 },
            solved: { $sum: { $cond: [{ $eq: ['$status', 'Solved'] }, 1, 0] } },
            revisit: { $sum: { $cond: [{ $eq: ['$status', 'Revisit'] }, 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
      ]),

      Problem.aggregate([
        { $match: { user: userId, status: 'Solved' } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$dateSolved', timezone: TIMEZONE },
            },
          },
        },
      ]),
    ]);

    const days = new Set(solvedDays.map((d) => d._id));
    const formatDay = (date) => date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

    let streak = 0;
    const cursor = new Date();
    if (!days.has(formatDay(cursor))) {
      cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000);
    }
    while (days.has(formatDay(cursor))) {
      streak++;
      cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000);
    }

    const statusCounts = toObject(byStatus);
    const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

    res.json({
      total,
      byDifficulty: toObject(byDifficulty),
      byStatus: statusCounts,
      byPattern: byPattern.map((p) => ({
        pattern: p._id,
        total: p.total,
        solved: p.solved,
        revisit: p.revisit,
      })),
      streak,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;