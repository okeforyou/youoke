import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { AdminSidebar } from '@/modules/admin/components/AdminSidebar';
import { AdminHeader } from '@/modules/admin/components/AdminHeader';
import { Menu } from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
    children: ReactNode;
    headerTitle?: string; // Kept for capability, though V1 handles header title differently (inside page)
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
            }
            // Removed auto-redirect for non-admins to show Access Denied screen instead
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading Admin Panel...</p>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 max-w-md mb-6">
                    คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Current Role: <span className="font-mono font-bold">{user?.role || 'Guest'}</span>)
                    <br />กรุณาติดต่อผู้ดูแลระบบ หรือเข้าสู่ระบบด้วยบัญชี Admin
                </p>
                <div className="flex gap-4">
                    <Link href="/" className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        กลับหน้าหลัก
                    </Link>
                    <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-focus transition-colors">
                        สลับบัญชี
                    </Link>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-xs text-gray-400">UID: {user?.uid}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-white">
            {/* Sidebar (Desktop) */}
            <AdminSidebar />

            {/* Mobile Sidebar (Drawer-like) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-sidebar shadow-2xl animate-in slide-in-from-left duration-300">
                        <AdminSidebar />
                        <button
                            className="absolute top-4 right-4 text-sidebar-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-56 transition-all duration-300">
                <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

                <main className="p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {children}
                </main>

                <footer className="mt-auto py-6 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} YouOke. All rights reserved. •
                        <Link href="/changelog" className="ml-2 inline-flex items-center gap-1 hover:text-primary transition-colors font-mono text-xs">
                            v{require('../../package.json').version}
                        </Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
