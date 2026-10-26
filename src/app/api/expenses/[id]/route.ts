import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { id } = await params;
    const { amount, category, note, date } = await req.json();

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'يرجى إدخال مبلغ صحيح' }, { status: 400 });
    }

    await connectToDatabase();

    const updateData: any = {
      amount: parsedAmount,
      category: category || 'other',
      note: (note || '').trim(),
    };

    if (date) {
      updateData.date = date;
      updateData.month = date.substring(0, 7);
    }

    const updated = await Expense.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'المصروف غير موجود أو لا تملك الصلاحية لتعديله' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'تم تعديل المصروف بنجاح',
      expense: {
        id: updated._id.toString(),
        amount: updated.amount,
        category: updated.category,
        note: updated.note,
        date: updated.date,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const deleted = await Expense.findOneAndDelete({
      _id: id,
      userId: authUser.userId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'المصروف غير موجود أو تم حذفه مسبقاً' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'تم حذف المصروف بنجاح',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
