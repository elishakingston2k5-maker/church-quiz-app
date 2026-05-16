const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for Vercel deployment flexibility
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quizzes');
const submissionRoutes = require('./routes/submissions');

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/submissions', submissionRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Start the server (for Render or local development)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
