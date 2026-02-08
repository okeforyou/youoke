import React, { ReactNode } from "react";
import { AdminSidebar } from "@/modules/admin/components/AdminSidebar";
import { AdminHeader } from "@/modules/admin/components/AdminHeader";

interface AdminLayoutProps {
    children?: ReactNode;
    headerTitle?: string;
}

const AdminLayout = ({ children, headerTitle }: AdminLayoutProps) => {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {/* Sidebar - Fixed Left */}
            <AdminSidebar />

            {/* Main Content - Offset by Sidebar */}
            <div className="ml-64 transition-all duration-300">
                <AdminHeader />

                <main className="p-6 md:p-8 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
