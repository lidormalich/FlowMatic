const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || require('../config/keys').mongoURI);
    console.log('MongoDB connected...');

    const existingAdmin = await User.findOne({ email: 'admin@flowmatic.com' });

    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      name: 'Admin',
      email: 'admin@flowmatic.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      businessName: 'FlowMatic Admin',
      phoneNumber: '050-0000000',
      credits: 1000,
      isActive: true,
      isSuspended: false
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@flowmatic.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('💰 Credits: 1000');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

createAdminUser();
