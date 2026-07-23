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
        <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pb-8">
            
            {/* Header: User Profile & Quick Logout */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-md flex items-center justify-center shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-zinc-400 font-black text-xl">{user?.displayName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                            {user?.displayName || 'ผู้ใช้งานระบบ'}
                        </h2>
                        <p className="text-sm text-zinc-500 font-medium">
                            {user?.email || 'ไม่มีอีเมล'}
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 transition-all shadow-sm"
                    title="ออกจากระบบ"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Main Focus: Membership Status & Upgrade Flow */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Crown className="w-32 h-32" />
                </div>
                
                <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">แพ็กเกจปัจจุบันของคุณ</h3>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="text-3xl font-black text-white mb-2">
                                {user?.role === 'admin' ? "ผู้ดูแลระบบ (ADMIN)" : (profile?.membership?.type === 'lifetime' ? "ตลอดชีพ (PRO)" : "ใช้งานฟรี")}
                                {/* Note: adjust based on actual package types */}
                                {profile?.membership?.type !== 'free' && profile?.membership?.type !== 'lifetime' && profile?.membership?.type !== 'trial' && user?.role !== 'admin' && (
                                    <span>พรีเมียม (Premium)</span>
                                )}
                                {profile?.membership?.type === 'trial' && <span>ทดลองใช้งานฟรี</span>}
                            </div>
                            <div className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                {profile?.membership?.type === 'free' ? 'เริ่มสมัครแพ็กเกจเพื่อใช้งานแบบไร้ขีดจำกัด' : (
                                    user?.role === 'admin' ? 'ไม่มีวันหมดอายุ' :
                                    profile?.membership?.type === 'lifetime' ? 'ใช้งานได้ตลอดชีพ' :
                                    `หมดอายุ: ${profile?.membership?.expiresAt ? new Date(profile.membership.expiresAt).toLocaleDateString('th-TH') : '-'}`
                                )}
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => {
                                onClose();
                                router.push('/packages');
                            }}
                            className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            ดูแพ็กเกจและสมัครสมาชิก
                        </button>
                    </div>
                </div>
            </div>

            {/* Secondary: LINE Connect */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#06C755]/10 text-[#06C755] shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                        </div>
                        <div className="text-left flex-1">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">การเชื่อมต่อ LINE</h4>
                            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">รับการแจ้งเตือนสิทธิ์และอัปเดตต่างๆ</p>
                        </div>
                    </div>
                    
                    {!isLineConnected ? (
                        <button 
                            onClick={() => setShowLineQR(!showLineQR)}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#06C755]/90 text-white text-xs font-bold transition-all shadow-sm"
                        >
                            เชื่อมต่อ LINE
                        </button>
                    ) : (
                        <span className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20 w-full sm:w-auto text-center">
                            เชื่อมต่อแล้ว
                        </span>
                    )}
                </div>

                {/* Optional QR Code Area */}
                {showLineQR && !isLineConnected && (
                    <div className="mt-5 p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 border border-zinc-100 dark:border-zinc-800">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-200 mb-4">
                            <QRCodeSVG value={`${window.location.origin}/login?state=link_account`} size={140} level="H" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">สแกนเพื่อเชื่อมต่อ</h4>
                        <p className="text-[11px] text-zinc-500 mb-4">หรือคลิกปุ่มด้านล่างบนมือถือ</p>
                        <button 
                            onClick={() => signInWithLine('link_account')}
                            className="px-6 py-2.5 rounded-xl bg-[#06C755] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#06C755]/90 transition-all shadow-sm"
                        >
                            <span>เชื่อมต่อทันที</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom: Settings & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Theme Toggle */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ComputerDesktopIcon className="w-5 h-5 text-zinc-400" />
                        <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">โหมดหน้าจอ</h4>
                        </div>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                        <button 
                            onClick={() => { if(isDarkMode) toggleDarkMode(); }}
                            className={cn("px-3 py-1 rounded text-[10px] font-bold transition-all", !isDarkMode ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500")}
                        >
                            สว่าง
                        </button>
                        <button 
                            onClick={() => { if(!isDarkMode) toggleDarkMode(); }}
                            className={cn("px-3 py-1 rounded text-[10px] font-bold transition-all", isDarkMode ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500")}
                        >
                            มืด
                        </button>
                    </div>
                </div>

                {/* Meta info */}
                <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        <span>วันที่สมัคร:</span>
                        <span>{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        <span>ล็อกอินล่าสุด:</span>
                        <span>{user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('th-TH') : '-'}</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
