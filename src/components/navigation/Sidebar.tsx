import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { memo, useState, useEffect } from 'react';
import clsx from 'clsx';
import { Home, Star, Flame, Library, MessageCircle, Shield, LogOut, Key, Grid, Lock, PlusCircle, ChevronLeft, Headphones, BarChart2 } from 'lucide-react';
import { UserGroupIcon } from '@heroicons/react/24/outline'; // Import Heroicon for Party
import { useSystem } from '../../core/container/SystemContext'; // DI Container
import ProfileDrawer from '../profile/ProfileDrawer';
import { usePlayerStore } from '../../modules/player/stores/usePlayerStore';
import { useUIStore } from '../../stores/useUIStore';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

export const Sidebar = memo(() => {
    const router = useRouter();
    const { user, signOut: logOut } = useSystem().auth(); // specific hook
    const isPremium = user?.membership?.status === 'active' && user?.membership?.type !== 'free'; // Updated check for new UserData structure
    const { activeIndex, setActiveIndex, setSearchTerm } = usePlayerStore();
    const { isSidebarCollapsed, setSidebarCollapsed, showConfirm } = useUIStore();
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false); // State for drawer
    const unreadCount = useUnreadNotifications();

    // Mounted check to match hydration safety patterns
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to handle navigation state
    const handleNav = (index: number, tabName: string) => {

        setSearchTerm(''); // Clear search when changing tabs
        setActiveIndex(index);
        router.push({
            pathname: '/',
            query: { tab: tabName }
        }, undefined, { shallow: true });

        // Explicit scroll reset for navigation commands
        if (typeof window !== 'undefined') {
            const main = document.querySelector('main');
            if (main) main.scrollTo({ top: 0, behavior: 'instant' });
        }
    };

    return (
        <aside className={clsx(
            "hidden lg:flex flex-col shrink-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out relative",
            isSidebarCollapsed ? "w-[80px]" : "w-[260px]"
        )}>
            {/* Collapse Toggle Button - Positioned exactly on the border */}
            <button 
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className={clsx(
                    "absolute top-8 -right-3.5 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md text-gray-400 hover:text-primary flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95",
                    isSidebarCollapsed ? "rotate-180" : ""
                )}
                title={isSidebarCollapsed ? "ขยายเมนู" : "ยุบเมนู"}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Sidebar Header */}
            <div className={clsx(
                "h-20 flex items-center shrink-0 z-40 transition-all duration-300",
                isSidebarCollapsed ? "px-0 justify-center" : "px-6"
            )}>
                <div className="flex items-center gap-3">
                    <img
                        src="https://okeforyou.com/wp-content/uploads/2023/07/icon-192.png"
                        alt="Logo"
                        className={clsx(
                            "rounded-xl shadow-sm object-cover transition-all duration-300",
                            isSidebarCollapsed ? "w-10 h-10" : "w-11 h-11"
                        )}
                    />
                </div>
            </div>

            <nav
                className={clsx(
                    "flex-1 overflow-y-auto py-2 space-y-2 scrollbar-none",
                    isSidebarCollapsed ? "px-2" : "px-4"
                )}
                style={{ fontSize: 'var(--sidebar-font-size, 14px)' } as React.CSSProperties}
            >
                {/* Main Menu */}
                <div className={clsx(
                    "mb-2 mt-2 text-[11px] font-black text-black uppercase tracking-wider transition-opacity duration-300",
                    isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-4 opacity-100"
                )}>
                    เมนูหลัก
                </div>

                <button 
                    onClick={() => handleNav(1, 'home')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 1) ? "bg-primary text-white translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black"
                    )}
                    title={isSidebarCollapsed ? "หน้าหลัก" : ""}
                >
                    <Home className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 1) ? "text-white" : "text-black")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        หน้าหลัก
                    </span>
                </button>

                <button onClick={() => handleNav(2, 'trending')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 2) ? "bg-primary text-white translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black"
                    )}
                    title={isSidebarCollapsed ? "ชาร์ตเพลง" : ""}
                >
                    <BarChart2 className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 2) ? "text-white" : "text-black")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        ชาร์ตเพลง
                    </span>
                </button>

                <button onClick={() => handleNav(3, 'station')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 3) ? "bg-primary text-white translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black"
                    )}
                    title={isSidebarCollapsed ? "สถานีเพลง" : ""}
                >
                    <Headphones className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 3) ? "text-white" : "text-black")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        สถานีเพลง
                    </span>
                </button>

                <button onClick={() => handleNav(4, 'playlists')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 4) ? "bg-primary text-white translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black"
                    )}
                    title={isSidebarCollapsed ? "เพลย์ลิสต์" : ""}
                >
                    <Library className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 4) ? "text-white" : "text-black")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        เพลย์ลิสต์
                    </span>
                </button>

                <div className={clsx(
                    "mb-2 mt-8 text-[11px] font-black text-black uppercase tracking-wider transition-opacity duration-300",
                    isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-4 opacity-100"
                )}>
                    ช่วยเหลือ
                </div>

                <a href="https://line.me/R/ti/p/@243lercy" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        "text-black hover:bg-gray-100/50 hover:text-black"
                    )}
                    title={isSidebarCollapsed ? "ติดต่อ" : ""}
                >
                    <MessageCircle className="w-[22px] h-[22px] text-black" /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        ติดต่อ
                    </span>
                </a>

                {/* Admin Menu (Admin & Owner) */}
                {(user?.role === 'admin' || user?.role === 'owner') && (
                    <div className="mt-8">
                        <div className={clsx(
                            "mb-2 text-[11px] font-black text-black uppercase tracking-wider transition-opacity duration-300",
                            isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-4 opacity-100"
                        )}>
                            ส่วนผู้ดูแล
                        </div>
                        <Link href="/admin" 
                            className={clsx(
                                "w-full flex items-center transition-all font-bold duration-300 text-sm",
                                isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                                router.pathname.startsWith('/admin') ? "bg-red-50 text-red-600 shadow-sm translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black"
                            )}
                            title={isSidebarCollapsed ? "ระบบจัดการ" : ""}
                        >
                            <Shield className={clsx("w-[22px] h-[22px]", router.pathname.startsWith('/admin') ? "text-red-600" : "text-black")} /> 
                            <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                                ระบบจัดการ
                            </span>
                        </Link>
                    </div>
                )}

            </nav>

            <div className={clsx(
                "border-t border-gray-50 bg-white transition-all duration-300",
                isSidebarCollapsed ? "p-2" : "p-4"
            )}>
                <ProfileDrawer
                    isOpen={isProfileDrawerOpen}
                    onClose={() => setIsProfileDrawerOpen(false)}
                />
                
                <div className={clsx(
                    "mb-2 text-[11px] font-black text-black uppercase tracking-wider transition-opacity duration-300",
                    isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-3 opacity-100"
                )}>
                    บัญชี
                </div>

                {mounted && (
                    user ? (
                        <div className={clsx(
                            "flex items-center justify-between transition-all duration-300",
                            isSidebarCollapsed ? "flex-col gap-2" : "gap-2 px-1 py-1"
                        )}>
                            <div onClick={() => setIsProfileDrawerOpen(true)} 
                                className={clsx(
                                    "flex items-center transition-all duration-300 overflow-hidden flex-1 group cursor-pointer hover:bg-gray-100/50 rounded-2xl",
                                    isSidebarCollapsed ? "justify-center p-2" : "gap-3 p-2"
                                )}
                                title={isSidebarCollapsed ? user?.displayName || user?.email?.split('@')[0] : ""}
                            >
                                {user.photoURL ? 
                                    <div className="relative">
                                        <img src={user.photoURL} className="w-10 h-10 rounded-full border border-gray-100 group-hover:ring-2 ring-primary/20 transition-all shadow-sm" alt="" />
                                        {mounted && unreadCount > 0 && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                                        )}
                                    </div>
                                    : <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{user.email?.[0]?.toUpperCase() || 'G'}</div>
                                        {mounted && unreadCount > 0 && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                                        )}
                                      </div>
                                }
                                <div className={clsx("overflow-hidden transition-all duration-300", isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-black truncate max-w-[140px]">
                                            {user?.displayName || user?.email?.split('@')[0] || 'Guest User'}
                                        </span>
                                        <span className={clsx(
                                            "text-[10px] font-black uppercase tracking-tight",
                                            user?.membership?.status === 'pending' ? "text-orange-500" :
                                                user?.membership?.status === 'expired' ? "text-red-500" :
                                                    (user?.role === 'admin' || user?.role === 'owner') ? "text-primary" : "text-gray-500"
                                        )}>
                                            {(() => {
                                                if (user?.role === 'owner') return 'เจ้าของ';
                                                if (user?.role === 'admin') return 'ผู้ดูแล';

                                                const status = user?.membership?.status;
                                                const type = user?.membership?.type;

                                                if (status === 'pending') return 'รออนุมัติ';
                                                if (status === 'expired') return 'หมดอายุ';

                                                if (type === 'lifetime') return 'ตผช. (PRO)';
                                                if (type === 'yearly') return 'รายปี (PRO)';
                                                if (type === 'monthly') return 'รายเดือน';
                                                if (type === 'day_pass') return 'รายวัน';

                                                return 'สมาชิก';
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { 
                                    showConfirm({
                                        title: 'ออกจากระบบ',
                                        message: 'คุณต้องการออกจากระบบใช่หรือไม่? คุณจะยังสามารถฟังเพลงฟรีได้ตามโควต้าที่มี',
                                        confirmText: 'ออกจากระบบ',
                                        cancelText: 'ยกเลิก',
                                        type: 'danger',
                                        onConfirm: async () => {
                                            await logOut();
                                        }
                                    });
                                }} 
                                className={clsx(
                                    "p-2 text-black hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shrink-0 hover:scale-110",
                                    isSidebarCollapsed ? "w-10 h-10 flex items-center justify-center" : ""
                                )} 
                                title="ออกจากระบบ"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" 
                            className={clsx(
                                "flex items-center rounded-xl bg-white border border-gray-200 text-gray-700 font-bold shadow-sm hover:shadow-md hover:border-primary/20 hover:text-primary transition-all group mx-auto",
                                isSidebarCollapsed ? "w-12 h-12 justify-center" : "gap-3 px-4 py-3 justify-center w-full"
                            )}
                            title={isSidebarCollapsed ? "เข้าสู่ระบบ" : ""}
                        >
                            <div className={clsx(
                                "flex items-center justify-center transition-colors",
                                isSidebarCollapsed ? "p-0" : "p-1 bg-gray-100 rounded-md group-hover:bg-primary/10"
                            )}>
                                <Key className={clsx(isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                            </div>
                            <span className={clsx("transition-all duration-300 overflow-hidden whitespace-nowrap", isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                เข้าสู่ระบบ
                            </span>
                        </Link>
                    )
                )}
            </div>
        </aside>
    );
});
