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

                <div className="p-8 pb-12 flex flex-col items-center text-center space-y-8">
                    <div className="relative p-6 bg-white rounded-[40px] border-4 border-zinc-100">
                        <QRCodeSVG value={liffUrl} size={180} level="H" includeMargin={false} />
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white">สแกนเพื่อเชื่อมต่อ</h3>
                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed px-4">
                                ผูกบัญชีเพื่อรับแจ้งเตือนและสิทธิพิเศษจาก YouOke
                            </p>
                        </div>
                        
                        <div className="pt-4">
                            <button 
                                onClick={() => window.open(liffUrl, '_blank')}
                                className="w-full h-14 px-10 rounded-2xl bg-[#06C755] text-white font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-none"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                                <span>คลิกเพื่อเชื่อมต่อทันที</span>
                            </button>
                        </div>
                    </div>
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
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">เลือกแพ็กเกจ VIP</h2>
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
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                            {(() => {
                                const displayPhoto = profile?.photoURL || user?.photoURL;
                                return displayPhoto ? (
                                    <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary font-black text-xl">{(profile?.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-black text-zinc-950 dark:text-white truncate tracking-tight">
                            {profile?.displayName || user?.displayName || "ผู้ใช้งาน"}
                        </h2>
                        <p className="text-[11px] font-bold text-zinc-500 truncate">{profile?.email || user?.email}</p>
                    </div>
                </div>

                <button 
                    onClick={toggleDarkMode}
                    className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 shadow-sm transition-all active:scale-90"
                >
                    {isDarkMode ? <SunIcon className="w-5 h-5 text-amber-500" /> : <MoonIcon className="w-5 h-5 text-zinc-900" />}
                </button>
            </div>

            {/* 2. Main Content */}
            <div className="px-4 pb-12 mt-4 space-y-4">
                {/* Membership Row */}
                <div className="space-y-4">
                    <MembershipCard
                        membership={displayMembership as any}
                        role={isAdmin ? 'admin' : (user?.role || profile?.role)}
                        onUpgrade={handleOpenPackages}
                    />

                    {/* v5 VIP Invitation Banner (Ultra Compact) */}
                    {!isPremium && (
                        <div 
                            onClick={() => setView('packages')}
                            className="group cursor-pointer w-full p-3.5 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-between transition-all active:scale-[0.98] border border-zinc-950"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-black text-white dark:text-zinc-950 leading-tight">สมัครสมาชิก VIP วันนี้!</p>
                                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Unlimited Singing Access</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-zinc-100 flex items-center justify-center">
                                <ChevronRightIcon className="w-4 h-4 text-white dark:text-zinc-900" />
                            </div>
                        </div>
                    )}

                    {/* v5 High Contrast LINE Block */}
                    <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#06C755]/10 border border-[#06C755]/20">
                                <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#06C755]" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304zm-14.757 2.375a.333.333 0 0 1-.333.333H6.84a.332.332 0 0 1-.334-.333V8.165a.333.333 0 0 1 .334-.334h.61c.184 0 .333.15.333.334v3.837h1.127c.184 0 .333.15.333.333v.644zm3.058 0a.334.334 0 0 1-.334.333h-.615a.333.333 0 0 1-.333-.333V8.165c0-.184.15-.334.333-.334h.615c.184 0 .334.15.334.334v4.514zm3.903 0a.332.332 0 0 1-.333.333h-.515a.34.34 0 0 1-.267-.13l-1.422-1.95v1.747a.333.333 0 0 1-.333.333h-.611a.333.333 0 0 1-.333-.333V8.165a.333.333 0 0 1 .333-.334h.511c.101 0 .196.046.257.126l1.432 1.956V8.165a.333.333 0 0 1 .333-.334h.612c.184 0 .333.15.333.334v4.514zm3.015-2.071c.184 0 .333.15.333.333v.644a.333.333 0 0 1-.333.333h-1.616a.333.333 0 0 1-.333-.333V8.165a.333.333 0 0 1 .333-.334h1.616c.184 0 .333.15.333.334v.644a.333.333 0 0 1-.333.334H17.47v.754h1.127c.184 0 .333.15.333.333v.644a.333.333 0 0 1-.333.334H17.47v.775h1.119z"/></svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[14px] font-black text-zinc-950 dark:text-white leading-tight">
                                    {profile?.lineUserId ? 'เชื่อมต่อ LINE สำเร็จ' : 'เชื่อมต่อบัญชี LINE'}
                                </p>
                                <p className={cn("text-[10px] font-bold truncate mt-0.5", profile?.lineUserId ? "text-emerald-500" : "text-primary")}>
                                    {profile?.lineUserId ? (profile.lineDisplayName || 'รับสิทธิอย่างเป็นทางการแล้ว') : 'สแกนเพื่อรับสิทธิพิเศษและแจ้งเตือน'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setView('line_connect')}
                            className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98] border-2",
                                profile?.lineUserId 
                                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white border-zinc-200 dark:border-zinc-700"
                                    : "bg-[#06C755] text-white border-transparent"
                            )}
                        >
                            {profile?.lineUserId ? 'จัดการ' : 'เชื่อมต่อ'}
                        </button>
                    </div>
                </div>

                {/* Notifications Row */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">การแจ้งเตือน</p>
                        <Link href="/profile/notifications" className="text-[10px] font-black text-primary uppercase underline">ดูทั้งหมด</Link>
                    </div>
                    <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30 dark:border-zinc-800 p-1.5 overflow-hidden">
                        <NotificationList />
                    </div>
                </div>

                {/* Menu List Row Row */}
                <div className="pt-2">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link href={item.href} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all border border-transparent">
                                    <div className="flex items-center gap-3.5 text-zinc-950 dark:text-white group">
                                        <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-950 transition-colors" strokeWidth={2} />
                                        <span className="text-[15px] font-bold tracking-tight">{item.label}</span>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-zinc-300" />
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95 group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <ArrowRightOnRectangleIcon className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                    <span className="text-[15px] font-bold text-rose-600 dark:text-rose-400">ออกจากระบบ</span>
                                </div>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
