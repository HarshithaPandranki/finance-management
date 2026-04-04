import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import multer from 'multer';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import predictRoutes from './routes/predict.js';
import fs from 'fs';

dotenv.config();
console.log('EMAIL:', process.env.EMAIL);
console.log('APP_PASS:', process.env.APP_PASS ? '✅ Loaded' : '❌ Missing');
const app = express();
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}




// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://statuesque-chebakia-1eb7f2.netlify.app',
      process.env.FRONTEND_URL
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); //hello

// Add email configuration after other configurations
console.log('Email configuration:', {
  emailUser: process.env.EMAIL ? 'Set' : 'Not set',
  emailPass: process.env.APP_PASS ? 'Set' : 'Not set'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASS
  },
  tls: {
    rejectUnauthorized: false 
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Transporter verification failed:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// MongoDB connection with error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Call the connect function
connectDB();

// Define Goal schema and model (not extracted to separate file yet)
const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Goal = mongoose.model('Goal', goalSchema);

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate', error: error.message });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, mobile } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      fullName,
      mobile
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }
    
    // Check if email exists in database
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        message: 'This email is not registered. Please sign up first.'
      });
    }
    
    return res.status(200).json({
      message: 'Email verified'
    });
    
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({
      message: 'Server error while checking email'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
        if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        message: 'Email not found. Please sign up first.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
});

// Protected routes
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide both startDate and endDate' });
    }

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this helper function after your schema definitions
const checkGoalsAndNotify = async (userId, transaction) => {
  try {
    console.log('Starting goal check for userId:', userId);
    console.log('New transaction:', transaction);
    
    // Only proceed if this is an expense
    if (transaction.type !== 'expense') {
      console.log('Not an expense transaction, skipping goal check');
      return;
    }

    // Get the goal for this specific transaction category only
    const goal = await Goal.findOne({ 
      userId,
      description: transaction.description
    });
    
    if (!goal) {
      console.log('No goal found for category:', transaction.description);
      return;
    }

    // Get user email
    const user = await User.findById(userId);
    if (!user || !user.email) {
      console.log('No user or email found for userId:', userId);
      return;
    }

    // Check if this single transaction exceeds the goal
    if (transaction.amount > goal.amount) {
      console.log(`Goal limit reached for ${transaction.description}`);
      
      const mailOptions = {
        from: '"Expense Alert" <shanmukharaoadapaka123@gmail.com>',
        to: user.email,
        subject: `Spending Alert for ${transaction.description}`,
        html: `
          <h2>Spending Alert!</h2>
          <p>Your recent transaction in category "${transaction.description}" has exceeded your set goal.</p>
          <ul>
            <li>Category: ${transaction.description}</li>
            <li>Goal Limit: ₹${goal.amount.toFixed(2)}</li>
            <li>Transaction Amount: ₹${transaction.amount.toFixed(2)}</li>
            <li>Amount Exceeded: ₹${(transaction.amount - goal.amount).toFixed(2)}</li>
          </ul>
          <p>Please review your spending in this category.</p>
        `
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }
  } catch (error) {
    console.error('Error in checkGoalsAndNotify:', error);
  }
};

// Update the POST transaction route to include goal checking
app.post('/api/transactions', auth, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      userId: req.user._id,
      primeId: Date.now() + Math.floor(Math.random() * 1000)
    });

    await transaction.save();

    if (transaction.type === 'expense') {
      await checkGoalsAndNotify(req.user._id, transaction);
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


app.put('/api/transactions/:primeId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { 
        primeId: parseInt(req.params.primeId), 
        userId: req.user._id 
      },
      {
        ...req.body,
        userId: req.user._id  // Ensure userId cannot be changed
      },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
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
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export transactions by date range
app.get('/api/transactions/export', auth, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Please provide both fromDate and toDate' });
    }

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ message: error.message });
  }
});


app.post('/api/goals', auth, async (req, res) => {
  try {
    // Delete existing goals for this user
    await Goal.deleteMany({ userId: req.user._id });
    
    // Create new goals from the received data
    const goalsData = Object.entries(req.body.goals).map(([description, amount]) => ({
      userId: req.user._id,
      description,
      amount
    }));
    
    const goals = await Goal.insertMany(goalsData);
    res.status(201).json(goals);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/goals', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this new test endpoint
app.post('/api/test-email', auth, async (req, res) => {
  try {
    const testMailOptions = {
      from: `"Finance Tracker" <${process.env.EMAIL}>`,
      to: req.user.email,
      subject: 'Test Email',
      html: '<h1>This is a test email</h1><p>If you received this, your email configuration is working correctly!</p>'
    };

    const info = await transporter.sendMail(testMailOptions);
    
    res.json({
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
      message: 'Test email sent successfully!'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send test email'
    });
  }
});

const upload = multer({ dest: 'uploads/' });

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Finance Management API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      goals: '/api/goals',
      predict: '/predict'
    }
  });
});

// Mount predict routes
// Note: file upload middleware is applied in the route handlers as needed
app.use('/predict', predictRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});