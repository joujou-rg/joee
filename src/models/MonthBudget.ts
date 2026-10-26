import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMonthBudget extends Document {
  userId: Types.ObjectId;
  month: string; // "YYYY-MM"
  budgetDzd: number;
  savingsGoalDzd: number;
  walletCounts: Record<string, number>;
  updatedAt: Date;
}

const MonthBudgetSchema = new Schema<IMonthBudget>({
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
  budgetDzd: {
    type: Number,
    default: 65000,
  },
  savingsGoalDzd: {
    type: Number,
    default: 10000,
  },
  walletCounts: {
    type: Map,
    of: Number,
    default: () => ({
      '2000': 0,
      '1000': 0,
      '500': 0,
      '200': 0,
      '100': 0,
      '50': 0,
      '20': 0,
      '10': 0,
      '5': 0,
    }),
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

MonthBudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const MonthBudget: Model<IMonthBudget> =
  mongoose.models.MonthBudget || mongoose.model<IMonthBudget>('MonthBudget', MonthBudgetSchema);
