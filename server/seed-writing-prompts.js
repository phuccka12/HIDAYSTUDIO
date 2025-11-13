// Seed Writing prompts data
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

async function seedWritingPrompts() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('🌱 Seeding Writing prompts...\n');
    
    const Prompt = mongoose.model('Prompt', new mongoose.Schema({
      type: String,
      task: String,
      prompt: String,
      difficulty: String,
      topic: String,
      sample_response: String,
      created_at: { type: Date, default: Date.now }
    }));
    
    // Clear existing prompts
    await Prompt.deleteMany({});
    
    const writingPrompts = [
      // Task 1 prompts
      {
        type: 'writing',
        task: 'task1',
        difficulty: 'intermediate',
        topic: 'Process Description',
        prompt: 'The diagram below shows the process of recycling plastic bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        sample_response: 'The diagram illustrates the step-by-step process of recycling plastic bottles...'
      },
      {
        type: 'writing',
        task: 'task1', 
        difficulty: 'intermediate',
        topic: 'Bar Chart',
        prompt: 'The chart below shows the number of households in the US by their annual income in 2007, 2011 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        sample_response: 'The bar chart compares the distribution of US households across different income brackets...'
      },
      {
        type: 'writing',
        task: 'task1',
        difficulty: 'beginner', 
        topic: 'Line Graph',
        prompt: 'The graph below shows the percentage of people in different age groups who used social media in a particular country between 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        sample_response: 'The line graph depicts the usage of social media across various age demographics...'
      },
      
      // Task 2 prompts
      {
        type: 'writing',
        task: 'task2',
        difficulty: 'intermediate',
        topic: 'Education',
        prompt: 'Some people believe that children should be required to help with household tasks as soon as they are able to do so. Others believe that children should be free to play and study. Discuss both views and give your own opinion. Write at least 250 words.',
        sample_response: 'The question of whether children should participate in household chores has been debated extensively...'
      },
      {
        type: 'writing', 
        task: 'task2',
        difficulty: 'advanced',
        topic: 'Technology',
        prompt: 'In many countries, people are now living longer than ever before. Some people say an ageing population creates problems for governments. Other people think there are benefits if society has more elderly people. To what extent do you agree or disagree? Write at least 250 words.',
        sample_response: 'The demographic shift towards an aging population presents both challenges and opportunities...'
      },
      {
        type: 'writing',
        task: 'task2', 
        difficulty: 'intermediate',
        topic: 'Environment',
        prompt: 'Some people think that environmental problems are too big for individuals to solve, while others believe that individuals can make a significant contribution. Discuss both views and give your opinion. Write at least 250 words.',
        sample_response: 'Environmental challenges have reached unprecedented scales, leading to debates about individual responsibility...'
      },
      {
        type: 'writing',
        task: 'task2',
        difficulty: 'beginner',
        topic: 'Health',
        prompt: 'In some countries, fast food restaurants and supermarkets give money to schools to promote their products. Do you think this is a positive or negative development? Write at least 250 words.',
        sample_response: 'The practice of commercial organizations funding educational institutions in exchange for promotional opportunities...'
      },
      {
        type: 'writing',
        task: 'task2',
        difficulty: 'advanced', 
        topic: 'Society',
        prompt: 'Many people believe that social networking sites have had a huge negative impact on both individuals and society. To what extent do you agree or disagree? Write at least 250 words.',
        sample_response: 'Social networking platforms have fundamentally transformed human interaction and societal structures...'
      },
      {
        type: 'writing',
        task: 'task2',
        difficulty: 'intermediate',
        topic: 'Work',
        prompt: 'Some people think that companies should provide employees with exercise time during the day. Others believe employees should use their own time for exercise. Discuss both views and give your opinion. Write at least 250 words.',
        sample_response: 'The integration of physical fitness into the workplace has become increasingly relevant...'
      },
      {
        type: 'writing',
        task: 'task2',
        difficulty: 'advanced',
        topic: 'Culture',
        prompt: 'Globalization has made it possible for people to learn about other cultures. However, some people think that this trend may lead to the loss of cultural identity. Do you think the advantages of globalization outweigh the disadvantages? Write at least 250 words.',
        sample_response: 'Globalization has created unprecedented opportunities for cross-cultural exchange and understanding...'
      }
    ];
    
    // Insert prompts
    const insertedPrompts = await Prompt.insertMany(writingPrompts);
    console.log(`✅ Inserted ${insertedPrompts.length} writing prompts`);
    
    // Display summary
    const taskCounts = await Promise.all([
      Prompt.countDocuments({ task: 'task1' }),
      Prompt.countDocuments({ task: 'task2' })
    ]);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Task 1 prompts: ${taskCounts[0]}`);
    console.log(`   Task 2 prompts: ${taskCounts[1]}`);
    
    const difficultyCounts = await Promise.all([
      Prompt.countDocuments({ difficulty: 'beginner' }),
      Prompt.countDocuments({ difficulty: 'intermediate' }), 
      Prompt.countDocuments({ difficulty: 'advanced' })
    ]);
    
    console.log(`   Beginner: ${difficultyCounts[0]}`);
    console.log(`   Intermediate: ${difficultyCounts[1]}`);
    console.log(`   Advanced: ${difficultyCounts[2]}`);
    
    mongoose.disconnect();
    console.log('\n🎉 Writing prompts seeding completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

seedWritingPrompts();