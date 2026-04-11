import type { Metadata } from 'next';
import './globals.css';
import ApiShimProvider from '@/components/providers/ApiShimProvider';

export const metadata: Metadata = {
  title: 'ثمانية - أداة تحليل البودكاست',
  description: 'منصة تحليل وتقسيم محتوى البودكاست بالذكاء الاصطناعي',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-brand-offwhite">
        <ApiShimProvider>{children}</ApiShimProvider>
      </body>
    </html>
  );
}
