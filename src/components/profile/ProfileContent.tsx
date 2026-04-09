import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    UserCircleIcon,
    BookOpenIcon,
    SparklesIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon,
    ChatBubbleLeftRightIcon,
    ArrowTopRightOnSquareIcon,
    MoonIcon,
    SunIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { useUIStore } from '@/stores/useUIStore';
import { useSystem } from '@/core/container/SystemContext';
import Link from 'next/link';
import { getUserProfile } from '@/services/userService';
import { UserProfile } from '@/types/subscription';
import { MembershipCard } from './MembershipCard';
import { PackageStore } from './PackageStore';
import { NotificationList } from './NotificationList';
import { cn } from '@/lib/utils';
import { auth } from '@/firebase';

export const ProfileContent = () => {
    const { user, signOut: logOut, signInWithLine } = useSystem().auth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'main' | 'line_connect' | 'packages'>('main');
    const { showConfirm, isDarkMode, toggleDarkMode } = useUIStore();

    useEffect(() => {
        if (user?.uid) {
            loadProfile();
        }
    }, [user]);

    const handleOpenPackages = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setView('packages');
    };

    const loadProfile = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const result = await getUserProfile(user.uid, true); 
            if (result.success && result.data) {
                setProfile(result.data);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        showConfirm({
            title: 'ออกจากระบบ',
            message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
            confirmText: 'ออกจากระบบ',
            cancelText: 'ยกเลิก',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await logOut();
                    router.push('/login');
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const isAdmin = user?.role === 'admin' || profile?.role === 'admin' || user?.email === 'boonyanone@gmail.com';
    
    const displayMembership = {
        type: profile?.subscription?.plan || user?.membership?.type || 'free',
        status: profile?.subscription?.status || user?.membership?.status || 'active',
        createdAt: (profile?.subscription as any)?.startDate || (user?.membership as any)?.createdAt || null,
        expiresAt: profile?.subscription?.endDate || user?.membership?.expiresAt || null
    };

    const isPremium = isAdmin || (displayMembership.type !== 'free' && displayMembership.status === 'active');

    const menuItems = [
        ...((user?.role === 'admin' || profile?.role === 'admin') ? [{
            icon: SparklesIcon,
            label: 'จัดการระบบแอดมิน',
            href: '/admin',
        }] : []),
        { icon: BookOpenIcon, label: 'คู่มือการใช้งาน', href: '/tutorial' },
        { icon: UserCircleIcon, label: 'ตั้งค่าโปรไฟล์', href: '/profile/edit' },
    ];

    if (loading && !profile) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    if (view === 'line_connect') {
        const liffUrl = `https://liff.me/2006894054-O8E2Rz96?u=${user.uid}`; 
        
        return (
            <div className="flex flex-col animate-in fade-in duration-200">
                <div className="px-6 py-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800">
                    <button onClick={() => setView('main')} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 rotate-180 text-zinc-400" />
                    </button>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">เชื่อมต่อ LINE</h2>
                </div>

                <div className="p-8 flex flex-col items-center text-center space-y-8">
                    <div className="relative p-6 bg-white rounded-[40px] border border-zinc-100">
                        <QRCodeSVG value={liffUrl} size={180} level="H" includeMargin={false} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white">สแกนเพื่อเริ่มร้องเพลง</h3>
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 leading-relaxed px-4">
                            ผูกบัญชีเพื่อแจ้งเตือนสถานะพรีเมียมและรับบริการพิเศษจากทีมงาน
                        </p>
                    </div>
                    <button 
                        onClick={() => (user as any)?.uid && signInWithLine((user as any).uid)}
                        className="w-full bg-[#06C755] text-white py-4 rounded-3xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                        <span>เปิดแอป LINE ของคุณ</span>
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'packages') {
        return (
            <div className="flex flex-col animate-in fade-in duration-200">
                <div className="px-6 py-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-[110] bg-white dark:bg-zinc-950">
                    <button onClick={() => setView('main')} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                        <ChevronRightIcon className="w-5 h-5 rotate-180 text-zinc-400" />
                    </button>
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">แพ็กเกจ (Shop)</h2>
                </div>
                <div className="px-4 py-6"><PackageStore /></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white dark:bg-zinc-950 animate-in fade-in duration-200">
            {/* 1. Header Area */}
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                            {(() => {
                                const displayPhoto = profile?.photoURL || user?.photoURL;
                                return displayPhoto ? (
                                    <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary font-black">{(profile?.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-black text-zinc-900 dark:text-white truncate">
                            {profile?.displayName || user?.displayName || "Profile User"}
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 truncate">{profile?.email || user?.email}</p>
                    </div>
                </div>

                <button 
                    onClick={toggleDarkMode}
                    className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90"
                >
                    {isDarkMode ? <SunIcon className="w-5 h-5 text-amber-500" /> : <MoonIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* 2. Main Content */}
            <div className="px-4 pb-12 mt-4 space-y-6">
                {/* Membership Row */}
                <div className="space-y-2">
                    <MembershipCard
                        membership={displayMembership as any}
                        role={isAdmin ? 'admin' : (user?.role || profile?.role)}
                        onUpgrade={handleOpenPackages}
                    />

                    {/* v5 Neutral LINE Connect Block */}
                    <div className="w-full flex items-center justify-between p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", profile?.lineUserId ? "bg-emerald-500/10" : "bg-zinc-100 dark:bg-zinc-800")}>
                                <svg width="20" height="20" viewBox="0 0 24 24" className={cn(profile?.lineUserId ? "text-[#06C755]" : "text-zinc-300")} fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black text-zinc-900 dark:text-white leading-tight">
                                    {profile?.lineUserId ? 'เชื่อมต่อ LINE สำเร็จ' : 'เชื่อมต่อบัญชี LINE'}
                                </p>
                                <p className="text-[9px] font-bold text-zinc-400 truncate">
                                    {profile?.lineUserId ? (profile.lineDisplayName || 'บัญชีเปิดใช้งานแล้ว') : 'ผูกบัญชีเพื่อรับสิทธิพิเศษ'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('line_connect')}
                            className={cn(
                                "h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-[0.98]",
                                profile?.lineUserId 
                                    ? "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    : "bg-[#06C755] text-white"
                            )}
                        >
                            {profile?.lineUserId ? 'จัดการ' : 'เชื่อมต่อ'}
                        </button>
                    </div>
                </div>

                {/* Notifications Row */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                        <p className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">การแจ้งเตือน</p>
                        <Link href="/profile/notifications" className="text-[9px] font-black text-primary uppercase">ดูทั้งหมด</Link>
                    </div>
                    <div className="rounded-3xl border border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 p-2">
                        <NotificationList />
                    </div>
                </div>

                {/* Menu List Row */}
                <div className="pt-2">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link href={item.href} className="flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all border border-transparent dark:border-zinc-900">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-5 h-5 text-zinc-400" />
                                        <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{item.label}</span>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span className="text-sm font-bold">ออกจากระบบ</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
