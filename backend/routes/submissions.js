const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

// Public route: Submit a quiz
router.post('/', async (req, res) => {
  try {
    const { quizId, participantName, answers } = req.body;
    
    // Check if participant already submitted this quiz
    const existing = await Submission.findOne({ quizId, participantName });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted this quiz.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ error: 'Quiz not found or not published.' });
    }

    let autoScore = 0;
    let needsManualGrading = false;

    // Calculate autoScore
    quiz.questions.forEach(q => {
      const participantAnswer = answers[q.id];
      if (!participantAnswer) return;

      if (['MCQ', 'CHECKBOX', 'FILL_BLANKS', 'MATCHING'].includes(q.type)) {
        // Compare answers depending on type
        // This is a basic comparison. Deep equal needed for arrays/objects
        if (JSON.stringify(participantAnswer) === JSON.stringify(q.correctAnswer)) {
          autoScore += q.points;
        }
      } else {
        needsManualGrading = true;
      }
    });

    const submission = new Submission({
      quizId,
      participantName,
      answers,
      autoScore,
      isFullyGraded: !needsManualGrading
    });

    await submission.save();
    res.status(201).json({ message: 'Quiz submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes below
router.use(auth);

// Get all submissions for a quiz
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const submissions = await Submission.find({ quizId: req.params.quizId });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single submission
router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('quizId');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update manual score for a submission
router.put('/:id/score', async (req, res) => {
  try {
    const { manualScore, isFullyGraded } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id, 
      { manualScore, isFullyGraded },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
