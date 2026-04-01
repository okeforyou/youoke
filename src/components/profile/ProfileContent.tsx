import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    UserCircleIcon,
    BookOpenIcon,
    SparklesIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
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
    const { user, signOut: logOut } = useSystem().auth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
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
            const result = await getUserProfile(user.uid);
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
            label: 'จัดการระบบ (Admin)',
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

    return (
        <div className="flex flex-col bg-white dark:bg-zinc-950">
            {/* Compact Profile Header */}
            <div className="px-6 py-8 flex items-center gap-5 bg-slate-50/50 border-b border-slate-100 mb-8 dark:bg-zinc-900/50 dark:border-zinc-800 rounded-[32px] mx-2">
                <div className="relative">
                    <div className="w-20 h-20 rounded-[24px] ring-4 ring-white shadow-lg overflow-hidden bg-white flex items-center justify-center text-primary font-black text-3xl dark:ring-zinc-800 dark:bg-zinc-900">
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
                        <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-xl shadow-lg border-2 border-white dark:border-zinc-800">
                            ADMIN
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-slate-900 truncate flex items-center gap-2 dark:text-white">
                        {profile?.displayName || user?.displayName || "YouOke User"}
                        {isPremium && !isAdmin && <SparklesIcon className="w-5 h-5 text-yellow-500 fill-current" />}
                    </h2>
                    <p className="text-sm font-bold text-slate-400 truncate mb-3 dark:text-zinc-500">{profile?.email || user?.email}</p>

                    <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-2 text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-all active:scale-95"
                    >
                        <UserCircleIcon className="w-4 h-4" /> แก้ไขโปรไฟล์
                    </Link>
                </div>
            </div>

            {/* Content Groups */}
            <div className="px-4 pb-12 space-y-10">
                {/* 1. Membership Section */}
                <section>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 dark:text-zinc-500">ข้อมูลสมาชิก</p>
                    <MembershipCard
                        membership={displayMembership as any}
                        role={isAdmin ? 'admin' : (user?.role || profile?.role)}
                        onUpgrade={() => router.push('/packages')}
                    />

                    {/* 🟢 LINE Bridge Section */}
                    <div className="mt-4 bg-slate-50 border border-slate-100 rounded-[32px] p-5 flex flex-col gap-4 shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-[#00B900] p-2 rounded-xl shadow-lg shadow-green-500/20">
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">เชื่อมต่อ LINE</p>
                            </div>
                            {profile?.lineUserId ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-[#00B900] bg-[#00B900]/10 px-3 py-1 rounded-full border border-[#00B900]/20 uppercase">เชื่อมต่อแล้ว</span>
                            ) : (
                                <span className="text-[10px] font-black text-slate-300 dark:text-zinc-600 uppercase">ยังไม่ได้เชื่อมต่อ</span>
                            )}
                        </div>

                        {profile?.lineUserId ? (
                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                                <div className="w-10 h-10 rounded-full bg-[#00B900]/10 flex items-center justify-center text-[#00B900] font-black">
                                    {profile.lineDisplayName?.charAt(0) || 'L'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800 truncate dark:text-white">{profile.lineDisplayName || 'Linked Account'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold dark:text-zinc-500">เชื่อมต่อบริการแจ้งเตือนแล้ว</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-[11px] font-bold text-slate-500 px-1 leading-relaxed dark:text-zinc-400">
                                    เชื่อมต่อบัญชี LINE เพื่อความปลอดภัยและรับข่าวสารโปรโมชั่น
                                </p>
                                <Link 
                                    href="/profile/line-connect"
                                    className="w-full bg-[#00B900] hover:bg-[#009e00] text-white py-3.5 rounded-[20px] font-black text-center text-sm shadow-xl shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    <span>เชื่อมต่อ LINE Account</span>
                                    <ChevronRightIcon className="w-4 h-4 ml-auto opacity-50" />
                                </Link>
                            </div>
                        )}
                        
                        <a 
                            href="https://line.me/R/ti/p/@243lercy" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full bg-white border border-slate-100 text-slate-400 py-3 rounded-[20px] font-black text-center text-[11px] hover:bg-slate-50 transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500 flex items-center justify-center gap-2"
                        >
                            <BookOpenIcon className="w-3.5 h-3.5" />
                            <span>แจ้งปัญหา / ติดต่อแอดมิน</span>
                        </a>
                    </div>
                </section>

                {/* 2. Notifications Section */}
                <section>
                    <div className="flex items-center justify-between px-2 mb-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] dark:text-zinc-500">ข่าวสารและแจ้งเตือน</p>
                        <Link href="/profile/notifications" className="text-[11px] font-black text-primary hover:underline uppercase tracking-tight">ทั้งหมด</Link>
                    </div>
                    <div className="rounded-[32px] border border-slate-100 bg-slate-50/30 p-5 dark:bg-zinc-900/30 dark:border-zinc-800">
                        <NotificationList />
                    </div>
                </section>

                {/* 3. Package Store */}
                <section>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 dark:text-zinc-500">สมัครสมาชิก</p>
                    <PackageStore />
                </section>

                {/* 4. Menu Actions */}
                <section>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 dark:text-zinc-500">ตั้งค่าอื่นๆ</p>
                    <ul className="space-y-2">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link href={item.href} className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group dark:hover:border-zinc-800 dark:hover:bg-zinc-900">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all dark:bg-zinc-800 dark:text-zinc-500">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-black text-slate-700 group-hover:text-slate-900 dark:text-zinc-400 dark:group-hover:text-white">{item.label}</span>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-6 flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 transition-all group dark:hover:bg-rose-500/10"
                    >
                        <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500 group-hover:bg-rose-100 transition-all dark:bg-rose-500/10 dark:text-rose-400">
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black text-rose-600 group-hover:text-rose-700 dark:text-rose-400">ออกจากระบบ</span>
                    </button>
                </section>
            </div>
        </div>
    );
};
