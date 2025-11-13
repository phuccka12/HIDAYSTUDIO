
// Quick test script for dashboard functionality
const mongoose = require('mongoose');
require('dotenv').config();

const path = require('path');
const modelsPath = path.join(__dirname, 'src', 'models');
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

// Import models from your codebase
const User = require(path.join(modelsPath, 'User.js'));

async function testDashboard() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    // Update admin user role
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      { role: 'admin' },
      { new: true }
    );

    if (adminUser) {
      console.log('✅ Admin user updated:', adminUser.email, 'Role:', adminUser.role);
    } else {
      console.log('❌ Admin user not found');
    }

    // Database connection test completed successfully

    await mongoose.disconnect();
    console.log('✅ Dashboard test completed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testDashboard();