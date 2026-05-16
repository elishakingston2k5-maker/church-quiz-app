const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const existingAdmin = await Admin.findOne({ username: 'admin' });

    if (existingAdmin) {
      await Admin.deleteOne({ username: 'admin' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new Admin({
      username: 'admin',
      password: hashedPassword
    });

    await admin.save();

    console.log('Admin reset successfully');
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
