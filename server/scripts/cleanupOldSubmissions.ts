import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/ielts-dev';

async function cleanupOldUserSubmissions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const Submission = mongoose.model('Submission', new mongoose.Schema({}, { strict: false, collection: 'submissions' }));

    // Delete submissions from old user
    const oldUserId = '6912efd3072c4893be94eb08';
    
    console.log(`🗑️  Deleting submissions for old user: ${oldUserId}`);
    const result = await Submission.deleteMany({ user_id: new mongoose.Types.ObjectId(oldUserId) });
    
    console.log(`✅ Deleted ${result.deletedCount} submissions`);

    // Show remaining submissions
    const remaining = await Submission.countDocuments();
    console.log(`📊 Remaining submissions in database: ${remaining}`);

    console.log('🎉 Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupOldUserSubmissions();
