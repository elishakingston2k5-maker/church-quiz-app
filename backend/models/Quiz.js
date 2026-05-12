const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['MCQ', 'CHECKBOX', 'MATCHING', 'SHORT_ANSWER', 'PARAGRAPH', 'FILL_BLANKS'],
    required: true
  },
  text: { type: String, required: true },
  options: [String], // For MCQ, CHECKBOX, MATCHING (left side)
  matchingRight: [String], // For MATCHING
  correctAnswer: mongoose.Schema.Types.Mixed, // String, Array of Strings, or Object
  points: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  timerMinutes: { type: Number, default: 0 }, // 0 means no timer
  isPublished: { type: Boolean, default: false },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
