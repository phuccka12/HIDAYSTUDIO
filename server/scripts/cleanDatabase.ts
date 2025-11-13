import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ielts_academy';

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Dropping entire database...');
    const db = mongoose.connection.db;
    if (db) {
      await db.dropDatabase();
      console.log('✅ Database dropped successfully');
    }

    console.log('📊 Collections after cleanup:');
    const collections = await mongoose.connection.db?.listCollections().toArray();
    if (collections && collections.length === 0) {
      console.log('✅ Database is now empty - all collections removed');
    } else {
      console.log('Collections remaining:', collections?.map(c => c.name));
    }

    console.log('🎉 Database cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

cleanDatabase();
