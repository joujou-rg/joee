import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExpense extends Document {
  userId: Types.ObjectId;
  month: string; // "YYYY-MM"
  date: string;  // "YYYY-MM-DD"
  amount: number;
  category: string;
  note: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  month: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    default: 'other',
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ExpenseSchema.index({ userId: 1, month: 1, date: -1 });

export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
