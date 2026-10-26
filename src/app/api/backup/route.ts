import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthBudget } from '@/models/MonthBudget';
import { Expense } from '@/models/Expense';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    await connectToDatabase();

    const budgets = await MonthBudget.find({ userId: authUser.userId });
    const expenses = await Expense.find({ userId: authUser.userId });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      user: {
        id: authUser.userId,
        email: authUser.email,
        name: authUser.name,
      },
      budgets,
      expenses,
    });
  } catch (error: any) {
    console.error('Backup export error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
