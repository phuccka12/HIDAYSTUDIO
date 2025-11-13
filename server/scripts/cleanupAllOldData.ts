import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/ielts-dev';

async function cleanupAllOldData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const currentUserId = '68f05c5a75170c26160f9ff2'; // Your user ID
    const oldUserId = '6912efd3072c4893be94eb08'; // Old user ID

    // Delete old user's progress
    const UserProgress = mongoose.model('UserProgress', new mongoose.Schema({}, { strict: false, collection: 'userprogresses' }));
    console.log(`🗑️  Deleting UserProgress for old user: ${oldUserId}`);
    const progressResult = await UserProgress.deleteMany({ user_id: new mongoose.Types.ObjectId(oldUserId) });
    console.log(`✅ Deleted ${progressResult.deletedCount} UserProgress records`);

    // Delete old user's attempts
    const Attempt = mongoose.model('Attempt', new mongoose.Schema({}, { strict: false, collection: 'attempts' }));
    console.log(`🗑️  Deleting Attempts for old user: ${oldUserId}`);
    const attemptResult = await Attempt.deleteMany({ userId: new mongoose.Types.ObjectId(oldUserId) });
    console.log(`✅ Deleted ${attemptResult.deletedCount} Attempts`);

    // Delete your old UserProgress (the one with 27 completed exercises)
    console.log(`🗑️  Deleting your old UserProgress to start fresh...`);
    const yourProgressResult = await UserProgress.deleteMany({ user_id: new mongoose.Types.ObjectId(currentUserId) });
    console.log(`✅ Deleted ${yourProgressResult.deletedCount} UserProgress records for current user`);

    // Show what remains
    console.log('\n📊 Summary of remaining data:');
    const remainingSubmissions = await mongoose.connection.db?.collection('submissions').countDocuments({ user_id: new mongoose.Types.ObjectId(currentUserId) });
    const remainingProgress = await UserProgress.countDocuments({ user_id: new mongoose.Types.ObjectId(currentUserId) });
    const remainingAttempts = await Attempt.countDocuments({ userId: new mongoose.Types.ObjectId(currentUserId) });
    
    console.log(`   Submissions (your): ${remainingSubmissions}`);
    console.log(`   UserProgress (your): ${remainingProgress}`);
    console.log(`   Attempts (your): ${remainingAttempts}`);

    console.log('\n🎉 Cleanup complete! Only your Writing submission remains.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupAllOldData();
