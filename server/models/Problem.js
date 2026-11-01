const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ['LeetCode', 'NeetCode', 'GeeksforGeeks', 'HackerRank', 'Codeforces', 'Other'],
      default: 'LeetCode',
    },
    url: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    patterns: {
      type: [String],
      enum: [
        'Arrays & Hashing',
        'Two Pointers',
        'Sliding Window',
        'Stack',
        'Binary Search',
        'Linked List',
        'Trees',
        'Tries',
        'Heap / Priority Queue',
        'Backtracking',
        'Graphs',
        'Dynamic Programming',
        'Greedy',
        'Intervals',
        'Math & Geometry',
        'Bit Manipulation',
      ],
    },
    status: {
      type: String,
      enum: ['Solved', 'Attempted', 'Revisit'],
      default: 'Solved',
    },
    notes: {
      type: String,
      trim: true,
    },
    dateSolved: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

problemSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Problem', problemSchema);