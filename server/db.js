import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ── Mongoose Schemas & Models ────────────────────────────────────────────────

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, default: '' }
});
// Virtual 'id' field that maps to '_id' so frontend doesn't need changes
memberSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const expenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  year: { type: Number, required: true }
});
expenseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const ledgerSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  memberId: { type: String, required: true },
  monthIndex: { type: Number, required: true },
  base: { type: Number, default: 100 },
  birthday: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  source: { type: String, default: 'Cash' },
  paidDate: { type: String, default: null }
});
// Compound unique index to prevent duplicate entries
ledgerSchema.index({ year: 1, memberId: 1, monthIndex: 1 }, { unique: true });

const availableYearSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true }
});

const templeFundSchema = new mongoose.Schema({
  memberId:   { type: String }, // Optional for outsiders
  memberName: { type: String, required: true },
  amount:     { type: Number, required: true },
  date:       { type: String, required: true },
  year:       { type: Number, required: true }
});
templeFundSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Member = mongoose.model('Member', memberSchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export const TempleFund = mongoose.model('TempleFund', templeFundSchema);
export const Ledger = mongoose.model('Ledger', ledgerSchema);
export const AvailableYear = mongoose.model('AvailableYear', availableYearSchema);

// ── Connect to MongoDB ──────────────────────────────────────────────────────

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};
