import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { MonthBudget } from '@/models/MonthBudget';
import { Expense } from '@/models/Expense';
import { signToken, setAuthCookie } from '@/lib/auth';
import { getDefaultMonthStr } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const currentMonth = getDefaultMonthStr();

    // Create initial budget for current month
    await MonthBudget.create({
      userId: user._id,
      month: currentMonth,
      budgetDzd: 65000,
      savingsGoalDzd: 10000,
      walletCounts: {
        '2000': 15,
        '1000': 12,
        '500': 10,
        '200': 8,
        '100': 5,
        '50': 4,
        '20': 5,
        '10': 5,
        '5': 0,
      },
    });

    // Create starter sample expenses for realistic first experience
    const sampleExpenses = [
      {
        userId: user._id,
        month: currentMonth,
        amount: 4200,
        category: 'groceries',
        note: 'قضيان أسبوعي (خضر، فواكه، لحوم)',
        date: `${currentMonth}-02`,
      },
      {
        userId: user._id,
        month: currentMonth,
        amount: 3400,
        category: 'bills',
        note: 'فاتورة الكهرباء والغاز (سونلغاز)',
        date: `${currentMonth}-04`,
      },
      {
        userId: user._id,
        month: currentMonth,
        amount: 1600,
        category: 'bills',
        note: 'اشتراك الإنترنت (اتصالات الجزائر)',
        date: `${currentMonth}-05`,
      },
      {
        userId: user._id,
        month: currentMonth,
        amount: 1500,
        category: 'transport',
        note: 'وقود السيارة وتنقلات',
        date: `${currentMonth}-07`,
      },
    ];
    await Expense.insertMany(sampleExpenses);

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
