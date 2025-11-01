import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function run() {
  const url = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!url) {
    console.error('No MONGO_URL or MONGODB_URI found in environment.');
    process.exit(1);
  }

  await mongoose.connect(url);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections in DB:', collections.map(c => c.name));
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error listing collections:', err);
  process.exit(1);
});
