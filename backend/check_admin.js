const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const admin = await Admin.findOne({ username: 'admin' });
    console.log("Admin exists:", !!admin);
    if (admin) {
      console.log("Password hash:", admin.password);
      const isMatch = await bcrypt.compare('password123', admin.password);
      console.log("Password123 matches hash:", isMatch);
    }
    process.exit(0);
  });
