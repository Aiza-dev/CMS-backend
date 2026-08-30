const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    const adminEmail = 'admin@support.com';
    const adminPassword = 'adminpassword123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      // Direct Admin Role Update
      existingAdmin.role = 'admin';
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(adminPassword, salt);
      await existingAdmin.save();
      console.log('-----------------------------------');
      console.log('SUCCESS: Existing user updated to ADMIN!');
    } else {
      // Create New Admin Account
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('-----------------------------------');
      console.log('SUCCESS: New ADMIN account created!');
    }

    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();