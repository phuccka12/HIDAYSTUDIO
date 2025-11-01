import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import Writing from '../src/models/Writing';

dotenv.config();

async function run() {
  const url = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!url) {
    console.error('No MONGO_URL or MONGODB_URI found in environment.');
    process.exit(1);
  }

  await mongoose.connect(url);
  console.log('Connected to MongoDB, fetching latest writings...');

  const docs = await Writing.find({}).sort({ submittedAt: -1 }).limit(10).lean();
  if (!docs || docs.length === 0) {
    console.log('No writing documents found.');
    await mongoose.disconnect();
    return;
  }

  docs.forEach((d, i) => {
    console.log('--- Document', i + 1, '---');
    console.log('id:', d._id?.toString());
    console.log('submittedAt:', d.submittedAt);
    console.log('score:', d.score);
    console.log('feedback:', Array.isArray(d.feedback) ? d.feedback.join(' | ') : d.feedback);
    console.log('raw (first 2000 chars):');
    console.log(String(d.raw ?? '').slice(0, 2000));
    console.log('\n');
  });

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error running dumpLatestRaw:', err);
  process.exit(1);
});
