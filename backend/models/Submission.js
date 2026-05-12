const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  participantName: { type: String, required: true },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed // Question ID -> Answer
  },
  autoScore: { type: Number, default: 0 },
  manualScore: { type: Number, default: 0 },
  isFullyGraded: { type: Boolean, default: false }, // true when admin grades theory questions
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);
