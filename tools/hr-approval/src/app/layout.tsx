import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نموذج طلب فتح شاغر وظيفي | ثمانية",
  description: "منظومة اعتماد الشواغر الوظيفية — كل شاغر تفتحه هو قرار استثماري",
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
