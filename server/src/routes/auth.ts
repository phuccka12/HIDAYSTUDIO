import { Router } from 'express';
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
import mongoose from 'mongoose';
import User from '../models/User';
const nodemailer = require('nodemailer');

dotenv.config();

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
  const { email, password, userData } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already used' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash: hash, full_name: userData?.fullName });

  // Set a simple cookie
  res.cookie('ielts_user', String(user._id), { httpOnly: true });
  res.json({ user: { id: user._id, email: user.email, full_name: user.full_name }, session: { user } });
});

// Sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  res.cookie('ielts_user', String(user._id), { httpOnly: true });
  res.json({ user: { id: user._id, email: user.email, full_name: user.full_name }, session: { user } });
});

// Sign out
router.post('/signout', (_req, res) => {
  res.clearCookie('ielts_user');
  res.json({ ok: true });
});

// Get session
router.get('/session', async (req, res) => {
  const id = req.cookies['ielts_user'];
  if (!id || !mongoose.isValidObjectId(id)) return res.json({ session: null });
  const user = await User.findById(id).lean();
  if (!user) return res.json({ session: null });
  return res.json({ session: { user } });
});

// Reset password (dummy) — in real app send email
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  // Implement real email flow in production
  if (!email) return res.status(400).json({ message: 'Email required' });
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: 'If this email exists, a reset link was sent (dev mode)' });

  // Generate a secure token and store on user with expiry (1 hour)
  const crypto = require('crypto');
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  user.resetToken = token;
  user.resetTokenExpires = expires;
  await user.save();

  // Build reset link
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // If SENDGRID_API_KEY exists, use SendGrid Web API (more reliable than SMTP)
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendgridKey);
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || `no-reply@${process.env.EMAIL_DOMAIN || 'localhost'}`,
        subject: process.env.RESET_EMAIL_SUBJECT || 'Reset your password',
        text: `Follow this link to reset your password: ${resetLink}`,
        html: `<p>Follow this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      };
      const result = await sgMail.send(msg);
      return res.json({ message: 'If this email exists, a reset link was sent (sendgrid)', info: result });
    } catch (err) {
      console.error('SendGrid send failed, falling back to SMTP/dev link:', err);
      // fall through to SMTP block or dev fallback below
    }
  }

  // If SMTP config exists, try to send an email via nodemailer. Otherwise return link in JSON (dev mode).
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465, // true for 465, false for other ports
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
        logger: true,
        debug: true,
      });

      // Verify connection and authentication before sending
      try {
        await transporter.verify();
        console.log('SMTP verify: OK');
      } catch (verifyErr) {
        // Do not block the dev flow if SMTP verify fails; return the resetLink instead.
        console.error('SMTP verify failed, falling back to dev resetLink:', verifyErr);
        return res.json({ message: 'SMTP verify failed - falling back to dev resetLink', resetLink, error: String(verifyErr) });
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || `no-reply@${process.env.EMAIL_DOMAIN || 'localhost'}`,
        to: email,
        subject: process.env.RESET_EMAIL_SUBJECT || 'Reset your password',
        text: `Follow this link to reset your password: ${resetLink}`,
        html: `<p>Follow this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      };

      const info = await transporter.sendMail(mailOptions);
      // For debugging: include messageId in response but do not expose internals
      return res.json({ message: 'If this email exists, a reset link was sent', messageId: info.messageId });
    } catch (err) {
      // Fall back to returning the link for development troubleshooting
      console.error('Failed to send reset email via SMTP:', err);
      return res.json({ message: 'Failed to send email via SMTP, returning reset link (dev)', resetLink, error: String(err) });
    }
  }

  // No email provider configured — return link for development
  // As a better dev experience, create an Ethereal test account and send a preview email
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `no-reply@${process.env.EMAIL_DOMAIN || 'localhost'}`,
      to: email,
      subject: process.env.RESET_EMAIL_SUBJECT || 'Reset your password (dev)',
      text: `Follow this link to reset your password: ${resetLink}`,
      html: `<p>Follow this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return res.json({ message: 'Ethereal preview (dev)', previewUrl, resetLink });
  } catch (err) {
    console.error('Ethereal fallback failed:', err);
    return res.json({ message: 'If this email exists, a reset link was sent (dev mode)', resetLink });
  }
});

// Update password (dummy) — require authenticated user
router.post('/update-password', async (req, res) => {
  const id = req.cookies['ielts_user'];
  if (!id) return res.status(401).json({ message: 'Not authenticated' });
  const { newPassword } = req.body;
  const hash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(id, { passwordHash: hash });
  res.json({ message: 'Password updated' });
});

// Confirm password reset using token
router.post('/reset-password/confirm', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) return res.status(400).json({ message: 'Email, token and newPassword required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid token or email' });
  if (!user.resetToken || user.resetToken !== token) return res.status(400).json({ message: 'Invalid token' });
  if (!user.resetTokenExpires || new Date() > new Date(user.resetTokenExpires)) return res.status(400).json({ message: 'Token expired' });

  const hash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = hash;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

export default router;
