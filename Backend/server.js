import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import multer from 'multer';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import predictRoutes from './routes/predict.js';
import fs from 'fs';

dotenv.config();

console.log('EMAIL:', process.env.EMAIL);
console.log('APP_PASS:', process.env.APP_PASS ? '✅ Loaded' : '❌ Missing');

const app = express();

// ─── Upload Directory ────────────────────────────────────────────────────────
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
console.log('✅ Resend email client ready');

// ─── MongoDB ─────────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 7+
      maxPoolSize: 10,          // maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// ─── Goal Schema ──────────────────────────────────────────────────────────────
const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true          // ← index for fast lookups by userId
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Compound index: finding a user's goal for a specific category is a hot path
goalSchema.index({ userId: 1, description: 1 });

const Goal = mongoose.model('Goal', goalSchema);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // lean() returns a plain JS object — much faster, no Mongoose overhead
    const user = await User.findById(decoded.userId).lean();
    if (!user) throw new Error('User not found');

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate', error: error.message });
  }
};

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, mobile } = req.body;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, fullName, mobile });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) return res.status(404).json({ message: 'This email is not registered. Please sign up first.' });

    return res.status(200).json({ message: 'Email verified' });
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({ message: 'Server error while checking email' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Email not found. Please sign up first.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ─── Transactions ─────────────────────────────────────────────────────────────

// IMPORTANT: /export must be declared BEFORE /:primeId to avoid route shadowing
app.get('/api/transactions/export', auth, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) return res.status(400).json({ message: 'Please provide both fromDate and toDate' });

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: new Date(fromDate), $lte: new Date(toDate) }
    }).lean();    // lean() — plain objects, faster serialization

    res.json(transactions);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/transactions', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'Please provide both startDate and endDate' });

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .lean()
      .sort({ date: -1 });   // newest first, index-backed

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Goal Notification (non-blocking, fire-and-forget) ───────────────────────
/**
 * FIX: The original code matched transaction.description against goal.description.
 * Track.jsx sends category names (e.g. "Food & Dinning") as the description field,
 * so goal lookup is correct — but we now run this fully async so it NEVER delays
 * the HTTP response to the user.
 */
const sendGoalAlertEmail = async (userId, transaction) => {
  try {
    if (transaction.type !== 'expense') return;

    const category = transaction.category || transaction.description;

    const [goal, user] = await Promise.all([
      Goal.findOne({ userId, description: category }).lean(),
      User.findById(userId).select('email').lean()
    ]);

    if (!goal || !user?.email) return;

    if (transaction.amount > goal.amount) {
      const exceeded = (transaction.amount - goal.amount).toFixed(2);

      const { data, error } = await resend.emails.send({
        from: 'Expense Alert <onboarding@resend.dev>',
        to: user.email,
        subject: `⚠️ Spending Alert: ${category}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background: #ef5350; padding: 16px 24px;">
              <h2 style="color: #fff; margin: 0;">⚠️ Spending Alert</h2>
            </div>
            <div style="padding: 24px;">
              <p>Your recent <strong>${category}</strong> transaction exceeded your set goal.</p>
              <table style="width:100%; border-collapse:collapse; margin-top:12px;">
                <tr style="background:#f5f5f5;">
                  <td style="padding:8px 12px; font-weight:bold;">Category</td>
                  <td style="padding:8px 12px;">${category}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px; font-weight:bold;">Goal Limit</td>
                  <td style="padding:8px 12px;">₹${goal.amount.toFixed(2)}</td>
                </tr>
                <tr style="background:#f5f5f5;">
                  <td style="padding:8px 12px; font-weight:bold;">Transaction Amount</td>
                  <td style="padding:8px 12px; color:#ef5350;">₹${transaction.amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px; font-weight:bold;">Exceeded By</td>
                  <td style="padding:8px 12px; color:#ef5350; font-weight:bold;">₹${exceeded}</td>
                </tr>
              </table>
              <p style="margin-top:16px; color:#757575; font-size:13px;">Please review your spending to stay on track.</p>
            </div>
          </div>`
      });

      if (error) {
        console.error('❌ Resend error:', error);
      } else {
        console.log('✅ Alert email sent:', data.id);
      }
    }
  } catch (err) {
    console.error('❌ Goal email error:', err.message);
  }
};

app.post('/api/transactions', auth, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      userId: req.user._id,
      primeId: Date.now() + Math.floor(Math.random() * 1000)
    });

    await transaction.save();

    // ← Respond immediately, then check goals in the background
    res.status(201).json(transaction);

    if (transaction.type === 'expense') {
      // Fire-and-forget: does NOT block the response
      sendGoalAlertEmail(req.user._id, transaction).catch(console.error);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/transactions/:primeId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { primeId: parseInt(req.params.primeId), userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { new: true }
    ).lean();

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/transactions/:primeId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      primeId: parseInt(req.params.primeId),
      userId: req.user._id
    }).lean();

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Goals ────────────────────────────────────────────────────────────────────
app.post('/api/goals', auth, async (req, res) => {
  try {
    // Run delete + insert in parallel where possible
    await Goal.deleteMany({ userId: req.user._id });

    const goalsData = Object.entries(req.body.goals).map(([description, amount]) => ({
      userId: req.user._id,
      description,
      amount
    }));

    const goals = goalsData.length > 0 ? await Goal.insertMany(goalsData) : [];
    res.status(201).json(goals);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/goals', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).lean();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Test Email ───────────────────────────────────────────────────────────────
app.post('/api/test-email', auth, async (req, res) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Finance Tracker <onboarding@resend.dev>',
      to: req.user.email,
      subject: 'Test Email ✅',
      html: '<h1>Test Email</h1><p>Your email configuration is working correctly!</p>'
    });
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, messageId: data.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Finance Management API is running',
    timestamp: new Date().toISOString(),
    endpoints: { auth: '/api/auth', transactions: '/api/transactions', goals: '/api/goals', predict: '/predict' }
  });
});

// ─── Predict Routes ───────────────────────────────────────────────────────────
app.use('/predict', predictRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));