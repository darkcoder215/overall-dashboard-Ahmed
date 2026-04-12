'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarHidden = isEmbedded || isMobile;

  return (
    <div className="flex min-h-screen">
      <Sidebar hidden={sidebarHidden} />
      <main className={`flex-1 transition-all duration-300 ${sidebarHidden ? 'mr-0' : 'mr-[260px]'}`}>
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
