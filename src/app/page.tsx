'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Coins,
  BarChart3,
  Plus,
  Trash2,
  Edit2,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Receipt,
  PiggyBank,
  TrendingDown,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  CATEGORIES,
  DENOMINATIONS,
  formatNum,
  dzdToAlgerianCentimeText,
  getDefaultMonthStr,
  getTodayDateStr,
} from '@/lib/constants';

interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Month & Data state
  const [currentMonth, setCurrentMonth] = useState<string>('2026-10');
  const [budgetDzd, setBudgetDzd] = useState<number>(65000);
  const [savingsGoalDzd, setSavingsGoalDzd] = useState<number>(10000);
  const [walletCounts, setWalletCounts] = useState<Record<string, number>>({
    '2000': 0, '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0,
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI Navigation Tabs: 'expenses' | 'wallet' | 'analytics'
  const [activeTab, setActiveTab] = useState<'expenses' | 'wallet' | 'analytics'>('expenses');

  // Expense form state
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('groceries');
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('2026-10-26');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    setCurrentMonth(getDefaultMonthStr());
    setExpenseDate(getTodayDateStr());
  }, []);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Quick Banknote Tapper Tray
  const [tappedNotesStack, setTappedNotesStack] = useState<number[]>([]);

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState(65000);
  const [tempSavings, setTempSavings] = useState(10000);
  const [savingBudget, setSavingBudget] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingExpense, setDeletingExpense] = useState(false);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);

  // Logout modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Fetch month data when user or month changes
  const fetchMonthData = useCallback(async (month: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/month?month=${month}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('فشل جلب البيانات');
      }
      const data = await res.json();
      setBudgetDzd(data.budget?.budgetDzd || 65000);
      setSavingsGoalDzd(data.budget?.savingsGoalDzd || 10000);
      setTempBudget(data.budget?.budgetDzd || 65000);
      setTempSavings(data.budget?.savingsGoalDzd || 10000);

      const counts = data.budget?.walletCounts || {};
      const newCounts: Record<string, number> = {};
      ['2000', '1000', '500', '200', '100', '50', '20', '10', '5'].forEach((denom) => {
        newCounts[denom] = Number(counts[denom]) || 0;
      });
      setWalletCounts(newCounts);

      setExpenses(data.expenses || []);
    } catch (err: any) {
      showToast(err.message || 'تعذر تحميل بيانات الشهر');
    } finally {
      setLoadingData(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    if (user) {
      fetchMonthData(currentMonth);
    }
  }, [user, currentMonth, fetchMonthData]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonthStr);
  };

  // Calculations
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const remainingBudget = budgetDzd - totalExpenses;
  const budgetProgress = budgetDzd > 0 ? Math.min(100, Math.round((totalExpenses / budgetDzd) * 100)) : 0;

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    Object.keys(CATEGORIES).forEach((k) => (map[k] = 0));
    expenses.forEach((item) => {
      const cat = item.category in CATEGORIES ? item.category : 'other';
      map[cat] = (map[cat] || 0) + (Number(item.amount) || 0);
    });
    return map;
  }, [expenses]);

  const topCategory = useMemo(() => {
    let max = -1;
    let topKey = 'other';
    Object.entries(categoryTotals).forEach(([k, total]) => {
      if (total > max && total > 0) {
        max = total;
        topKey = k;
      }
    });
    return max > 0 ? { key: topKey, ...CATEGORIES[topKey], total: max } : null;
  }, [categoryTotals]);

  // Total cash in wallet counter
  const totalCashWalletDzd = useMemo(() => {
    let sum = 0;
    Object.entries(walletCounts).forEach(([denom, count]) => {
      sum += (Number(denom) || 0) * (Number(count) || 0);
    });
    return sum;
  }, [walletCounts]);

  // Quick Tapper total
  const quickTapTotalDzd = useMemo(() => {
    return tappedNotesStack.reduce((sum, val) => sum + val, 0);
  }, [tappedNotesStack]);

  const handleTapBanknote = (value: number) => {
    setTappedNotesStack((prev) => [...prev, value]);
  };

  const handleApplyQuickTapToInput = () => {
    if (quickTapTotalDzd > 0) {
      setExpenseAmount(String(quickTapTotalDzd));
      setTappedNotesStack([]);
      showToast(`تم إدراج ${formatNum(quickTapTotalDzd)} د.ج في خانة المبلغ`);
    }
  };

  // Save or Update Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    setSavingExpense(true);
    try {
      if (editingExpenseId) {
        // Update
        const res = await fetch(`/api/expenses/${editingExpenseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountNum,
            category: expenseCategory,
            note: expenseNote,
            date: expenseDate,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل التعديل');

        setExpenses((prev) =>
          prev.map((item) => (item.id === editingExpenseId ? data.expense : item))
        );
        showToast('تم تعديل المصروف بنجاح');
        setEditingExpenseId(null);
      } else {
        // Create
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountNum,
            category: expenseCategory,
            note: expenseNote,
            date: expenseDate,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشلت الإضافة');

        setExpenses((prev) => [data.expense, ...prev]);
        showToast('تم تسجيل المصروف في قاعدة البيانات بنجاح');
      }

      setExpenseAmount('');
      setExpenseNote('');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ المصروف');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleStartEditExpense = (item: ExpenseItem) => {
    setEditingExpenseId(item.id);
    setExpenseAmount(String(item.amount));
    setExpenseCategory(item.category);
    setExpenseNote(item.note);
    setExpenseDate(item.date);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setExpenseAmount('');
    setExpenseNote('');
    setExpenseDate(getTodayDateStr());
  };

  const handleDeleteExpense = async () => {
    if (!deleteConfirmId) return;
    setDeletingExpense(true);
    try {
      const res = await fetch(`/api/expenses/${deleteConfirmId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');

      setExpenses((prev) => prev.filter((item) => item.id !== deleteConfirmId));
      showToast('تم حذف المصروف بنجاح');
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingExpense(false);
    }
  };

  // Save Budget Modal
  const handleSaveBudget = async () => {
    setSavingBudget(true);
    try {
      const res = await fetch('/api/month', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          budgetDzd: tempBudget,
          savingsGoalDzd: tempSavings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الميزانية');

      setBudgetDzd(tempBudget);
      setSavingsGoalDzd(tempSavings);
      setIsBudgetModalOpen(false);
      showToast('تم تحديث ميزانية الشهر بنجاح');
    } catch (err: any) {
      showToast(err.message || 'تعذر حفظ الميزانية');
    } finally {
      setSavingBudget(false);
    }
  };

  // Wallet counts modification
  const handleUpdateWalletCount = (denom: number, delta: number) => {
    setWalletCounts((prev) => {
      const current = prev[String(denom)] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [String(denom)]: next };
    });
  };

  const handleDirectWalletCount = (denom: number, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setWalletCounts((prev) => ({ ...prev, [String(denom)]: num }));
  };

  // Save wallet to MongoDB
  const handleSaveWalletToDatabase = async () => {
    setSavingWallet(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          walletCounts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ السيولة');

      showToast('تم حفظ كميات السيولة النقدية في قاعدة البيانات MongoDB بنجاح!');
    } catch (err: any) {
      showToast(err.message || 'تعذر حفظ السيولة');
    } finally {
      setSavingWallet(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('تم تسجيل الخروج بنجاح');
      router.push('/login');
      router.refresh();
    } catch {
      showToast('تعذر تسجيل الخروج');
      setLoggingOut(false);
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `masroufi_backup_${user?.name || 'user'}_${currentMonth}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تنزيل النسخة الاحتياطية لبياناتك بنجاح');
      setIsBackupModalOpen(false);
    } catch {
      showToast('تعذر تصدير النسخة الاحتياطية');
    }
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.amount).includes(searchQuery);

      const matchesCat = filterCategory === 'all' || item.category === filterCategory;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, filterCategory]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300">جاري الاتصال بقاعدة بيانات مصروفي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-xl border-b border-emerald-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & User Greeting */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight">مصروفي DZ</h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold">
                    MongoDB Cloud
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">
                  مرحباً، <span className="font-bold text-white">{user?.name}</span>
                </p>
              </div>
            </div>

            {/* Mobile Actions: Budget & Logout */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="الميزانية"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 border border-rose-400/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-white/90 hover:text-white"
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="w-4 h-4 text-emerald-300" />
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
                className="bg-transparent text-white font-black text-sm tracking-wide focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-white/90 hover:text-white"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Header Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/15 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-300" />
              <span>ضبط الميزانية</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/15 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>نسخة احتياطية</span>
            </button>

            {/* Prominent Desktop Logout Button */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-rose-900/30 border border-rose-400/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* 4 Primary KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Remaining Budget */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">الرصيد المتبقي</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black ${remainingBudget < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatNum(remainingBudget)}
              </span>
              <span className="text-xs font-bold text-slate-500">د.ج</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700 mt-1 truncate">
              {dzdToAlgerianCentimeText(remainingBudget)}
            </div>

            {/* Budget Progress Bar */}
            <div className="mt-3.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>استهلاك الميزانية</span>
                <span>{budgetProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    budgetProgress > 90
                      ? 'bg-rose-500'
                      : budgetProgress > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Total Spent */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">إجمالي المصاريف</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-rose-600">
                {formatNum(totalExpenses)}
              </span>
              <span className="text-xs font-bold text-slate-500">د.ج</span>
            </div>
            <div className="text-xs font-semibold text-rose-700 mt-1 truncate">
              {dzdToAlgerianCentimeText(totalExpenses)}
            </div>
            <div className="mt-3.5 text-[11px] font-bold text-slate-500">
              عدد العمليات: <span className="text-slate-900">{expenses.length} مصروف</span>
            </div>
          </div>

          {/* Card 3: Savings Goal */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">هدف الادخار</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatNum(savingsGoalDzd)}
              </span>
              <span className="text-xs font-bold text-slate-500">د.ج</span>
            </div>
            <div className="text-xs font-semibold text-blue-700 mt-1 truncate">
              {dzdToAlgerianCentimeText(savingsGoalDzd)}
            </div>
            <div className="mt-3.5 text-[11px] font-bold text-slate-500">
              الميزانية المحددة: <span className="text-slate-900">{formatNum(budgetDzd)} د.ج</span>
            </div>
          </div>

          {/* Card 4: Top Spending Category */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">أعلى فئة استهلاك</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                {topCategory ? topCategory.icon : '📊'}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {topCategory ? topCategory.label : 'لا توجد مصاريف'}
            </div>
            <div className="text-xs font-semibold text-amber-700 mt-1">
              {topCategory ? `${formatNum(topCategory.total)} د.ج` : '0 د.ج'}
            </div>
            <div className="mt-3.5 text-[11px] font-bold text-slate-500 truncate">
              {topCategory ? dzdToAlgerianCentimeText(topCategory.total) : 'ابدأ بإضافة المصاريف'}
            </div>
          </div>

        </section>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>المصاريف واليوميات</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'wallet'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>عدّاد السيولة (نقود DZ)</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>الإحصائيات</span>
          </button>
        </div>

        {/* TAB 1: EXPENSES & QUICK CASH TAPPER */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">

            {/* Quick Banknote Tap Drawer */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ميزة النقر السريع على الأوراق النقدية الجزائريّة</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    انقر على النقود لحساب المجموع التلقائي ووضعه فوراً في خانة المبلغ
                  </p>
                </div>

                {quickTapTotalDzd > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApplyQuickTapToInput}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ضع في خانة المبلغ ({formatNum(quickTapTotalDzd)} د.ج)</span>
                    </button>
                    <button
                      onClick={() => setTappedNotesStack([])}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                      title="مسح"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Banknotes Quick Tap Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {[2000, 1000, 500, 200, 100, 50].map((val) => {
                  const denomItem = DENOMINATIONS.find((d) => d.value === val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleTapBanknote(val)}
                      className={`banknote-card p-3 rounded-2xl bg-gradient-to-r ${
                        denomItem?.gradient || 'from-slate-800 to-slate-700'
                      } text-white shadow-md hover:shadow-lg flex flex-col justify-between items-start border border-white/20 cursor-pointer h-20`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base font-black tracking-tight">{val}</span>
                        <span className="text-[10px] font-bold opacity-80">د.ج</span>
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-200 opacity-90 truncate w-full">
                        {denomItem?.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tapped Stack Indicator */}
              {tappedNotesStack.length > 0 && (
                <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-emerald-900">
                    <span>النقود المنقورة ({tappedNotesStack.length}):</span>
                    {tappedNotesStack.slice(-8).map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 text-[11px]"
                      >
                        +{formatNum(v)}
                      </span>
                    ))}
                    {tappedNotesStack.length > 8 && (
                      <span className="text-slate-500">+{tappedNotesStack.length - 8} أخرى</span>
                    )}
                  </div>
                  <div className="text-sm font-black text-emerald-800 shrink-0">
                    المجموع: {formatNum(quickTapTotalDzd)} د.ج
                  </div>
                </div>
              )}
            </div>

            {/* Two Columns: Add Expense Form & Expenses List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Column 1: Add / Edit Expense Form (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 h-fit sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span>{editingExpenseId ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</span>
                  </h3>
                  {editingExpenseId && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>إلغاء التعديل</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveExpense} className="space-y-4">
                  {/* Amount Input with Centime preview */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المبلغ بالدينار الجزائري (د.ج) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        placeholder="مثال: 4500"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-black text-slate-900 transition-all"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        د.ج
                      </span>
                    </div>

                    {/* Dynamic Algerian Centime conversion label */}
                    {Number(expenseAmount) > 0 && (
                      <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>بالسنتيم: {dzdToAlgerianCentimeText(Number(expenseAmount))}</span>
                      </div>
                    )}
                  </div>

                  {/* Category Selector Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      فئة المصروف *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(CATEGORIES).map(([key, info]) => {
                        const isSelected = expenseCategory === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setExpenseCategory(key)}
                            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span className="text-lg">{info.icon}</span>
                            <span className="truncate w-full text-center text-[11px]">{info.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تاريخ المصروف
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-slate-800"
                    />
                  </div>

                  {/* Note / Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظة أو وصف (اختياري)
                    </label>
                    <input
                      type="text"
                      value={expenseNote}
                      onChange={(e) => setExpenseNote(e.target.value)}
                      placeholder="مثال: قضيان خضر ولحوم من السوق"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={savingExpense}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {savingExpense ? (
                      <span>جاري الحفظ في MongoDB...</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{editingExpenseId ? 'تحديث المصروف' : 'تسجيل المصروف في السحابة'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Column 2: Expenses List & Filters (7 cols) */}
              <div className="lg:col-span-7 space-y-4">

                {/* Search & Filter Header */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث في المصاريف والملاحظات..."
                      className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">جميع الفئات ({expenses.length})</option>
                    {Object.entries(CATEGORIES).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expenses List Cards */}
                {loadingData ? (
                  <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200/80">
                    جاري تحميل مصاريف الشهر...
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">لا توجد مصاريف مسجلة لهذا الشهر</p>
                    <p className="text-xs text-slate-400">
                      استخدم النموذج على اليمين لإضافة أول مصروف في شهر {currentMonth}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredExpenses.map((item) => {
                      const catInfo = CATEGORIES[item.category] || CATEGORIES.other;
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Icon badge */}
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${catInfo.badgeBg} ${catInfo.badgeBorder} border`}>
                              {catInfo.icon}
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${catInfo.badgeBg} ${catInfo.badgeText}`}>
                                  {catInfo.label}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {item.date}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
                                {item.note || 'بدون ملاحظة'}
                              </p>
                            </div>
                          </div>

                          {/* Amount and Action buttons */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-left">
                              <div className="text-sm sm:text-base font-black text-slate-900">
                                {formatNum(item.amount)}{' '}
                                <span className="text-[11px] font-bold text-slate-400">د.ج</span>
                              </div>
                              <div className="text-[10px] font-semibold text-emerald-700">
                                {dzdToAlgerianCentimeText(item.amount)}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStartEditExpense(item)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                                title="تعديل"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ALGERIAN CURRENCY FULL WALLET COUNTER */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">

            {/* Wallet Total Banner */}
            <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-300">
                  إجمالي السيولة النقدية المحسوبة في المحفظة
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black">
                    {formatNum(totalCashWalletDzd)}
                  </span>
                  <span className="text-sm font-bold text-emerald-200">دينار جزائري</span>
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-1">
                  {dzdToAlgerianCentimeText(totalCashWalletDzd)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveWalletToDatabase}
                  disabled={savingWallet}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingWallet ? 'جاري الحفظ في MongoDB...' : 'حفظ السيولة في السحابة'}</span>
                </button>
              </div>
            </div>

            {/* Denomination Counter Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DENOMINATIONS.map((denom) => {
                const count = walletCounts[String(denom.value)] || 0;
                const subtotal = count * denom.value;

                return (
                  <div
                    key={denom.value}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    {/* Card Top: Visual representation */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {/* Coin or Banknote Graphic */}
                        {denom.isCoin ? (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-sm shadow-md shrink-0 ${
                            denom.value === 100
                              ? 'bimetallic-100 text-slate-900 border-2 border-amber-600'
                              : denom.value === 200
                              ? 'bimetallic-200 text-slate-900 border-2 border-amber-700'
                              : denom.value === 50
                              ? 'bimetallic-50 text-slate-900 border-2 border-amber-700'
                              : denom.value === 20
                              ? 'bimetallic-20 text-slate-900 border-2 border-amber-600'
                              : 'bimetallic-10 text-slate-900 border-2 border-amber-600'
                          }`}>
                            {denom.value}
                          </div>
                        ) : (
                          <div className={`w-20 h-12 rounded-xl bg-gradient-to-r ${denom.gradient} text-white p-2 flex flex-col justify-between banknote-pattern shadow-md shrink-0 relative overflow-hidden border border-white/20`}>
                            <div className="hologram-strip absolute left-2 top-0 bottom-0 w-2.5 opacity-60" />
                            <span className="text-xs font-black self-end">{denom.value}</span>
                            <span className="text-[9px] font-bold opacity-80">د.ج</span>
                          </div>
                        )}

                        <div>
                          <div className="text-base font-black text-slate-900">
                            {denom.title}
                          </div>
                          <div className="text-xs font-semibold text-emerald-700">
                            {denom.subtitle}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {denom.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Counter Controls */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateWalletCount(denom.value, -1)}
                          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-base flex items-center justify-center active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count}
                          onChange={(e) => handleDirectWalletCount(denom.value, e.target.value)}
                          className="w-16 h-9 rounded-xl border border-slate-200 text-center font-black text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateWalletCount(denom.value, 1)}
                          className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black text-base flex items-center justify-center active:scale-95 transition-all"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateWalletCount(denom.value, 5)}
                          className="px-2 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center active:scale-95 transition-all"
                        >
                          +5
                        </button>
                      </div>

                      <div className="text-left shrink-0">
                        <div className="text-xs font-bold text-slate-400">المجموع</div>
                        <div className="text-sm font-black text-slate-900">
                          {formatNum(subtotal)} <span className="text-[10px] text-slate-500">د.ج</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 3: ANALYTICS & INSIGHTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {/* Overview Insights Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">معدل الصرف اليومي التقريبي</span>
                <div className="text-2xl font-black text-slate-900">
                  {formatNum(Math.round(totalExpenses / 30))} د.ج / يوم
                </div>
                <p className="text-xs text-slate-500">
                  بناءً على إجمالي {formatNum(totalExpenses)} د.ج لشهر {currentMonth}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">حالة الادخار المستهدف</span>
                <div className="text-2xl font-black text-emerald-700">
                  {remainingBudget >= savingsGoalDzd ? '✅ تم تحقيق الهدف' : '⚠️ تحت الهدف المطلوب'}
                </div>
                <p className="text-xs text-slate-500">
                  الفارق: {formatNum(Math.abs(remainingBudget - savingsGoalDzd))} د.ج
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">نسبة الادخار من الدخل</span>
                <div className="text-2xl font-black text-blue-700">
                  {budgetDzd > 0 ? Math.round((savingsGoalDzd / budgetDzd) * 100) : 0}%
                </div>
                <p className="text-xs text-slate-500">
                  موصى بها وفق خطة 50/30/20 المالية
                </p>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span>توزيع المصاريف حسب الفئات لهذا الشهر</span>
              </h3>

              <div className="space-y-3.5 pt-2">
                {Object.entries(CATEGORIES).map(([key, info]) => {
                  const catSum = categoryTotals[key] || 0;
                  const catPercent = totalExpenses > 0 ? Math.round((catSum / totalExpenses) * 100) : 0;

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{info.icon}</span>
                          <span className="text-slate-800">{info.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-semibold">{catPercent}%</span>
                          <span className="text-slate-900 font-black">{formatNum(catSum)} د.ج</span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${catPercent}%`,
                            backgroundColor: info.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* User Account Info & Quick Logout Strip */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">
                الحساب النشط: {user?.name}
              </div>
              <div className="text-xs text-slate-500 font-medium" dir="ltr">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          </div>
        </section>

      </main>

      {/* MODAL 1: SET BUDGET & SAVINGS */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                <span>ضبط ميزانية شهر {currentMonth}</span>
              </h3>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الميزانية الشهرية المقدرة (الدخل أو المخصص) بالدينار
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-xs font-semibold text-emerald-700 mt-1">
                  {dzdToAlgerianCentimeText(tempBudget)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  هدف الادخار الشهري بالدينار
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={tempSavings}
                  onChange={(e) => setTempSavings(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-xs font-semibold text-blue-700 mt-1">
                  {dzdToAlgerianCentimeText(tempSavings)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveBudget}
                disabled={savingBudget}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingBudget ? 'جاري الحفظ...' : 'حفظ الميزانية'}</span>
              </button>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">تأكيد حذف المصروف</h4>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من رغبتك في حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDeleteExpense}
                disabled={deletingExpense}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {deletingExpense ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BACKUP / DATA EXPORT */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-teal-600" />
                <span>النسخة الاحتياطية وإدارة البيانات</span>
              </h3>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              جميع بياناتك مخزنة بأمان في قاعدة بيانات MongoDB السحابية. يمكنك تصدير نسخة كاملة بصيغة JSON للاحتفاظ بها على جهازك في أي وقت.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير نسخة احتياطية كاملة (JSON)</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LOGOUT CONFIRMATION */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">تسجيل الخروج</h4>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من رغبتك في تسجيل الخروج من حساب <span className="font-bold text-slate-800">{user?.name}</span>؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-70"
              >
                {loggingOut ? 'جاري الخروج...' : 'تأكيد تسجيل الخروج'}
              </button>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold z-50 flex items-center gap-2.5 border border-white/20 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
