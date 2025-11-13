import mongoose from 'mongoose';
import User from '../src/models/User';
import UserProgress from '../src/models/UserProgress';

const seedUserProgress = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    const skills = ['listening', 'reading', 'writing', 'speaking'] as const;

    for (const user of users) {
      console.log(`Creating progress for user: ${user.email}`);
      
      for (const skill of skills) {
        const existingProgress = await UserProgress.findOne({
          user_id: user._id,
          skill_type: skill
        });

        if (!existingProgress) {
          // Generate some realistic progress data
          const targetScore = 6.5 + Math.random() * 2; // Target between 6.5-8.5
          const currentLevel = Math.max(0, targetScore - 1.5 + Math.random() * 1.2); // Current level slightly below target
          const completedExercises = Math.floor(Math.random() * 50) + 5; // 5-55 exercises

          await UserProgress.create({
            user_id: user._id,
            skill_type: skill,
            current_level: Math.round(currentLevel * 10) / 10, // Round to 1 decimal
            target_score: Math.round(targetScore * 10) / 10, // Round to 1 decimal
            completed_exercises: completedExercises
          });

          console.log(`  ✅ Created ${skill} progress: current=${currentLevel.toFixed(1)}, target=${targetScore.toFixed(1)}, exercises=${completedExercises}`);
        } else {
          console.log(`  ℹ️ ${skill} progress already exists`);
        }
      }
    }

    console.log('✅ User progress seeding completed');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding user progress:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedUserProgress();
}

export default seedUserProgress;