import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مصروفي DZ - حاسبة المصاريف الشهرية والسيولة النقدية الجزائرية',
  description: 'تطبيق لإدارة وحساب المصاريف الشهرية بالدينار الجزائري وحساب أوراق ونقود السيولة مع دعم كامل لكل مستخدم وقاعدة بيانات سحابية.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
