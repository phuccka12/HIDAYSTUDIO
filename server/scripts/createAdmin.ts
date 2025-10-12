import mongoose from 'mongoose';
// use require() for dotenv to avoid ESM/CJS interop in small script
const dotenv = require('dotenv');
import User from '../src/models/User';

dotenv.config();
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected');
  const email = process.argv[2] || 'admin@example.com';
  const user = await User.findOneAndUpdate({ email }, { email, role: 'admin' }, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log('Upserted admin:', user);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
