const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ username });
    console.log("ADMIN FOUND:", admin);
    console.log("ENTERED PASSWORD:", password);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify site access password
router.post('/site-access', (req, res) => {
  const password = req.body.password?.trim();
  const sitePassword = process.env.SITE_PASSWORD?.trim();
  
  if (!sitePassword) {
    // If no password is set in .env, just allow access
    return res.json({ success: true, token: 'site-unlocked' });
  }

  if (password === sitePassword) {
    res.json({ success: true, token: 'site-unlocked' });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
  }
});

module.exports = router;
