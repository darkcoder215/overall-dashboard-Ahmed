'use client';

import { useState, useEffect } from 'react';
import { DataProvider, useData } from '@/context/DataContext';
import Sidebar from './Sidebar';
import LoadingBanner from './LoadingBanner';
import { AnimatePresence } from 'framer-motion';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useData();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const isEmbedded = window.self !== window.top;
    const checkLayout = () => setSidebarHidden(isEmbedded || window.innerWidth < 1024);
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingBanner />}
      </AnimatePresence>
      <div className={`min-h-screen bg-neutral-off-white transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {!sidebarHidden && <Sidebar />}
        <main className={`min-h-screen transition-all duration-300 ${sidebarHidden ? 'mr-0' : 'mr-[260px]'}`}>
          {children}
        </main>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <AppContent>{children}</AppContent>
    </DataProvider>
  );
}
