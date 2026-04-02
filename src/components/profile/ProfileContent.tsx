import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    UserCircleIcon,
    BookOpenIcon,
    SparklesIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon,
    ChatBubbleLeftRightIcon,
    ArrowTopRightOnSquareIcon
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
    const [view, setView] = useState<'main' | 'line_connect'>('main');
    const { showConfirm } = useUIStore();

    useEffect(() => {
        if (user?.uid) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const result = await getUserProfile(user.uid, true); // Force Refresh (v4.8.2)
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
        expiresAt: profile?.subscription?.endDate || user?.membership?.expiresAt || null,
        quota: profile?.quota || user?.quota || undefined
    };

    const isPremium = isAdmin || (displayMembership.type !== 'free' && displayMembership.status === 'active');

    const menuItems = [
        ...((user?.role === 'admin' || profile?.role === 'admin') ? [{
            icon: SparklesIcon,
            label: 'จัดการระบบ',
            href: '/admin',
        }] : []),
        { icon: UserCircleIcon, label: 'แก้ไขข้อมูลส่วนตัว', href: '/profile/edit' },
        { icon: BookOpenIcon, label: 'วิธีการใช้งาน', href: '/tutorial' },
    ];

    if (loading && !profile) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    // --- LINE CONNECT VIEW ---
    if (view === 'line_connect') {
        const liffUrl = `https://liff.line.me/2006894054-O8E2Rz96?u=${user.uid}`; 
        
        return (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                {/* View Header */}
                <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-50 dark:border-zinc-900/50">
                    <button 
                        onClick={() => setView('main')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                        <ChevronRightIcon className="w-5 h-5 rotate-180" />
                    </button>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">เชื่อมต่อ LINE ของคุณ</h2>
                </div>

                <div className="p-8 flex flex-col items-center text-center space-y-8">
                    {/* Professional Bridge QR Section */}
                    <div className="relative p-6 bg-white rounded-[40px] shadow-2xl shadow-green-500/10 border-8 border-emerald-500/5 ring-1 ring-emerald-500/20">
                        <QRCodeSVG 
                            value={liffUrl}
                            size={180}
                            level="H"
                            includeMargin={false}
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                           สแกนเพื่อยืนยันตัวตน
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">เชื่อมต่อง่ายนิดเดียว!</h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 leading-relaxed px-4">
                            สแกน QR แล้วกดปุ่มที่ระบุว่า <span className="text-emerald-500">"กดยอมรับ"</span> (Confirmed) เพื่อผูกบัญชีได้ทันทีครับ 🧼✨
                        </p>
                    </div>

                    <div className="w-full space-y-4 pt-4">
                        <button 
                            onClick={() => (user as any)?.uid && signInWithLine((user as any).uid)}
                            className="w-full bg-[#00B900] hover:bg-[#009e00] text-white py-4 rounded-[28px] font-black text-center text-sm shadow-xl shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            <span>ยืนยันสิทธิ์และเชื่อมต่อ LINE</span>
                        </button>

                        <button 
                            onClick={() => setView('main')}
                            className="w-full text-slate-300 font-black text-[11px] uppercase tracking-widest hover:text-slate-400 transition-colors"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN PROFILE VIEW ---
    return (
        <div className="flex flex-col bg-white dark:bg-zinc-950 animate-in fade-in duration-300">
            {/* Simple Profile Header */}
            <div className="px-6 pt-8 pb-4 flex items-center gap-5">
                <div className="relative">
                    <div className="w-16 h-16 rounded-[20px] shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center text-primary font-black text-2xl dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        {(() => {
                            const displayPhoto = profile?.photoURL || user?.photoURL || auth?.currentUser?.photoURL;
                            return displayPhoto ? (
                                <img src={displayPhoto} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span>{(profile?.displayName || user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
                            );
                        })()}
                    </div>
                    {isAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-lg border-2 border-white dark:border-zinc-950">
                            ADMIN
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-slate-900 truncate dark:text-white">
                        {profile?.displayName || user?.displayName || "ผู้ใช้งาน"}
                        {isPremium && !isAdmin && <SparklesIcon className="w-4 h-4 text-yellow-500 inline-block ml-1" />}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 truncate dark:text-zinc-500">{profile?.email || user?.email}</p>
                </div>
            </div>

            {/* Content List */}
            <div className="px-4 pb-12 mt-6 space-y-8">
                {/* 1. Membership */}
                <section>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 px-2">ข้อมูลสมาชิก</p>
                    <MembershipCard
                        membership={displayMembership as any}
                        role={isAdmin ? 'admin' : (user?.role || profile?.role)}
                        onUpgrade={() => router.push('/packages')}
                    />

                    {/* LINE Connection Status (Green Bridge v4.8.5) */}
                    <div className="mt-4 px-2">
                        <div className={cn(
                            "w-full flex flex-col p-5 rounded-[28px] border transition-all text-left bg-white dark:bg-zinc-900 shadow-sm",
                            profile?.lineUserId 
                                ? "border-emerald-100 dark:border-emerald-500/10"
                                : "border-slate-100 dark:border-zinc-800"
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center text-white",
                                        profile?.lineUserId ? "bg-[#00B900]" : "bg-emerald-50 dark:bg-emerald-500/5 text-[#00B900]"
                                    )}>
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[15px] font-black text-slate-900 dark:text-white">การเชื่อมต่อ LINE</p>
                                            {profile?.lineUserId ? (
                                                <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-lg uppercase">เชื่อมต่อแล้ว</span>
                                            ) : (
                                                <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-lg uppercase">ยังไม่ผูกบัญชี</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                                            {profile?.lineUserId ? `${profile.lineDisplayName || 'บัญชี LINE ของคุณ'}` : 'เพื่อรับสิทธิพิเศษและแจ้งเตือน'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-1">
                                    {profile?.lineUserId ? (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-emerald-100"></div>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setView('line_connect')}
                                className={cn(
                                    "w-full py-2.5 rounded-[12px] font-black uppercase text-[10px] tracking-wider transition-all active:scale-[0.98]",
                                    profile?.lineUserId 
                                        ? "bg-[#00B900] hover:bg-[#00a300] text-white shadow-md shadow-emerald-500/10"
                                        : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                )}
                            >
                                {profile?.lineUserId ? 'อัปเดตข้อมูล / เปลี่ยนบัญชี' : 'คลิกเพื่อเริ่มเชื่อมต่อตอนนี้'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* 2. Notifications */}
                <section>
                    <div className="flex items-center justify-between px-2 mb-3">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">ข่าวสารและแจ้งเตือน</p>
                        <Link href="/profile/notifications" className="text-[10px] font-black text-primary uppercase">ทั้งหมด</Link>
                    </div>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-4 dark:bg-zinc-900/30 dark:border-zinc-800">
                        <NotificationList />
                    </div>
                </section>

                {/* 3. Packages */}
                <section>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 px-2">เลือกแพ็กเกจ</p>
                    <PackageStore />
                </section>

                {/* 4. Actions */}
                <section className="pt-2">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link href={item.href} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all dark:hover:bg-zinc-900">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-5 h-5 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-400">{item.label}</span>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-4 flex items-center gap-4 p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all dark:hover:bg-rose-500/10"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="text-sm font-bold">ออกจากระบบ</span>
                    </button>
                </section>
            </div>
        </div>
    );
};
