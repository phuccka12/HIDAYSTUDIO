import mongoose from 'mongoose';
import Prompt from '../src/models/Prompt';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

// Comprehensive IELTS Writing Task 2 Prompts Dataset
const WRITING_PROMPTS = [
  // Education Topics
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that studying online is better than studying in classrooms. Discuss both views and give your opinion.',
    tags: ['education', 'technology', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Many students find it difficult to concentrate or pay attention in school. What are the reasons? What could be done to solve this problem?',
    tags: ['education', 'problem-solution', 'young-people']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake. Discuss both views and give your opinion.',
    tags: ['education', 'employment', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'In many countries, children are engaged in some kind of paid work. Some people regard this as completely wrong, while others consider it as valuable work experience. Discuss both views and give your opinion.',
    tags: ['education', 'children', 'work', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?',
    tags: ['education', 'community', 'agree-disagree']
  },

  // Technology Topics
  {
    task_type: 'IELTS_Task2',
    text: 'Today, the high sales of popular consumer goods reflect the power of advertising and not the real needs of the society in which they are sold. To what extent do you agree or disagree?',
    tags: ['technology', 'advertising', 'society', 'agree-disagree']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that the increasing use of computers and mobile phones for communication has a negative effect on young people\'s reading and writing skills. To what extent do you agree or disagree?',
    tags: ['technology', 'communication', 'young-people', 'agree-disagree']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Nowadays, more people are choosing to socialize online rather than face to face. Is this a positive or negative development?',
    tags: ['technology', 'social-media', 'communication', 'positive-negative']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that the development of technology has made life more complex, and the solution is to live a simpler life without technology. To what extent do you agree or disagree?',
    tags: ['technology', 'lifestyle', 'agree-disagree']
  },

  // Environment Topics
  {
    task_type: 'IELTS_Task2',
    text: 'Environmental damage is a problem in most countries. What are the major causes of this problem? What can be done to solve this problem?',
    tags: ['environment', 'problem-solution']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that environmental problems are too big for individuals to solve, while others believe that individuals can make a difference. Discuss both views and give your opinion.',
    tags: ['environment', 'responsibility', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Many countries are experiencing population growth and need more houses. Should these new homes be built in existing cities or should new towns be built in the countryside?',
    tags: ['environment', 'urbanization', 'housing']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that the best way to reduce traffic congestion is to increase the price of petrol. To what extent do you agree or disagree?',
    tags: ['environment', 'transport', 'traffic', 'agree-disagree']
  },

  // Transport & Infrastructure
  {
    task_type: 'IELTS_Task2',
    text: 'Many people think that governments should invest more in public transport instead of roads. To what extent do you agree or disagree?',
    tags: ['transport', 'government', 'infrastructure', 'agree-disagree']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'The number of cars has increased significantly in major cities. What problems does this cause and what are some solutions?',
    tags: ['transport', 'urbanization', 'problem-solution']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that the best way to improve road safety is to increase the minimum legal age for driving cars or motorbikes. To what extent do you agree or disagree?',
    tags: ['transport', 'safety', 'agree-disagree']
  },

  // Work & Employment
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that it is good to share as much information as possible in scientific research, business and the academic world. Others believe that some information is too important or too valuable to be shared freely. Discuss both views and give your opinion.',
    tags: ['work', 'information', 'research', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Many people work long hours, leaving very little time for leisure activities. Does this situation have more advantages or more disadvantages?',
    tags: ['work', 'lifestyle', 'work-life-balance', 'advantages-disadvantages']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some employers want to be able to contact their staff at all times, even on holidays. Does this development have more advantages than disadvantages?',
    tags: ['work', 'technology', 'work-life-balance', 'advantages-disadvantages']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'In many countries, more and more people are working from home. Is this a positive or negative development?',
    tags: ['work', 'remote-work', 'lifestyle', 'positive-negative']
  },

  // Health & Lifestyle
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that governments should ban dangerous sports, while others claim that people should have the freedom to choose their own activities. Discuss both views and give your opinion.',
    tags: ['health', 'sports', 'freedom', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'In many countries, the average weight of people is increasing and their levels of health and fitness are decreasing. What do you think are the causes of these problems and what measures could be taken to solve them?',
    tags: ['health', 'obesity', 'lifestyle', 'problem-solution']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people say that the best way to improve public health is by increasing the number of sports facilities. Others, however, say that this would have little effect on public health and that other measures are required. Discuss both views and give your opinion.',
    tags: ['health', 'sports', 'public-services', 'discuss-both-views']
  },

  // Urbanization & City Life
  {
    task_type: 'IELTS_Task2',
    text: 'In many countries, young people are leaving their hometowns for larger cities. What are the causes and solutions to this problem?',
    tags: ['urbanization', 'migration', 'young-people', 'problem-solution']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people prefer to live in a small town, while others prefer to live in a big city. Which place would you prefer to live in? Use specific reasons and details to support your answer.',
    tags: ['urbanization', 'lifestyle', 'opinion']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'As major cities in the world are growing today, so do their problems. What are problems for young people who are living in the cities as the result of continued growth? What are solutions for these problems?',
    tags: ['urbanization', 'young-people', 'problem-solution']
  },

  // Crime & Punishment
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your opinion.',
    tags: ['crime', 'punishment', 'society', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Many criminals commit further crimes as soon as they are released from prison. What do you think are the causes of this? What possible solutions can you suggest?',
    tags: ['crime', 'rehabilitation', 'problem-solution']
  },

  // Media & Entertainment
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that what children watch on television influences their behaviour. Others say that the amount of time spent watching television influences their behaviour. Discuss both views and give your opinion.',
    tags: ['media', 'children', 'behavior', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Nowadays, television news shows a lot of disaster scenes and violence. What are the effects on individuals and society? What measures can be taken to address this issue?',
    tags: ['media', 'violence', 'society', 'problem-solution']
  },

  // Culture & Tradition
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that visitors to other countries should follow local customs and behaviour. Others disagree and think that the host country should welcome cultural differences. Discuss both views and give your opinion.',
    tags: ['culture', 'tourism', 'tradition', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Traditional food is being replaced by international fast food. This has negative effects on both families and societies. To what extent do you agree or disagree?',
    tags: ['culture', 'food', 'globalization', 'agree-disagree']
  },

  // Government & Society
  {
    task_type: 'IELTS_Task2',
    text: 'Some people think that governments should give financial support to creative artists such as painters and musicians. Others believe that creative artists should be funded by alternative sources. Discuss both views and give your opinion.',
    tags: ['government', 'art', 'culture', 'discuss-both-views']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'Some people believe that the government should take care of old people and provide financial support after they retire. Others say individuals should save during their working years to fund their own retirement. What is your opinion?',
    tags: ['government', 'elderly', 'welfare', 'opinion']
  },

  // Globalization
  {
    task_type: 'IELTS_Task2',
    text: 'The increase in global trade and communication has resulted in more countries becoming similar to each other. Is this a positive or negative development?',
    tags: ['globalization', 'culture', 'positive-negative']
  },
  {
    task_type: 'IELTS_Task2',
    text: 'International tourism has become a huge industry in the world. Do the problems of international travel outweigh its advantages?',
    tags: ['globalization', 'tourism', 'advantages-disadvantages']
  },

  // IELTS Task 1 Academic Prompts
  {
    task_type: 'IELTS_Task1_Academic',
    text: 'The graph below shows the consumption of three different types of fast food by British teenagers between 1975 and 2000. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    tags: ['task1', 'line-graph', 'trends']
  },
  {
    task_type: 'IELTS_Task1_Academic',
    text: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    tags: ['task1', 'bar-chart', 'trends']
  },
  {
    task_type: 'IELTS_Task1_Academic',
    text: 'The diagram below shows the life cycle of a salmon. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    tags: ['task1', 'diagram', 'process']
  },
  {
    task_type: 'IELTS_Task1_Academic',
    text: 'The table below gives information about the underground railway systems in six cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    tags: ['task1', 'table', 'data-comparison']
  },
  {
    task_type: 'IELTS_Task1_Academic',
    text: 'The pie charts below show the comparison of different kinds of energy production of France in two years. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    tags: ['task1', 'pie-chart', 'comparison']
  },

  // IELTS Task 1 General Training (Letters)
  {
    task_type: 'IELTS_Task1_General',
    text: 'You recently bought a piece of equipment for your kitchen but it did not work. You phoned the shop but no action was taken. Write a letter to the shop manager. In your letter: describe the problem with the equipment, explain what happened when you phoned the shop, say what you would like the manager to do.',
    tags: ['task1-general', 'complaint-letter', 'formal']
  },
  {
    task_type: 'IELTS_Task1_General',
    text: 'You have recently moved to a different house. Write a letter to an English-speaking friend. In your letter: explain why you have moved, describe the new house, invite your friend to come and visit.',
    tags: ['task1-general', 'informal-letter', 'personal']
  },
  {
    task_type: 'IELTS_Task1_General',
    text: 'You work for an international company. You have seen an advertisement for a training course which will be useful for your job. Write a letter to your manager. In your letter: describe the training course you want to do, explain what the company could do to help you, say how the course will be useful for your job.',
    tags: ['task1-general', 'semi-formal-letter', 'request']
  }
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  let insertedCount = 0;
  let skippedCount = 0;

  for (const promptData of WRITING_PROMPTS) {
    const exists = await Prompt.findOne({ 
      task_type: promptData.task_type, 
      text: promptData.text 
    }).lean();

    if (!exists) {
      await Prompt.create({
        task_type: promptData.task_type,
        text: promptData.text,
        tags: promptData.tags || [],
        created_at: new Date()
      });
      insertedCount++;
      console.log(`✅ Inserted: ${promptData.text.substring(0, 60)}...`);
    } else {
      skippedCount++;
      console.log(`⏭️  Skipped (already exists): ${promptData.text.substring(0, 60)}...`);
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Inserted: ${insertedCount} prompts`);
  console.log(`   ⏭️  Skipped: ${skippedCount} prompts`);
  console.log(`   📝 Total in dataset: ${WRITING_PROMPTS.length} prompts`);
  
  // Show count by task type
  const countByType = await Prompt.aggregate([
    { $group: { _id: '$task_type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\n📈 Database Statistics:');
  countByType.forEach(item => {
    console.log(`   ${item._id}: ${item.count} prompts`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Seeding completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
