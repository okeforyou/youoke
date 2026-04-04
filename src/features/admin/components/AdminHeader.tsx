import {
    Bell,
    Search,
    Settings,
    ChevronDown,
    Menu,
    Megaphone,
    LogOut
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import React from "react";
import { AdminNotification, useAdminNotifications } from "../hooks/useAdminNotifications";
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from "@/modules/auth/useAuthStore";

export const SYSTEM_VERSION = "4.9.58";
export const SYSTEM_CODENAME = "Stable Standard Baseline";
export const SYSTEM_STATUS = "Stable";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (${SYSTEM_CODENAME})`;
export const BUILD_DATE = "4 เม.ย. 2569";

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
    const { user, logout } = useAuth();
    const { user: storeUser } = useAuthStore();
    const router = useRouter();
    const { notifications: adminNotifs, unreadCount: adminCount } = useAdminNotifications();
    const [userNotifs, setUserNotifs] = React.useState<AdminNotification[]>([]);
    const [userCount, setUserCount] = React.useState(0);

    // 📡 Listen for System/User Notifications
    React.useEffect(() => {
        if (!db || !storeUser?.uid) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', 'in', [storeUser.uid, 'all']),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: 'system_alert',
                    title: data.title || 'ประกาศจากระบบ',
                    message: data.body || '',
                    timestamp: data.createdAt,
                    link: '/profile/notifications',
                    read: data.read || false
                } as AdminNotification;
            });
            setUserNotifs(list);
            setUserCount(list.filter(n => !n.read).length);
        }, (err) => console.warn("⚠️ Notification Query Error:", err));

        return () => unsubscribe();
    }, [storeUser?.uid]);

    // Combine and Sort
    const allNotifications = [...adminNotifs, ...userNotifs].sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
    });

    const totalUnreadCount = adminCount + userCount;

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
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 transition-all duration-300">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-900 rounded-xl transition-colors active:scale-90"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </button>
 
                <div className="relative w-64 lg:w-80 hidden md:block group">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="search"
                        placeholder="Search..."
                        className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-transparent rounded-full text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-medium"
                    />
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
                {/* Unified Notifications Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label 
                        tabIndex={0} 
                        className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 group"
                    >
                        <div className="indicator">
                            <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
                            {totalUnreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 border-2 border-white rounded-full flex items-center justify-center z-10 animate-in zoom-in-50 duration-500">
                                    <span className="text-[10px] font-black text-white leading-none">
                                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                    </span>
                                </span>
                            )}
                        </div>
                    </label>
                    <div tabIndex={0} className="dropdown-content z-50 card card-compact w-80 p-0 bg-white border border-gray-100 mt-3 rounded-[24px] animate-in slide-in-from-top-2 duration-300">
                        <div className="card-body p-0">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[24px]">
                                <div>
                                    <h3 className="font-black text-gray-900 text-sm tracking-tight">ศูนย์ควบคุมแจ้งเตือน</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Unified Center</p>
                                </div>
                                {totalUnreadCount > 0 && (
                                    <span className="text-[11px] bg-red-600 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-tighter border border-white/20">
                                        {totalUnreadCount} NEW
                                    </span>
                                )}
                            </div>

                            {/* List Component (Unified Admin & User Tasks) */}
                            <div className="max-h-[380px] overflow-y-auto scrollbar-hide py-2">
                                {allNotifications.length > 0 ? (
                                    <div className="px-2 space-y-1">
                                        {allNotifications.map((notif) => (
                                            <Link 
                                                key={notif.id} 
                                                href={notif.link}
                                                className="flex flex-col gap-1 p-3.5 hover:bg-gray-50/80 rounded-2xl transition-all group relative border border-transparent hover:border-gray-100"
                                            >
                                                {!notif.read && (
                                                    <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                                )}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                                                notif.type === 'payment_pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                                            )}>
                                                                {notif.type === 'payment_pending' ? 'Task' : 'Info'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-[13px] font-black text-gray-900 group-hover:text-primary transition-colors leading-snug">
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-[10px] font-bold text-gray-400 flex items-center gap-1 opacity-70">
                                                    {notif.timestamp ? timeAgo(notif.timestamp.toDate()) : 'เมื่อสักครู่'}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 px-8 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                            <Bell className="h-8 w-8 text-gray-300 opacity-50" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-600">ยังไม่มีการแจ้งเตือนใหม่</h3>
                                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic">ทุกอย่างเรียบร้อยดี!</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-3 bg-white/50 border-t border-gray-100 rounded-b-[24px] flex gap-2">
                                <Link 
                                    href="/admin/payments" 
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-900 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span>เช็ครายการ</span>
                                </Link>
                                <Link 
                                    href="/admin/broadcast" 
                                    className="flex-1 bg-primary hover:bg-red-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Megaphone size={12} />
                                    <span>ส่งประกาศ</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Menu Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 px-1 hover:bg-gray-100 border-none normal-case h-auto py-1 flex items-center rounded-full pr-3 transition-colors">
                        <div className="avatar placeholder ring-2 ring-white ring-offset-2 ring-offset-gray-100 rounded-full">
                            <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-full w-8 h-8 flex items-center justify-center">
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
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 bg-white rounded-xl w-60 border border-gray-100 mt-2 animate-in zoom-in-95 duration-200">
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
