import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { memo, useState } from 'react';
import clsx from 'clsx';
import { Home, Star, Flame, Library, MessageCircle, Shield, LogOut, Key, Grid, Lock, PlusCircle } from 'lucide-react';
import { UserGroupIcon } from '@heroicons/react/24/outline'; // Import Heroicon for Party
import { useSystem } from '../../core/container/SystemContext'; // DI Container
import ProfileDrawer from '../profile/ProfileDrawer';
import { usePlayerStore } from '../../modules/player/stores/usePlayerStore';
import { useUIStore } from '../../stores/useUIStore';

export const Sidebar = memo(() => {
    const router = useRouter();
    const { user, signOut: logOut } = useSystem().auth(); // specific hook
    const isPremium = user?.membership?.status === 'active' && user?.membership?.type !== 'free'; // Updated check for new UserData structure
    const { activeIndex, setActiveIndex, setSearchTerm } = usePlayerStore();
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false); // State for drawer

    // Mounted check to match hydration safety patterns
    const mounted = true;

    // Helper to handle navigation state
    const handleNav = (index: number, tabName: string) => {
        setSearchTerm(''); // Clear search when changing tabs
        setActiveIndex(index);
        router.push({
            pathname: '/',
            query: { tab: tabName }
        }, undefined, { shallow: true });
    };

    return (
        <aside className="hidden lg:flex w-[260px] bg-white border-r border-gray-200/50 flex-col shrink-0 z-30">
            {/* Sidebar Header */}
            <div className="h-20 flex items-center px-6 shrink-0 z-40">
                <div className="flex items-center gap-3">
                    <img
                        src="https://okeforyou.com/wp-content/uploads/2023/07/icon-192.png"
                        alt="Logo"
                        className="w-10 h-10 rounded-xl shadow-sm object-cover"
                    />
                    <Link href="/changelog" className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-900 hover:text-primary px-1.5 py-0.5 rounded-md transition-colors">v2.18.0</Link>
                </div>
            </div>

            <nav
                className="flex-1 overflow-y-auto py-2 px-4 space-y-2"
                style={{ fontSize: 'var(--sidebar-font-size, 14px)' } as React.CSSProperties}
            >
                {/* Main Menu */}
                <div className="px-4 mb-2 mt-2 text-xs font-black text-black uppercase tracking-wider">เมนูหลัก</div>
                <button onClick={() => handleNav(1, 'home')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium duration-300", (router.pathname === '/' && activeIndex === 1) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-gray-900 hover:bg-gray-100/50 hover:text-gray-900")}>
                    <Home className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 1) ? "text-white" : "text-gray-700")} /> <span>หน้าหลัก</span>
                </button>
                <button onClick={() => handleNav(2, 'rec')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium duration-300 text-sm", (router.pathname === '/' && activeIndex === 2) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-gray-900 hover:bg-gray-100/50 hover:text-gray-900")}>
                    <Star className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 2) ? "text-white" : "text-gray-700")} /> <span>แนะนำ</span>
                </button>
                <button onClick={() => handleNav(3, 'trending')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium duration-300 text-sm", (router.pathname === '/' && activeIndex === 3) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-gray-900 hover:bg-gray-100/50 hover:text-gray-900")}>
                    <Flame className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 3) ? "text-white" : "text-gray-700")} /> <span>มาแรง</span>
                </button>
                <button onClick={() => handleNav(4, 'library')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium duration-300 text-sm", (router.pathname === '/' && activeIndex === 4) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-gray-900 hover:bg-gray-100/50 hover:text-gray-900")}>
                    <Library className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 4) ? "text-white" : "text-gray-700")} /> <span>เพลย์ลิสต์</span>
                </button>

                <div className="mt-8 px-4 mb-2 text-xs font-black text-black uppercase tracking-wider">การเชื่อมต่อ</div>
                <button onClick={() => useUIStore.getState().setReceiverModalOpen(true)} className={clsx("w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm text-gray-900 hover:bg-gray-100/50 hover:text-gray-900 duration-300")}>
                    <UserGroupIcon className="w-[22px] h-[22px] text-gray-700" /> <span>ปาร์ตี้รูม</span>
                </button>

                <div className="mt-8 px-4 mb-2 text-xs font-black text-black uppercase tracking-wider">ฟีเจอร์</div>
                <Link href="/store" className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium duration-300 text-sm", router.pathname === '/store' ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-gray-900 hover:bg-gray-100/50 hover:text-gray-900")}>
                    <Grid className={clsx("w-[22px] h-[22px]", router.pathname === '/store' ? "text-white" : "text-gray-700")} /> <span>ส่วนเสริม</span>
                </Link>

                <div className="mt-8 px-4 mb-2 text-xs font-black text-black uppercase tracking-wider">ช่วยเหลือ</div>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-900 hover:bg-gray-100/50 hover:text-gray-900 transition-all font-medium text-sm duration-300">
                    <MessageCircle className="w-[22px] h-[22px] text-gray-700" /> <span>ติดต่อ LINE</span>
                </a>

                {user?.role === 'admin' && (
                    <div className="mt-8">
                        <div className="px-4 mb-2 text-xs font-black text-black uppercase tracking-wider">Admin</div>
                        <Link href="/admin" className={clsx("flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-1 transition-all", router.pathname === '/admin' ? "bg-primary/10 text-primary" : "text-gray-900 hover:bg-gray-100/50")}>
                            <Shield size={20} /> <span className="text-sm">ภาพรวมระบบ</span>
                        </Link>
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-gray-50 bg-white">
                <ProfileDrawer
                    isOpen={isProfileDrawerOpen}
                    onClose={() => setIsProfileDrawerOpen(false)}
                />
                <div className="px-3 mb-2 text-xs font-black text-black uppercase tracking-wider">บัญชี</div>
                {mounted && (
                    user ? (
                        <div className="flex items-center justify-between gap-2 px-1 py-1">
                            <div onClick={() => setIsProfileDrawerOpen(true)} className="flex items-center gap-3 overflow-hidden flex-1 group cursor-pointer hover:bg-gray-100/50 p-2 rounded-2xl transition-all duration-300">
                                {user.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full border border-gray-100 group-hover:ring-2 ring-primary/20 transition-all shadow-sm" alt="" /> : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{user.email?.[0]?.toUpperCase() || 'G'}</div>}
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold truncate text-black group-hover:text-primary transition-colors">{user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งานทั่วไป'}</p>
                                    <p className="text-[10px] text-gray-900 truncate uppercase tracking-wider font-black">{isPremium ? 'สมาชิก Pro' : 'สมาชิกทั่วไป'}</p>
                                </div>
                            </div>
                            <button onClick={() => { if (confirm('ยืนยันออกจากระบบ?')) { logOut().then(() => router.push('/login')); } }} className="p-2.5 text-gray-700 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors shrink-0" title="ออกจากระบบ"><LogOut className="w-5 h-5" /></button>
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold shadow-sm hover:shadow-md hover:border-primary/20 hover:text-primary transition-all justify-center group">
                            <div className="p-1 bg-gray-100 rounded-md group-hover:bg-primary/10 transition-colors"><Key className="w-4 h-4" /></div>
                            <span>เข้าสู่ระบบ</span>
                        </Link>
                    )
                )}
            </div>
        </aside>
    );
});
