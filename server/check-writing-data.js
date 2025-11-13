// Check Writing prompts and data in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

async function checkWritingData() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('🔍 Checking Writing data in MongoDB...\n');
    
    // Register User schema first
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      passwordHash: String,
      full_name: String,
      role: { type: String, default: 'user' },
      created_at: { type: Date, default: Date.now }
    }));
    
    // Check Prompts collection
    const Prompt = mongoose.model('Prompt', new mongoose.Schema({
      type: String,
      task: String,
      prompt: String,
      difficulty: String,
      created_at: { type: Date, default: Date.now }
    }));
    
    const promptCount = await Prompt.countDocuments();
    console.log(`📝 Prompts collection: ${promptCount} documents`);
    
    if (promptCount > 0) {
      const samplePrompts = await Prompt.find().limit(3);
      console.log('\n📋 Sample prompts:');
      samplePrompts.forEach((p, i) => {
        console.log(`${i + 1}. Type: ${p.type || 'N/A'}, Task: ${p.task || 'N/A'}`);
        console.log(`   Prompt: ${(p.prompt || '').substring(0, 80)}...`);
        console.log(`   Difficulty: ${p.difficulty || 'N/A'}\n`);
      });
    }
    
    // Check Submissions collection
    const Submission = mongoose.model('Submission', new mongoose.Schema({
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      task_type: String,
      prompt: String,
      content: String,
      ai_score: Number,
      created_at: { type: Date, default: Date.now }
    }));
    
    const submissionCount = await Submission.countDocuments();
    console.log(`✍️ Submissions collection: ${submissionCount} documents`);
    
    if (submissionCount > 0) {
      const sampleSubmissions = await Submission.find().limit(2).populate('user_id');
      console.log('\n📄 Sample submissions:');
      sampleSubmissions.forEach((s, i) => {
        console.log(`${i + 1}. User: ${s.user_id?.email || 'N/A'}, Task: ${s.task_type || 'N/A'}`);
        console.log(`   Score: ${s.ai_score || 'N/A'}, Date: ${s.created_at}`);
        console.log(`   Content: ${(s.content || '').substring(0, 60)}...\n`);
      });
    }
    
    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 All collections in database:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   ${col.name}: ${count} documents`);
    }
    
    mongoose.disconnect();
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

checkWritingData();