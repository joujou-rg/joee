import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { MonthBudget } from '@/models/MonthBudget';
import { getDefaultMonthStr } from '@/lib/constants';

export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { month, walletCounts } = await req.json();
    const targetMonth = month || getDefaultMonthStr();

    if (!walletCounts || typeof walletCounts !== 'object') {
      return NextResponse.json({ error: 'بيانات المحفظة غير صالحة' }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await MonthBudget.findOneAndUpdate(
      { userId: authUser.userId, month: targetMonth },
      {
        $set: {
          walletCounts,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: 'تم حفظ حساب السيولة في قاعدة البيانات بنجاح',
      walletCounts: updated.walletCounts,
    });
  } catch (error: any) {
    console.error('Wallet update error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
