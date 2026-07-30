import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { SYSTEM_VERSION, COMMIT_ID } from '@/core/version';
import { Home, Star, Flame, Library, MessageCircle, Shield, LogOut, Key, Grid, Lock, PlusCircle, ChevronLeft, Headphones, BarChart2, Sparkles } from 'lucide-react';
import { safeSplit } from '@/utils/stringUtils';
import { UserGroupIcon } from '@heroicons/react/24/outline'; // Import Heroicon for Party
import { useSystem } from '../../core/container/SystemContext'; // DI Container
import { usePlayerStore } from '../../modules/player/stores/usePlayerStore';
import { useUIStore } from '../../stores/useUIStore';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

export const Sidebar = memo(() => {
    const router = useRouter();
    const { user, signOut: logOut } = useSystem().auth(); // specific hook
    const isPremium = user?.membership?.status === 'active' && user?.membership?.type !== 'free'; // Updated check for new UserData structure
    const { activeIndex, setActiveIndex, setSearchTerm } = usePlayerStore();
    const { isSidebarCollapsed, setSidebarCollapsed, showConfirm, setProfileOpen } = useUIStore();
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
            "hidden lg:flex flex-col shrink-0 z-30 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 transition-all duration-300 ease-in-out relative",
            isSidebarCollapsed ? "w-[80px]" : "w-[260px]"
        )}>
            {/* Collapse Toggle Button - Positioned exactly on the border */}
            <button 
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className={clsx(
                    "absolute top-8 -right-3.5 w-7 h-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-primary flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95",
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
                    "mb-2 mt-2 text-[11px] font-black text-black dark:text-zinc-400 uppercase tracking-wider transition-opacity duration-300",
                    isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-4 opacity-100"
                )}>
                    เมนูหลัก
                </div>

                <button 
                    onClick={() => handleNav(1, 'home')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 1) ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "หน้าหลัก" : ""}
                >
                    <Home className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 1) ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        หน้าหลัก
                    </span>
                </button>

                <button onClick={() => handleNav(2, 'trending')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 2) ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "ชาร์ตเพลง" : ""}
                >
                    <BarChart2 className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 2) ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        ชาร์ตเพลง
                    </span>
                </button>

                <button onClick={() => handleNav(3, 'station')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 3) ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "สถานีเพลง" : ""}
                >
                    <Headphones className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 3) ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        สถานีเพลง
                    </span>
                </button>

                <button onClick={() => handleNav(4, 'playlists')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 4) ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "เพลย์ลิสต์" : ""}
                >
                    <Library className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 4) ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        เพลย์ลิสต์
                    </span>
                </button>

{/* 
                <Link href="/library" 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm mt-2",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/library') ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "คลังส่วนตัว" : ""}
                >
                    <Sparkles className={clsx("w-[22px] h-[22px]", (router.pathname === '/library') ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        คลังส่วนตัว
                    </span>
                </Link>
*/}



                <div className={clsx(
                    "mb-2 mt-8 text-[11px] font-black text-black dark:text-zinc-400 uppercase tracking-wider transition-opacity duration-300",
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
                        "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "ติดต่อ" : ""}
                >
                    <MessageCircle className="w-[22px] h-[22px] text-black dark:text-zinc-400" /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        ติดต่อ
                    </span>
                </a>

                {/* Admin Menu (Admin & Owner) */}
                {(user?.role === 'admin' || user?.role === 'owner') && (
                    <div className="mt-8">
                        <div className={clsx(
                            "mb-2 text-[11px] font-black text-black dark:text-zinc-400 uppercase tracking-wider transition-opacity duration-300",
                            isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-4 opacity-100"
                        )}>
                            ส่วนผู้ดูแล
                        </div>
                        <Link href="/admin" 
                            className={clsx(
                                "w-full flex items-center transition-all font-bold duration-300 text-sm",
                                isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                                router.pathname.startsWith('/admin') ? "bg-red-50 text-red-600 shadow-sm translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                            )}
                            title={isSidebarCollapsed ? "ระบบจัดการ" : ""}
                        >
                            <Shield className={clsx("w-[22px] h-[22px]", router.pathname.startsWith('/admin') ? "text-red-600" : "text-black dark:text-zinc-400")} /> 
                            <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                                ระบบจัดการ
                            </span>
                        </Link>
                    </div>
                )}

            </nav>

            <div className={clsx(
                "border-t border-gray-100 dark:border-zinc-800/20 bg-white dark:bg-zinc-900/30 transition-all duration-300",
                isSidebarCollapsed ? "p-2" : "p-4"
            )}>
            <div className={clsx(
                "mb-1 text-[10px] font-black text-black/40 dark:text-zinc-600 uppercase tracking-widest transition-opacity duration-300",
                isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden" : "px-3 opacity-100"
            )}>
                Account
            </div>

                {mounted && (
                    user ? (
                        <div className={clsx(
                            "flex items-center justify-between transition-all duration-300",
                            isSidebarCollapsed ? "flex-col gap-2" : "gap-2 px-1 py-1"
                        )}>
                            <div onClick={() => setProfileOpen(true)} 
                                className={clsx(
                                    "flex items-center transition-all duration-300 overflow-hidden flex-1 group cursor-pointer hover:bg-gray-100/50 dark:hover:bg-zinc-800/60 rounded-2xl",
                                    isSidebarCollapsed ? "justify-center p-2" : "gap-3 p-2 bg-gray-50/50 dark:bg-zinc-800/40 border border-transparent dark:border-zinc-800/40"
                                )}
                                title={isSidebarCollapsed ? user?.displayName || safeSplit(user?.email || '', '@')[0] || 'Guest' : ""}
                            >
                                {user.photoURL ? 
                                    <div className="relative shrink-0">
                                        <img src={user.photoURL} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-zinc-800 group-hover:ring-2 ring-primary/20 transition-all shadow-sm shrink-0" alt="" />
                                        {mounted && unreadCount > 0 && (
                                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full z-10 animate-pulse shadow-sm" />
                                        )}

                                    </div>
                                    : <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{user.email?.[0]?.toUpperCase() || 'G'}</div>
                                        {mounted && unreadCount > 0 && (
                                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full z-10 animate-pulse shadow-sm" />
                                        )}

                                      </div>
                                }
                                <div className={clsx("overflow-hidden transition-all duration-300", isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-black dark:text-white truncate max-w-[140px]">
                                            {user?.displayName || safeSplit(user?.email || '', '@')[0] || 'Guest User'}
                                        </span>
                                        <span className={clsx(
                                            "text-[10px] font-black uppercase tracking-tight",
                                            user?.membership?.status === 'pending' ? "text-orange-500" :
                                                user?.membership?.status === 'expired' ? "text-red-500" :
                                                    user?.membership?.type === 'trial' ? "text-red-600 font-black animate-pulse" :
                                                        (user?.role === 'admin' || user?.role === 'owner') ? "text-primary" : "text-gray-500 dark:text-zinc-500"
                                        )}>
                                            {(() => {
                                                const status = user?.membership?.status;
                                                const type = user?.membership?.type;

                                                if (user?.role === 'owner') return 'เจ้าของระบบ';
                                                if (user?.role === 'admin') return 'ผู้ดูแลระบบ';

                                                if (status === 'pending') return 'รออนุมัติ';
                                                if (status === 'expired') return 'หมดอายุ';

                                                let label = 'สมาชิกทั่วไป';
                                                if (type === 'lifetime') label = 'ตลอดชีพ (PRO)';
                                                else if (type === 'yearly') label = 'รายปี (PRO)';
                                                else if (type === 'monthly') label = 'รายเดือน';
                                                else if (type === 'day_pass') label = 'รายวัน';
                                                else if (type === 'trial') label = 'ทดลองใช้ (ACTIVE)';

                                                if (status === 'active' && user?.expiryStatus?.daysRemaining !== undefined && type !== 'lifetime' && type !== 'free') {
                                                    return `${label} • เหลือ ${user.expiryStatus.daysRemaining} วัน`;
                                                }

                                                return label;
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
                                    "p-2 text-black dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-xl transition-all shrink-0 hover:scale-110",
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
                                "flex items-center rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 font-bold shadow-sm hover:shadow-md hover:border-primary/20 hover:text-primary transition-all group mx-auto",
                                isSidebarCollapsed ? "w-12 h-12 justify-center" : "gap-3 px-4 py-3 justify-center w-full"
                            )}
                            title={isSidebarCollapsed ? "เข้าสู่ระบบ" : ""}
                        >
                            <div className={clsx(
                                "flex items-center justify-center transition-colors",
                                isSidebarCollapsed ? "p-0" : "p-1 bg-gray-100 dark:bg-zinc-800 rounded-md group-hover:bg-primary/10"
                            )}>
                                <Key className={clsx(isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                            </div>
                            <span className={clsx("transition-all duration-300 overflow-hidden whitespace-nowrap", isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                เข้าสู่ระบบ
                            </span>
                        </Link>
                    )
                )}

                {/* Expiry Banner (Expiring Soon) */}
                {mounted && user?.expiryStatus?.isExpiringSoon && user?.role !== 'admin' && user?.role !== 'owner' && (
                    <Link href="/profile" className={clsx(
                        "mt-3 flex items-center justify-center gap-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 rounded-xl p-2 transition-all hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-sm",
                        isSidebarCollapsed ? "hidden" : "flex"
                    )}>
                        <Star className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">ต่ออายุแพ็กเกจ</span>
                    </Link>
                )}

                {/* Version Info (Standard Gray & Linked) */}
                <div className={clsx(
                    "mt-4 flex items-center transition-all duration-300 border-t border-gray-100 dark:border-zinc-800/40 pt-4 px-3",
                    isSidebarCollapsed ? "justify-center" : "justify-between"
                )}>
                    <Link href="/changelog" className="hover:opacity-70 transition-opacity">
                        <span className="text-[9px] font-black tracking-widest text-gray-300 dark:text-zinc-700 uppercase">
                            {isSidebarCollapsed ? SYSTEM_VERSION : `Version v${SYSTEM_VERSION}`}
                        </span>
                    </Link>

                </div>
            </div>
        </aside>
    );
});
