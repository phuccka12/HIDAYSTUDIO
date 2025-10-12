import * as express from 'express';
// Use require() for these to avoid ESM/CommonJS interop issues when running with ts-node-dev
const cors = require('cors');
const cookieParser = require('cookie-parser');
import mongoose from 'mongoose';
const dotenv = require('dotenv');
import 'express-async-errors';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import submissionRoutes from './routes/submissions';
import adminRoutes from './routes/admin';
import contentRouter from './routes/content';
import uploadsRouter from './routes/uploads';
// use require() for path to avoid ESM/CommonJS interop issues when running with ts-node-dev
const path = require('path');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/submissions', submissionRoutes);
app.use('/admin', adminRoutes);
app.use('/', contentRouter);
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));
app.use('/', uploadsRouter);

app.get('/', (_req, res) => res.json({ status: 'ok' }));

// Load environment variables from server/.env when present
dotenv.config();

// Accept either MONGO_URL or MONGODB_URI for compatibility
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-dev';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGO_URL).then(() => {
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}).catch(err => {
  // eslint-disable-next-line no-console
  console.error('Failed to connect to MongoDB', err);
});

export default app;
