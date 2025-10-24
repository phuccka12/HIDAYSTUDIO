import mongoose from 'mongoose';
import Prompt from '../models/Prompt';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

const SAMPLE: { task_type: string; text: string }[] = [
  { task_type: 'IELTS_Task2', text: 'Some people believe that studying online is better than studying in classrooms. Discuss both views and give your opinion.' },
  { task_type: 'IELTS_Task2', text: 'Many people think that governments should invest more in public transport instead of roads. To what extent do you agree or disagree?' },
  { task_type: 'IELTS_Task2', text: 'In many countries, young people are leaving their hometowns for larger cities. Discuss causes and solutions.' },
  { task_type: 'IELTS_Task1_Academic', text: 'Describe the main trends shown in the chart and summarise the information.' },
  { task_type: 'Other', text: 'Write an essay about the impacts of social media on communication.' }
];
  
async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to Mongo for seeding prompts');
  for (const p of SAMPLE) {
    const exists = await Prompt.findOne({ task_type: p.task_type, text: p.text }).lean();
    if (!exists) {
      await Prompt.create({ task_type: p.task_type, text: p.text });
      console.log('Inserted prompt:', p.text.slice(0, 80));
    }
  }
  console.log('Seeding done');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
});