import mongoose from 'mongoose';
const dotenv = require('dotenv');
import Exam from '../src/models/Exam';

dotenv.config();
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB:', MONGO_URL);

  const slug = 'reading-history-of-tea';

  const examPayload: any = {
    title: 'Reading: The History of Tea',
    slug,
    description: 'Short reading passage about the history of tea followed by multiple-choice questions.',
    tags: ['reading','practice','mcq'],
    sections: [
      {
        id: 's1',
        type: 'reading',
        title: 'Passage: The History of Tea',
  instructions: `Read the passage and answer the questions. Choose the single best answer.

Tea has been a cherished beverage for centuries. Originating in East Asia, it became deeply embedded in cultures across China and Japan. The earliest records show tea being used as a medicinal herb before evolving into a daily drink.

As trade routes expanded, tea moved from a regional specialty to an international commodity. Merchants transported tea along with silk and spices, and its popularity grew in Europe during the age of exploration.

Different cultures adapted tea to local tastes. In the 18th century, drinking tea with milk and sugar became fashionable in some parts of Europe, reflecting changing social habits and colonial trade networks.

Over time, tea also became a symbol of status and hospitality. In colonial societies it was both a staple and a marker of social class, consumed at homes and in public gatherings.`,
        questions: [
          {
            id: 'r1q1',
            type: 'mcq',
            prompt: 'According to the passage, where did tea drinking originate?',
            text: 'Where did tea drinking originate?',
            points: 1,
            choices: [
              { id: 'a', text: 'China', isCorrect: true },
              { id: 'b', text: 'India', isCorrect: false },
              { id: 'c', text: 'England', isCorrect: false },
              { id: 'd', text: 'Japan', isCorrect: false }
            ]
          },
          {
            id: 'r1q2',
            type: 'mcq',
            prompt: 'What was used to trade tea during early commerce?',
            text: 'What was commonly used to trade tea in early commerce?',
            points: 1,
            choices: [
              { id: 'a', text: 'Silk and spices', isCorrect: true },
              { id: 'b', text: 'Gold only', isCorrect: false },
              { id: 'c', text: 'Cowrie shells', isCorrect: false },
              { id: 'd', text: 'Pottery', isCorrect: false }
            ]
          },
          {
            id: 'r1q3',
            type: 'mcq',
            prompt: 'Which development increased tea popularity in Europe?',
            text: 'Which development helped increase tea popularity in Europe?',
            points: 1,
            choices: [
              { id: 'a', text: 'The establishment of trading companies', isCorrect: true },
              { id: 'b', text: 'Lower crop yields', isCorrect: false },
              { id: 'c', text: 'A ban on coffee', isCorrect: false },
              { id: 'd', text: 'Introduction of chocolate', isCorrect: false }
            ]
          },
          {
            id: 'r1q4',
            type: 'mcq',
            prompt: 'How was tea commonly consumed in the 18th century?',
            text: 'How did people commonly consume tea in the 18th century?',
            points: 1,
            choices: [
              { id: 'a', text: 'With milk and sugar', isCorrect: true },
              { id: 'b', text: 'Cold and unsweetened', isCorrect: false },
              { id: 'c', text: 'Only as a medicinal tonic', isCorrect: false },
              { id: 'd', text: 'Mixed with beer', isCorrect: false }
            ]
          },
          {
            id: 'r1q5',
            type: 'mcq',
            prompt: 'Why did colonies value tea during the colonial period?',
            text: 'Why was tea a valued commodity in colonies?',
            points: 1,
            choices: [
              { id: 'a', text: 'It was a status symbol and daily staple', isCorrect: true },
              { id: 'b', text: 'Because it was free', isCorrect: false },
              { id: 'c', text: 'It was used as a currency by governments', isCorrect: false },
              { id: 'd', text: 'It replaced water entirely', isCorrect: false }
            ]
          }
        ]
      }
    ],
    settings: {
      timeLimitMinutes: 15,
      attemptsAllowed: 3,
      randomizeQuestions: false,
      showAnswersAfterSubmit: 'immediately',
      passThresholdPercent: 50,
      negativeMarking: { enabled: false },
      autoGradeTypes: ['mcq','multi']
    },
    published: true,
    version: 1
  };

  try {
    const existing = await Exam.findOne({ slug });
    if (existing) {
      console.log('Found existing exam with slug, updating...');
      existing.title = examPayload.title;
      existing.description = examPayload.description;
      existing.tags = examPayload.tags;
      existing.sections = examPayload.sections;
      existing.settings = examPayload.settings;
      existing.published = true;
      existing.version = (existing.version || 1) + 1;
      await existing.save();
      console.log('Updated exam:', existing._id.toString());
    } else {
      const created = await Exam.create(examPayload);
      console.log('Created exam:', created._id.toString());
    }
  } catch (err: any) {
    console.error('Seed failed:', err.message || err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
