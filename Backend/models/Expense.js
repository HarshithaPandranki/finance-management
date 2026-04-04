import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    description: { type: String, required: true }
});

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
