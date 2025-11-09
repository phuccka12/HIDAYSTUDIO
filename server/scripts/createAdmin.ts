import mongoose from 'mongoose';
// use require() for dotenv to avoid ESM/CJS interop in small script
const dotenv = require('dotenv');
// require bcryptjs to avoid ESM/CJS import issues in small script
const bcrypt = require('bcryptjs');
import User from '../src/models/User';

dotenv.config();
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';

const readline = require('readline');

function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, (answer: string) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    // Hidden input (password) - mask with '*'
    // @ts-ignore - augmenting rl for simple script
    rl.stdoutMuted = true;
    // @ts-ignore
    const _write = rl._writeToOutput;
    // @ts-ignore
    rl._writeToOutput = function (s: string) {
      if (rl.stdoutMuted) {
        rl.output.write('*'.repeat(String(s).length));
      } else {
        _write.call(rl, s);
      }
    };

    rl.question(question, (answer: string) => {
      // restore
      // @ts-ignore
      rl._writeToOutput = _write;
      rl.stdoutMuted = false;
      rl.close();
      rl.output.write('\n');
      resolve(answer.trim());
    });
  });
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  let email = process.argv[2] || '';
  let password = process.argv[3] || '';

  if (!email) {
    email = await prompt('Admin email: ');
  }
  if (!password) {
    password = await prompt('Password: ', true);
    if (!password) {
      console.error('Password is required. Aborting.');
      process.exit(1);
    }
  }

  console.log('Hashing password...');
  const hash = await bcrypt.hash(password, 10);

  console.log('Upserting admin user...');
  const update = { email, role: 'admin', passwordHash: hash } as any;
  const user = await User.findOneAndUpdate({ email }, update, { upsert: true, new: true, setDefaultsOnInsert: true });

  console.log(`Admin user upserted: ${user?.email} (id=${user?._id})`);
  console.log('Password set/updated for admin.');

  console.log('Disconnecting...');
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
