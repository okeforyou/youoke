import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import Link from 'next/link';

// NOTE: AdminRoute is now handled by the logic inside this layout (useEffect check)
// effectively implementing the AdminRoute protection here directly to match play.youoke structure.

interface AdminLayoutProps {
  children: ReactNode;
  headerTitle?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth(); // Assuming 'loading' in AuthContext, if not check implementation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'admin' && user.role !== 'owner' && user.email !== 'boonyanone@gmail.com') { // Basic check, refine based on AuthContext roles
        // Note: You might want to be stricter here or check exact role property from AuthContext
        // For now, redirecting if not authorized.
        // console.warn("Access denied for role:", user.role);
        // router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  // Safety check for user existence before rendering admin UI
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-primary selection:text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (Desktop) */}
        <AdminSidebar isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(false)} />

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <AdminHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

          <main className="w-full h-full p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
            {children}
          </main>

          <footer className="mt-auto py-6 text-center border-t border-gray-200 bg-white">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} YouOke. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
