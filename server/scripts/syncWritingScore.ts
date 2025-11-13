import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/ielts-dev';

async function syncWritingScore() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const currentUserId = '68f05c5a75170c26160f9ff2';

    // Get the writing submission
    const submissions = await mongoose.connection.db?.collection('submissions').find({ 
      user_id: new mongoose.Types.ObjectId(currentUserId) 
    }).toArray();

    if (!submissions || submissions.length === 0) {
      console.log('❌ No submissions found');
      process.exit(1);
    }

    console.log(`📝 Found ${submissions.length} writing submission(s)`);
    
    const latestSubmission = submissions[0];
    const score = latestSubmission.ai_score;
    
    console.log(`📊 Latest submission score: ${score}`);

    // Create UserProgress for writing skill
    const UserProgress = mongoose.model('UserProgress', new mongoose.Schema({}, { strict: false, collection: 'userprogresses' }));
    
    const progressData = {
      user_id: new mongoose.Types.ObjectId(currentUserId),
      skill_type: 'writing',
      current_level: score,
      target_score: 7.0, // Default target
      completed_exercises: 1, // 1 writing submission
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await UserProgress.create(progressData);
    console.log(`✅ Created UserProgress for writing with score: ${score}`);
    console.log(`   Progress ID: ${result._id}`);

    console.log('\n🎉 Writing score synced to dashboard!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing writing score:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

syncWritingScore();
