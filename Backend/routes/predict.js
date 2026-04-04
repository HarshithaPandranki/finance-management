import express from 'express';
import multer from 'multer';
import { predict, fetchFromDatabase } from '../controllers/predictController.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({ dest: '/tmp/uploads/' });

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate', message: error.message });
  }
};

// Apply file upload middleware only for CSV upload
router.post('/', upload.single('file'), predict);
router.get('/database', auth, fetchFromDatabase); // Add auth middleware to protect this route

export default router;
