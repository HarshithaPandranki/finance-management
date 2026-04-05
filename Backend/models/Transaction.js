import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  primeId: {
    type: Number,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'],
    lowercase: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  category: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Most queries filter by userId + date range — this compound index covers them all
transactionSchema.index({ userId: 1, date: -1 });

// For CRUD by primeId + userId (update / delete / single fetch)
transactionSchema.index({ userId: 1, primeId: 1 });

// For type filtering (income vs expense reports)
transactionSchema.index({ userId: 1, type: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;