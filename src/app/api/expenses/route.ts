import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';
import { MonthBudget } from '@/models/MonthBudget';
import { getTodayDateStr } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { amount, category, note, date } = await req.json();

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' }, { status: 400 });
    }

    const expenseDate = date || getTodayDateStr();
    const month = expenseDate.substring(0, 7);

    await connectToDatabase();

    // Ensure month budget exists
    await MonthBudget.findOneAndUpdate(
      { userId: authUser.userId, month },
      {
        $setOnInsert: {
          budgetDzd: 65000,
          savingsGoalDzd: 10000,
        },
      },
      { upsert: true }
    );

    const expense = await Expense.create({
      userId: authUser.userId,
      month,
      date: expenseDate,
      amount: parsedAmount,
      category: category || 'other',
      note: (note || '').trim(),
    });

    return NextResponse.json({
      message: 'تمت إضافة المصروف بنجاح',
      expense: {
        id: expense._id.toString(),
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        date: expense.date,
        createdAt: expense.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
