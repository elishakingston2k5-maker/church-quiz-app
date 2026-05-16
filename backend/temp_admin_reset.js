const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect(
  "mongodb+srv://elishakingston2k5:kingston2005_29@elishakingston.obhvx.mongodb.net/test?retryWrites=true&w=majority"
);

async function resetAdmin() {
  try {
    await Admin.deleteMany({ username: "admin" });

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      username: "admin",
      password: hashedPassword,
    });

    console.log("NEW ADMIN CREATED");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

resetAdmin();
