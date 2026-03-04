require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to DB");

    const existing = await User.findOne({ email: "admin@civicpulse.com" });

    if (existing) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new User({
      name: "Admin",
      email: "admin@civicpulse.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("Admin created successfully!");
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
