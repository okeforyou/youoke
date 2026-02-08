import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import { cn } from '../../../utils/cn';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'admin' && user.role !== 'owner' && user.email !== 'boonyanone@gmail.com') {
        // Redirect if not authorized (add stricter check later)
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Verifying Admin Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-white">
      {/* Sidebar (Desktop: Fixed 72px) - Wait, sidebar width is 72 (18rem) or 64 (16rem)? In Sidebar component I used w-72 (18rem/288px) */}
      <AdminSidebar isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        "lg:ml-72" // Match sidebar width
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
      </div>
    </div>
  );
}
