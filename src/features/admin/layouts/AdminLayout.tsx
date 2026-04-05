import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore'; // Use the same store as Login
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import { cn } from '../../../utils/cn';
import { GlobalConfirmModal } from '@/components/common/GlobalConfirmModal';
import { NotificationToast } from '../../../modules/notifications/components/NotificationToast';

interface AdminLayoutProps {
  children: ReactNode;
  headerTitle?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, isLoading: loading } = useAuthStore(); // Map isLoading to loading for compatibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Only redirect if NOT loading and user data is settled
    if (!loading && user !== undefined) {
      if (!user) {
        console.log('⛔ AdminLayout: No User. Redirecting to Login.');
        router.replace('/login');
      } else if (user.role !== 'admin' && user.role !== 'owner' && user.email !== 'boonyanone@gmail.com') {
        console.log('⛔ AdminLayout: Unauthorized Role (' + user.role + '). Redirecting to Home.');
        router.replace('/');
      } else {
        console.log('✅ AdminLayout: Access Granted (' + user.email + ')');
      }
    }
  }, [user, loading, router]);

  // 🛡️ STABILITY FIX: Only show full-screen loader on INITIAL load (where user is missing)
  // Don't unmount the whole layout just because of a background 'loading' refresh
  if (loading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>

        {/* Debug Info (Visible after 2s) */}
        <div className="animate-in fade-in delay-1000 duration-1000 mt-8 p-4 bg-gray-100 rounded-lg text-xs font-mono text-left max-w-md border border-gray-300">
          <p className="font-bold text-gray-500 mb-2">Debug Info (Developer Use):</p>
          <p>Loading: {loading ? 'YES' : 'NO'}</p>
          <div className="flex flex-col text-[10px] text-gray-400 font-mono opacity-50">
          <span>DEBUG: {(user as any)?.email || '-'}</span>
          <span>ROLE: {(user as any)?.role || '-'}</span>
          <span>UID: {(user as any)?.uid || '-'}</span>
        </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => router.push('/login')} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              บังคับเข้าสู่ระบบ
            </button>
            <button onClick={() => window.location.reload()} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
              รีโหลด
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-foreground selection:bg-primary selection:text-white">
      {/* Sidebar (Desktop: Fixed 72px) - Wait, sidebar width is 72 (18rem) or 64 (16rem)? In Sidebar component I used w-72 (18rem/288px) */}
      <AdminSidebar isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        "lg:ml-64" // Match sidebar width
      )}>
        <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>

        <footer className="mt-auto py-6 text-center border-t border-border bg-background/50 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} YouOke. All rights reserved. {" "}
            <span className="text-xs opacity-50 ml-1 font-mono">v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
          </p>
        </footer>
        <NotificationToast />
      </div>
    </div>
  );
}
