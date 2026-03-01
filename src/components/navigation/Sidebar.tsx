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
        <aside className="hidden lg:flex w-[260px] bg-white border-r border-gray-200 flex-col shrink-0 z-30">
            {/* Sidebar Header */}
            <div className="h-20 flex items-center px-6 shrink-0 z-40">
                <div className="flex items-center gap-3">
                    <img
                        src="https://okeforyou.com/wp-content/uploads/2023/07/icon-192.png"
                        alt="Logo"
                        className="w-10 h-10 rounded-xl shadow-sm object-cover"
                    />
                </div>
            </div>

            <nav
                className="flex-1 overflow-y-auto py-2 px-4 space-y-2"
                style={{ fontSize: 'var(--sidebar-font-size, 14px)' } as React.CSSProperties}
            >
                {/* Main Menu */}
                <div className="px-4 mb-2 mt-2 text-[11px] font-black text-black uppercase tracking-wider">เมนูหลัก</div>
                <button onClick={() => handleNav(1, 'home')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold duration-300 text-[13px]", (router.pathname === '/' && activeIndex === 1) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black")}>
                    <Home className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 1) ? "text-white" : "text-black")} /> <span>หน้าหลัก</span>
                </button>
                <button onClick={() => handleNav(2, 'rec')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold duration-300 text-[13px]", (router.pathname === '/' && activeIndex === 2) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black")}>
                    <Star className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 2) ? "text-white" : "text-black")} /> <span>แนะนำ</span>
                </button>
                <button onClick={() => handleNav(3, 'trending')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold duration-300 text-[13px]", (router.pathname === '/' && activeIndex === 3) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black")}>
                    <Flame className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 3) ? "text-white" : "text-black")} /> <span>มาแรง</span>
                </button>
                <button onClick={() => handleNav(4, 'library')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold duration-300 text-[13px]", (router.pathname === '/' && activeIndex === 4) ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black")}>
                    <Library className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 4) ? "text-white" : "text-black")} /> <span>เพลย์ลิสต์</span>
                </button>

                {/*
                <div className="mt-8 px-4 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">การเชื่อมต่อ</div>
                <button onClick={() => useUIStore.getState().setReceiverModalOpen(true)} className={clsx("w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 duration-300")}>
                    <UserGroupIcon className="w-5 h-5 text-gray-400" /> <span>ปาร์ตี้รูม</span>
                </button>

                <div className="mt-8 px-4 mb-2 text-xs font-black text-black uppercase tracking-wider">ฟีเจอร์</div>
                <Link href="/store" className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium duration-300 text-sm", router.pathname === '/store' ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1" : "text-gray-900 hover:bg-gray-100/50 hover:text-gray-900")}>
                    <Grid className={clsx("w-[22px] h-[22px]", router.pathname === '/store' ? "text-white" : "text-gray-700")} /> <span>ส่วนเสริม</span>
                </Link>
                */}

                <div className="mt-8 px-4 mb-2 text-[11px] font-black text-black uppercase tracking-wider">ช่วยเหลือ</div>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-black hover:bg-gray-100/50 hover:text-black transition-all font-bold text-[13px] duration-300">
                    <MessageCircle className="w-[22px] h-[22px] text-black" /> <span>ติดต่อ LINE</span>
                </a>

                {/* Admin Menu (Admin & Owner) */}
                {(user?.role === 'admin' || user?.role === 'owner') && (
                    <div className="mt-8">
                        <div className="px-4 mb-2 text-[11px] font-black text-black uppercase tracking-wider">ส่วนผู้ดูแล</div>
                        <Link href="/admin" className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold duration-300 text-[13px]", router.pathname.startsWith('/admin') ? "bg-red-50 text-red-600 shadow-sm translate-x-1" : "text-black hover:bg-gray-100/50 hover:text-black")}>
                            <Shield className={clsx("w-[22px] h-[22px]", router.pathname.startsWith('/admin') ? "text-red-600" : "text-black")} /> <span>ระบบจัดการ</span>
                        </Link>
                    </div>
                )}

            </nav>

            <div className="p-4 border-t border-gray-50 bg-white">
                <ProfileDrawer
                    isOpen={isProfileDrawerOpen}
                    onClose={() => setIsProfileDrawerOpen(false)}
                />
                <div className="px-3 mb-2 text-[11px] font-black text-black uppercase tracking-wider">บัญชี</div>
                {mounted && (
                    user ? (
                        <div className="flex items-center justify-between gap-2 px-1 py-1">
                            <div onClick={() => setIsProfileDrawerOpen(true)} className="flex items-center gap-3 overflow-hidden flex-1 group cursor-pointer hover:bg-gray-100/50 p-2 rounded-2xl transition-all duration-300">
                                {user.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full border border-gray-100 group-hover:ring-2 ring-primary/20 transition-all shadow-sm" alt="" /> : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{user.email?.[0]?.toUpperCase() || 'G'}</div>}
                                <div className="overflow-hidden">
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
                                                if (user?.role === 'owner') return 'เจ้าของระบบ (Owner)';
                                                if (user?.role === 'admin') return 'ผู้ดูแลระบบ (Admin)';

                                                const status = user?.membership?.status;
                                                const type = user?.membership?.type;

                                                if (status === 'pending') return 'รอการอนุมัติ';
                                                if (status === 'expired') return 'สมาชิกหมดอายุ';

                                                if (type === 'lifetime') return 'สมาชิกตลอดชีพ (PRO)';
                                                if (type === 'yearly') return 'สมาชิกรายปี (PRO)';
                                                if (type === 'monthly') return 'สมาชิกรายเดือน';
                                                if (type === 'day_pass') return 'สมาชิกรายวัน';

                                                return 'สมาชิกทั่วไป';
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => { if (confirm('ยืนยันออกจากระบบ?')) { logOut().then(() => router.push('/login')); } }} className="p-2 text-black hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shrink-0 hover:scale-110" title="ออกจากระบบ"><LogOut className="w-4.5 h-4.5" /></button>
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
