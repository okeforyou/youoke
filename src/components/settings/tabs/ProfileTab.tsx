import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSystem } from '@/core/container/SystemContext';
import { useUIStore } from '@/stores/useUIStore';
import { getUserProfile } from '@/services/userService';
import { UserProfile } from '@/types/subscription';
import { ArrowRightOnRectangleIcon, ComputerDesktopIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { MembershipCard } from '@/components/profile/MembershipCard';

export default function ProfileTab({ onClose }: { onClose: () => void }) {
    const { user, signOut, signInWithLine } = useSystem().auth();
    const router = useRouter();
    const { showConfirm, isDarkMode, toggleDarkMode } = useUIStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLineQR, setShowLineQR] = useState(false);

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
                router.push('/login');
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center p-20"><div className="loading loading-spinner loading-lg text-primary"></div></div>;
    }

    const isLineConnected = user?.providerData?.some(p => p.providerId === 'line.com') || false;

    return (
        <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl">
            
            {/* User Profile Row */}
            <div className="p-4 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-zinc-400 font-bold text-lg">{user?.displayName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                            {user?.displayName || 'ผู้ใช้งานระบบ'}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-zinc-500 font-medium truncate">
                                {user?.email || 'ไม่มีอีเมล'}
                            </p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                {user?.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 border border-zinc-200/50 dark:border-zinc-800 transition-all shrink-0 ml-4"
                    title="ออกจากระบบ"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Membership Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-1.5 shadow-sm">
                <MembershipCard 
                    membership={(profile?.membership as any) || { type: 'free', status: 'active', expiresAt: null }}
                    role={user?.role || profile?.role}
                    onUpgrade={() => {
                        onClose();
                        router.push('/packages');
                    }}
                />
            </div>

            {/* Settings Group */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50 shadow-sm">
                
                {/* Theme Toggle */}
                <div className="p-4 sm:p-5 flex items-center justify-between transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            <ComputerDesktopIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">โหมดหน้าจอ (Theme)</h4>
                            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">เลือกรูปแบบการแสดงผล</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                        <button 
                            onClick={() => { if(isDarkMode) toggleDarkMode(); }}
                            className={cn(
                                "flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                !isDarkMode ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <SunIcon className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} /> สว่าง
                        </button>
                        <button 
                            onClick={() => { if(!isDarkMode) toggleDarkMode(); }}
                            className={cn(
                                "flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                isDarkMode ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <MoonIcon className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} /> มืด
                        </button>
                    </div>
                </div>

                {/* LINE Connection */}
                <div className="p-4 sm:p-5 flex items-center justify-between transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#06C755]/10 text-[#06C755]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">เชื่อมต่อ LINE</h4>
                            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">รับการแจ้งเตือนและล็อกอินด้วย LINE</p>
                        </div>
                    </div>
                    
                    {!isLineConnected ? (
                        <button 
                            onClick={() => setShowLineQR(!showLineQR)}
                            className="px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#06C755]/90 text-white text-xs font-bold transition-all shadow-sm shrink-0"
                        >
                            เชื่อมต่อ
                        </button>
                    ) : (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider shrink-0">
                            เชื่อมต่อแล้ว
                        </span>
                    )}
                </div>

                {/* Optional QR Code Area */}
                {showLineQR && !isLineConnected && (
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 border-t border-zinc-100">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-200 mb-4">
                            <QRCodeSVG value={`${window.location.origin}/login?state=link_account`} size={160} level="H" />
                        </div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">สแกนเพื่อเชื่อมต่อ</h4>
                        <p className="text-xs text-zinc-500 mb-4">หรือถ้าเล่นบนมือถือ สามารถกดปุ่มด้านล่างได้เลย</p>
                        <button 
                            onClick={() => signInWithLine('link_account')}
                            className="px-6 py-2.5 rounded-xl bg-[#06C755] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#06C755]/90 transition-all shadow-sm"
                        >
                            <span>เชื่อมต่อทันที</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Dates (Outside of card, tiny text) */}
            <div className="flex justify-between items-center px-4 pt-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>สมัครสมาชิก: {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH') : '-'}</span>
                <span>ล็อกอินล่าสุด: {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('th-TH') : '-'}</span>
            </div>

        </div>
    );
}
