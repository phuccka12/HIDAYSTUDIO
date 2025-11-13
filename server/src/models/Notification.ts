import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  body: { type: String },
  read: { type: Boolean, default: false },
  broadcast: { type: Boolean, default: false }, // visible to all users
  meta: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', NotificationSchema);
