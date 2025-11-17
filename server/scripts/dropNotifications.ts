import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

async function dropNotificationsCollection() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check if notifications collection exists
    const collections = await db.listCollections({ name: 'notifications' }).toArray();
    
    if (collections.length > 0) {
      await db.dropCollection('notifications');
      console.log('✅ Dropped notifications collection');
    } else {
      console.log('ℹ️  Notifications collection does not exist');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropNotificationsCollection();
