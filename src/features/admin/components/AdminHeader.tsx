import {
    Bell,
    Search,
    Settings,
    ChevronDown,
    Menu,
    LogOut
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import React from "react";
import { useAdminNotifications } from "../hooks/useAdminNotifications";

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { notifications, unreadCount } = useAdminNotifications();

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'เมื่อสักครู่';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        const days = Math.floor(hours / 24);
        return `${days} วันที่แล้ว`;
    };

    const handleLogout = async () => {
        if (!window.confirm('ยืนยันออกจากระบบ?')) return;
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-6 shadow-sm transition-all duration-300">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-900 rounded-md transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu className="h-6 w-6" />
                </button>

                <div className="relative w-64 lg:w-96 hidden md:block group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="search"
                        placeholder="ค้นหา (Command + K)..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 pointer-events-none">
                        <kbd className="kbd kbd-sm h-5 min-h-0 bg-white border border-gray-200 text-[10px] text-gray-400 font-mono">⌘</kbd>
                        <kbd className="kbd kbd-sm h-5 min-h-0 bg-white border border-gray-200 text-[10px] text-gray-400 font-mono">K</kbd>
                    </div>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <div className="indicator">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="badge badge-xs badge-primary indicator-item border-white animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </label>
                    <div tabIndex={0} className="dropdown-content z-[1] card card-compact w-80 p-0 shadow-xl bg-white border border-gray-100 mt-2 rounded-xl animate-in zoom-in-95 duration-200">
                        <div className="card-body p-0">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-semibold text-gray-900 text-sm">การแจ้งเตือน</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        {unreadCount} รายการใหม่
                                    </span>
                                )}
                            </div>
                            <div className="max-h-[320px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notif) => (
                                            <Link 
                                                key={notif.id} 
                                                href={notif.link}
                                                className="flex flex-col gap-1 p-4 hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap pt-0.5">
                                                        {notif.timestamp ? timeAgo(notif.timestamp.toDate()) : 'เมื่อสักครู่'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="font-medium">ยังไม่มีการแจ้งเตือนใหม่</p>
                                    </div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t border-gray-100">
                                    <Link 
                                        href="/admin/payments" 
                                        className="btn btn-ghost btn-sm w-full text-primary hover:bg-primary/5 rounded-lg normal-case font-bold"
                                    >
                                        ดูทั้งหมด
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Menu Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 px-1 hover:bg-gray-100 border-none normal-case h-auto py-1 flex items-center rounded-full pr-3 transition-colors">
                        <div className="avatar placeholder ring-2 ring-white ring-offset-2 ring-offset-gray-100 rounded-full">
                            <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-primary/20">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-white">{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                                )}
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-start gap-0.5 text-left ml-1.5">
                            <span className="text-sm font-semibold text-gray-900 leading-none">{user?.displayName || 'Admin'}</span>
                            <span className="text-[10px] text-gray-500 leading-none font-medium">ผู้ดูแลระบบ</span>
                        </div>
                        <ChevronDown className="h-3 w-3 text-gray-400 ml-1 hidden md:block" />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-xl w-60 border border-gray-100 mt-2 animate-in zoom-in-95 duration-200">
                        <li className="menu-title px-3 py-2 border-b border-gray-100 mb-1">
                            <span className="text-gray-900 font-bold block p-0 text-sm">บัญชีผู้ใช้</span>
                            <span className="text-xs text-gray-500 font-normal block lowercase p-0 mt-0.5 truncate">{user?.email}</span>
                        </li>
                        <li className="mt-1">
                            <Link href="/admin/config" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg py-2 font-medium">
                                <Settings className="h-4 w-4" /> ตั้งค่าระบบ
                            </Link>
                        </li>
                        <div className="divider my-1 border-gray-100 h-px p-0"></div>
                        <li>
                            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 rounded-lg py-2 font-medium">
                                <LogOut className="h-4 w-4" /> ออกจากระบบ
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};
