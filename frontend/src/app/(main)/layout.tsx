import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import { SidebarProvider } from '@/context/SidebarContext';
import styles from './layout.module.css';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className={styles.layoutContainer}>
        <Topbar />
        <div className={styles.contentWrapper}>
          <Sidebar />
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
