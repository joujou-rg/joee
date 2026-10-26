import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthBudget } from '@/models/MonthBudget';
import { Expense } from '@/models/Expense';
import { getDefaultMonthStr } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getDefaultMonthStr();

    await connectToDatabase();

    // Find or create budget for this month
    let budgetDoc = await MonthBudget.findOne({
      userId: authUser.userId,
      month,
    });

    if (!budgetDoc) {
      budgetDoc = await MonthBudget.create({
        userId: authUser.userId,
        month,
        budgetDzd: 65000,
        savingsGoalDzd: 10000,
        walletCounts: {
          '2000': 0,
          '1000': 0,
          '500': 0,
          '200': 0,
          '100': 0,
          '50': 0,
          '20': 0,
          '10': 0,
          '5': 0,
        },
      });
    }

    // Convert walletCounts Map or subdoc to plain object
    let walletCountsObj: Record<string, number> = {};
    if (budgetDoc.walletCounts instanceof Map) {
      budgetDoc.walletCounts.forEach((val, key) => {
        walletCountsObj[key] = Number(val) || 0;
      });
    } else if (budgetDoc.walletCounts && typeof budgetDoc.walletCounts === 'object') {
      walletCountsObj = { ...budgetDoc.walletCounts };
    }

    // Find all expenses for this user and month
    const expenses = await Expense.find({
      userId: authUser.userId,
      month,
    }).sort({ date: -1, createdAt: -1 });

    return NextResponse.json({
      month,
      budget: {
        budgetDzd: budgetDoc.budgetDzd,
        savingsGoalDzd: budgetDoc.savingsGoalDzd,
        walletCounts: walletCountsObj,
      },
      expenses: expenses.map((e) => ({
        id: e._id.toString(),
        amount: e.amount,
        category: e.category,
        note: e.note,
        date: e.date,
        createdAt: e.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching month data:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { month, budgetDzd, savingsGoalDzd } = await req.json();

    if (!month) {
      return NextResponse.json({ error: 'الشهر مطلوب' }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await MonthBudget.findOneAndUpdate(
      { userId: authUser.userId, month },
      {
        $set: {
          budgetDzd: Number(budgetDzd) || 0,
          savingsGoalDzd: Number(savingsGoalDzd) || 0,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: 'تم تحديث الميزانية بنجاح',
      budget: {
        budgetDzd: updated.budgetDzd,
        savingsGoalDzd: updated.savingsGoalDzd,
      },
    });
  } catch (error: any) {
    console.error('Error updating budget:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
