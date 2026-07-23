import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSystem } from '@/core/container/SystemContext';
import { useUIStore } from '@/stores/useUIStore';
import { getUserProfile } from '@/services/userService';
import { UserProfile } from '@/types/subscription';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { MembershipCard } from '@/components/profile/MembershipCard';

export default function ProfileTab({ onClose }: { onClose: () => void }) {
    const { user, signOut, signInWithLine } = useSystem().auth();
    const router = useRouter();
    const { showConfirm } = useUIStore();
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
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
            
            {/* User Profile Card */}
            <div className="p-5 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 shadow-sm flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-zinc-400 font-bold text-xl">{user?.displayName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                            {user?.displayName || 'ผู้ใช้งานระบบ'}
                        </h2>
                        <p className="text-sm text-zinc-500 font-medium mt-0.5">
                            {user?.email || 'ไม่มีอีเมล'}
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={handleLogout}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all shrink-0"
                    title="ออกจากระบบ"
                >
                    <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Membership Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-2">
                <MembershipCard 
                    membership={(profile?.membership as any) || { type: 'free', status: 'active', expiresAt: null }}
                    role={user?.role || profile?.role}
                    onUpgrade={() => {
                        onClose();
                        router.push('/packages');
                    }}
                />
            </div>

            {/* Account Info & Connections Group */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                
                {/* LINE Connection */}
                <div className="p-4 sm:p-5 flex items-center justify-between transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#06C755]/10 text-[#06C755]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">เชื่อมต่อ LINE</h4>
                            <p className="text-xs font-medium text-zinc-500 mt-0.5">รับการแจ้งเตือนและเข้าสู่ระบบด้วย LINE</p>
                        </div>
                    </div>
                    
                    {!isLineConnected ? (
                        <button 
                            onClick={() => setShowLineQR(!showLineQR)}
                            className="px-5 py-2 rounded-xl bg-[#06C755] hover:bg-[#06C755]/90 text-white text-xs font-bold transition-all shadow-sm shrink-0"
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

                {/* Stats: Registration Date */}
                <div className="p-4 sm:p-5 flex justify-between items-center text-sm">
                    <span className="font-bold text-zinc-500">วันที่สมัครสมาชิก</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                        {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                    </span>
                </div>

                {/* Stats: Last Login */}
                <div className="p-4 sm:p-5 flex justify-between items-center text-sm">
                    <span className="font-bold text-zinc-500">เข้าสู่ระบบล่าสุด</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                        {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                    </span>
                </div>
            </div>

        </div>
    );
}
