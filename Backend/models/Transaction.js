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
  description: String,
  amount: Number,
  type: String,
  category: String,
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a pre-save hook to auto-generate primeId if not provided
transactionSchema.pre('save', async function(next) {
  if (!this.primeId) {
    const lastTransaction = await this.constructor.findOne({}, {}, { sort: { 'primeId': -1 } });
    this.primeId = lastTransaction ? lastTransaction.primeId + 1 : 1;
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction; 