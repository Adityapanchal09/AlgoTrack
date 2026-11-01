const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, trim: true, default: 'Unknown' },
    code: { type: String, required: true, maxlength: 6000 },
    explanation: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

snippetSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Snippet', snippetSchema);