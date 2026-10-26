export interface CategoryInfo {
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  groceries: {
    label: 'مواد غذائية وخضر',
    icon: '🛒',
    color: '#10b981',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
  },
  bills: {
    label: 'فواتير وإنترنت',
    icon: '⚡',
    color: '#3b82f6',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
  },
  transport: {
    label: 'نقل ووقود',
    icon: '🚕',
    color: '#f59e0b',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
  },
  housing: {
    label: 'كراء وسكن',
    icon: '🏠',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
  },
  dining: {
    label: 'مقاهي ومطاعم',
    icon: '☕',
    color: '#ec4899',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/40',
    badgeText: 'text-pink-700 dark:text-pink-300',
    badgeBorder: 'border-pink-200 dark:border-pink-800',
  },
  health: {
    label: 'صحة وأدوية',
    icon: '🏥',
    color: '#ef4444',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
  },
  shopping: {
    label: 'ملابس ومشتريات',
    icon: '👕',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
  },
  education: {
    label: 'دراسة وأبناء',
    icon: '📚',
    color: '#6366f1',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  other: {
    label: 'مصاريف أخرى',
    icon: '🎁',
    color: '#64748b',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
  },
};

export interface DenominationItem {
  value: number;
  type: 'ورقة نقدية' | 'قطعة نقدية' | 'ورقة / قطعة';
  title: string;
  subtitle: string;
  gradient: string;
  isCoin?: boolean;
}

export const DENOMINATIONS: DenominationItem[] = [
  { value: 2000, type: 'ورقة نقدية', title: '2000 د.ج', subtitle: '200 ألف سنتيم', gradient: 'from-indigo-900 to-blue-800', isCoin: false },
  { value: 1000, type: 'ورقة نقدية', title: '1000 د.ج', subtitle: '100 ألف سنتيم', gradient: 'from-rose-900 to-amber-800', isCoin: false },
  { value: 500,  type: 'ورقة نقدية', title: '500 د.ج',  subtitle: '50 ألف سنتيم',  gradient: 'from-emerald-900 to-teal-800', isCoin: false },
  { value: 200,  type: 'ورقة / قطعة', title: '200 د.ج',  subtitle: '20 ألف سنتيم',  gradient: 'from-amber-900 to-yellow-800', isCoin: false },
  { value: 100,  type: 'قطعة نقدية', title: '100 د.ج',  subtitle: '10 آلاف سنتيم', gradient: 'from-slate-800 to-amber-700', isCoin: true },
  { value: 50,   type: 'قطعة نقدية', title: '50 د.ج',   subtitle: '5 آلاف سنتيم',  gradient: 'from-amber-800 to-slate-700', isCoin: true },
  { value: 20,   type: 'قطعة نقدية', title: '20 د.ج',   subtitle: 'ألفا سنتيم',    gradient: 'from-slate-700 to-amber-600', isCoin: true },
  { value: 10,   type: 'قطعة نقدية', title: '10 د.ج',   subtitle: 'ألف سنتيم',     gradient: 'from-amber-700 to-slate-600', isCoin: true },
  { value: 5,    type: 'قطعة نقدية', title: '5 د.ج',    subtitle: '500 سنتيم',     gradient: 'from-slate-700 to-slate-600', isCoin: true },
];

export function formatNum(num: number | string): string {
  const n = Number(num) || 0;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function dzdToAlgerianCentimeText(dzd: number | string): string {
  const val = Math.round(Number(dzd) || 0);
  if (val === 0) return '0 سنتيم';
  const absVal = Math.abs(val);
  const sign = val < 0 ? 'ناقص ' : '';

  // 10,000 DZD = 1,000,000 Centimes (مليون سنتيم)
  // 10 DZD = 1,000 Centimes (ألف سنتيم)
  const millions = Math.floor(absVal / 10000);
  const remainderDzd = absVal % 10000;
  const thousandsCentimes = Math.floor(remainderDzd / 10);

  const parts: string[] = [];
  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونين');
    else if (millions >= 3 && millions <= 10) parts.push(`${millions} ملايين`);
    else parts.push(`${formatNum(millions)} مليون`);
  }

  if (thousandsCentimes > 0) {
    if (thousandsCentimes === 1) parts.push('ألف');
    else if (thousandsCentimes === 2) parts.push('ألفين');
    else parts.push(`${formatNum(thousandsCentimes)} ألف`);
  }

  const subTenDzd = remainderDzd % 10;
  if (subTenDzd > 0 && parts.length === 0) {
    return `${sign}${formatNum(absVal * 100)} سنتيم`;
  }

  if (parts.length === 0) {
    return `${sign}${formatNum(absVal * 100)} سنتيم`;
  }

  return `${sign}${parts.join(' و ')} سنتيم`;
}

export function getDefaultMonthStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
