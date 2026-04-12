import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "تحليل المرشحين | ثمانية",
  description: "منصة تحليل السير الذاتية ومقاطع الفيديو للمرشحين بالذكاء الاصطناعي — اتخذ القرار الصحيح",
  icons: { icon: "/thamanyah.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-thmanyah-off-white text-thmanyah-black antialiased">
        {children}
      </body>
    </html>
  );
}
