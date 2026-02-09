import React, { ReactNode, useState } from 'react';
import { AdminSidebar } from '@/modules/admin/components/AdminSidebar';
import { AdminHeader } from '@/modules/admin/components/AdminHeader';
import Link from 'next/link';
import AdminRoute from '@/components/AdminRoute';

interface AdminLayoutProps {
    children: ReactNode;
    headerTitle?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <AdminRoute>
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
        </AdminRoute>
    );
}
