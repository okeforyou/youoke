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
        <div className="space-y-10 animate-in fade-in duration-300">
            
            <div className="space-y-4">
                <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">ข้อมูลผู้ใช้ (USER PROFILE)</h3>
                
                <div className="p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-950 shadow-md flex items-center justify-center">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-zinc-400 font-bold text-3xl">{user?.displayName?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-zinc-900 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{user?.displayName || 'ผู้ใช้งานระบบ'}</h2>
                                <p className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {user?.email || 'ไม่มีอีเมล'}
                                </p>
                                <div className="pt-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black tracking-wider uppercase shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        {user?.role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-sm shrink-0 self-start sm:self-center"
                        >
                            ออกจากระบบ
                        </button>
                    </div>

                    <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/50 my-6" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-500 mb-0.5">วันที่สมัครสมาชิก</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-500 mb-0.5">เข้าสู่ระบบล่าสุด</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">สถานะสมาชิก (MEMBERSHIP)</h3>
                
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-6">
                    <MembershipCard />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">การเชื่อมต่อ (CONNECTIONS)</h3>
                
                <div className="p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#06C755]/10 border border-[#06C755]/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#06C755]" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white">เชื่อมต่อ LINE</h4>
                            <p className="text-xs font-medium text-zinc-500 mt-1">รับการแจ้งเตือนและเข้าสู่ระบบด้วย LINE</p>
                        </div>
                    </div>
                    
                    {!isLineConnected ? (
                        <button 
                            onClick={() => setShowLineQR(!showLineQR)}
                            className="px-6 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#06C755]/90 text-white text-sm font-bold transition-all shadow-sm"
                        >
                            เชื่อมต่อ
                        </button>
                    ) : (
                        <span className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold text-xs">เชื่อมต่อแล้ว</span>
                    )}
                </div>

                {showLineQR && !isLineConnected && (
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 shadow-inner">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 mb-6">
                            <QRCodeSVG value={`${window.location.origin}/login?state=link_account`} size={200} level="H" />
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">สแกนเพื่อเชื่อมต่อ</h4>
                        <p className="text-sm text-zinc-500 mb-6">หรือถ้าเล่นบนมือถือ สามารถกดปุ่มด้านล่างได้เลย</p>
                        <button 
                            onClick={() => signInWithLine('link_account')}
                            className="px-8 py-3 rounded-xl bg-[#06C755] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#06C755]/90 transition-all shadow-sm"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                            <span>เชื่อมต่อทันที</span>
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}
