import mongoose from 'mongoose';
import User from '../src/models/User';

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

async function getUser() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const user = await User.findOne({}).lean();
    if (user) {
      console.log('Found user:', { id: user._id, email: user.email });
    } else {
      console.log('No users found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

getUser();