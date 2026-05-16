const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('Connected to MongoDB');

  await Admin.deleteMany({});

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = new Admin({
    username: 'admin',
    password: hashedPassword
  });

  await admin.save();

  console.log('New admin created');

  process.exit();
})
.catch(err => {
  console.log('MongoDB error:', err);
});
