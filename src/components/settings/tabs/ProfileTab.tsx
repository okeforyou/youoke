import React, { useEffect, useState } from 'react';
import { useSystem } from '@/core/container/SystemContext';
import { useUIStore } from '@/stores/useUIStore';
import { getUserProfile } from '@/services/userService';
import { UserProfile, DEFAULT_PRICING_PACKAGES } from '@/types/subscription';
import { CalendarIcon, ClockIcon, EnvelopeIcon, ArrowRightOnRectangleIcon, CheckBadgeIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileTab({ onClose, onSwitchTab }: { onClose: () => void, onSwitchTab?: (tab: string) => void }) {
    const { user, signOut } = useSystem().auth();
    const { showConfirm } = useUIStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            getUserProfile(user.uid, true).then(res => {
                if (res.success && res.data) setProfile(res.data);
                setLoading(false);
            });
        }
    }, [user]);

    const handleLogout = () => {
        showConfirm({
            title: 'ออกจากระบบ',
            message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
            confirmText: 'ออกจากระบบ',
            cancelText: 'ยกเลิก',
            type: 'danger',
            onConfirm: async () => {
                await signOut();
                onClose();
                window.location.href = '/login';
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center p-20"><div className="loading loading-spinner loading-lg text-primary"></div></div>;
    }

    // --- Prepare Real Data ---

    // 1. Membership Level
    const userRole = profile?.role || user?.role;
    const rawPlanId = profile?.subscription?.plan || (user as any)?.membership?.type || (user as any)?.tier;
    const planId = (rawPlanId && typeof rawPlanId === 'string' && rawPlanId.trim() !== '') ? rawPlanId : 'free';
    
    const pkg = DEFAULT_PRICING_PACKAGES.find(p => p.id === planId);
    const membershipName = pkg ? pkg.name : (planId === 'free' ? 'ทดลองใช้งานฟรี' : String(planId));
    
    const userStatus = profile?.subscription?.status || (user as any)?.membership?.status;
    const isPremium = userRole === 'admin' || (planId !== 'free' && userStatus === 'active');

    // 2. Expiration Date
    let expireDateStr = '-';
    if (planId === 'lifetime') {
        expireDateStr = 'ใช้งานได้ตลอดชีพ';
    } else if (planId === 'free') {
        expireDateStr = 'ไม่มีวันหมดอายุ (ใช้ฟรี)';
    } else {
        const endDateRaw = profile?.subscription?.endDate || (user as any)?.membership?.expiresAt;
        if (endDateRaw) {
            const endDt = typeof endDateRaw.toDate === 'function' ? endDateRaw.toDate() : new Date(endDateRaw);
            if (!isNaN(endDt.getTime())) {
                expireDateStr = endDt.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        }
    }

    // 3. Registration Date
    let regDateStr = '-';
    const createdAtRaw = (profile?.subscription as any)?.startDate || (user as any)?.membership?.createdAt || (profile as any)?.createdAt || (user as any)?.createdAt || user?.metadata?.creationTime;
    if (createdAtRaw) {
        const startDt = typeof createdAtRaw.toDate === 'function' ? createdAtRaw.toDate() : new Date(createdAtRaw);
        if (!isNaN(startDt.getTime())) {
            regDateStr = startDt.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }

    // 4. LINE Connection
    const isLineConnected = !!profile?.lineUserId || user?.providerData?.some(p => p.providerId === 'line.com');
    const lineStatusStr = isLineConnected ? `เชื่อมต่อแล้ว ${profile?.lineDisplayName ? `(${profile.lineDisplayName})` : ''}` : 'ยังไม่เชื่อมต่อ';

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">
            
            {/* Header Profile Card (Dark Premium Look) */}
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-zinc-800">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-inner flex items-center justify-center shrink-0">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-zinc-400 font-black text-2xl">{user?.displayName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            {isPremium && (
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center ring-4 ring-zinc-900 shadow-md">
                                    <Crown className="w-4 h-4 text-amber-950 fill-amber-950" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1">
                                {user?.displayName || 'ผู้ใช้งานระบบ'}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                                <EnvelopeIcon className="w-4 h-4" />
                                {user?.email || 'ไม่มีอีเมล'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="px-5 py-2.5 rounded-xl border border-rose-500/20 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/30 text-xs font-bold transition-all w-full md:w-auto"
                    >
                        ออกจากระบบ
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Membership Level */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isPremium ? "bg-amber-50 dark:bg-amber-500/10" : "bg-zinc-100 dark:bg-zinc-800")}>
                        <Crown className={cn("w-6 h-6", isPremium ? "text-amber-500" : "text-zinc-400")} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">ระดับสมาชิก</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">
                            {membershipName}
                        </p>
                    </div>
                </div>

                {/* 2. Expiration Date */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                        <ClockIcon className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">วันหมดอายุ</p>
                        <p className="text-base font-bold text-zinc-900 dark:text-white">
                            {expireDateStr}
                        </p>
                    </div>
                </div>

                {/* 3. Registration Date */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">วันที่สมัคร</p>
                        <p className="text-base font-bold text-zinc-900 dark:text-white">
                            {regDateStr}
                        </p>
                    </div>
                </div>

                {/* 4. LINE Connection */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">การเชื่อมต่อ LINE</p>
                        <p className="text-base font-bold text-zinc-900 dark:text-white">
                            {lineStatusStr}
                        </p>
                    </div>
                </div>

            </div>

            {/* Upgrade / Packages CTA */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">อัปเกรดเพื่อประสบการณ์ที่ดีกว่า</h4>
                        <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 mt-0.5">ปลดล็อกฟีเจอร์แยกเสียงร้องด้วย AI และร้องเพลงแบบไม่มีโฆษณาคั่น</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        if (onSwitchTab) onSwitchTab('packages');
                    }}
                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none shrink-0"
                >
                    ดูแพ็กเกจทั้งหมด
                </button>
            </div>

        </div>
    );
}
