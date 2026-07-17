import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSystem } from '@/core/container/SystemContext';
import { useUIStore } from '@/stores/useUIStore';
import { getUserProfile } from '@/services/userService';
import { UserProfile } from '@/types/subscription';
import { ArrowRightOnRectangleIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { NotificationList } from '@/components/profile/NotificationList';

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

    const isLineConnected = !!profile?.lineUserId;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">โปรไฟล์บัญชี</h2>
                <p className="text-sm font-bold text-zinc-500 mt-2">ข้อมูลส่วนตัว และการเชื่อมต่อ</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">ข้อมูลผู้ใช้</h3>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white dark:bg-zinc-800 border-4 border-white dark:border-zinc-800 shadow-sm flex items-center justify-center">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-black text-zinc-400">{user?.displayName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-zinc-900 dark:text-white">{profile?.displayName || user?.displayName || 'ผู้ใช้งาน'}</h4>
                        <p className="text-sm font-bold text-zinc-500">{profile?.email || user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">การเชื่อมต่อ</h3>
                
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#06C755]/10 border border-[#06C755]/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#06C755]" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                        </div>
                        <div>
                            <h4 className="text-[15px] font-black text-zinc-900 dark:text-white">เชื่อมต่อ LINE</h4>
                            <p className={cn("text-xs font-bold mt-1", isLineConnected ? "text-emerald-500" : "text-zinc-500")}>
                                {isLineConnected ? `เชื่อมต่อเป็น ${profile.lineDisplayName || 'บัญชี LINE'}` : 'รับการแจ้งเตือนสิทธิ์ต่างๆ ผ่าน LINE'}
                            </p>
                        </div>
                    </div>
                    
                    {!isLineConnected ? (
                        <button 
                            onClick={() => setShowLineQR(!showLineQR)}
                            className="px-6 py-2.5 rounded-full bg-[#06C755] text-white text-sm font-black transition-all active:scale-95 shadow-sm"
                        >
                            เชื่อมต่อ
                        </button>
                    ) : (
                        <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black">สำเร็จ</span>
                    )}
                </div>

                {showLineQR && !isLineConnected && (
                    <div className="p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                        <div className="bg-white p-4 rounded-3xl border-4 border-zinc-50 mb-6">
                            <QRCodeSVG value={`${window.location.origin}/login?state=link_account`} size={200} level="H" />
                        </div>
                        <h4 className="text-xl font-black text-zinc-900 dark:text-white mb-2">สแกนเพื่อเชื่อมต่อ</h4>
                        <p className="text-sm font-bold text-zinc-500 mb-6">หรือถ้าเล่นบนมือถือ สามารถกดปุ่มด้านล่างได้เลย</p>
                        <button 
                            onClick={() => signInWithLine('link_account')}
                            className="px-8 py-3.5 rounded-2xl bg-[#06C755] text-white font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-none border-none"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304z"/></svg>
                            <span className="text-lg">เชื่อมต่อทันที</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <BellAlertIcon className="w-4 h-4" /> การแจ้งเตือน
                </h3>
                <div className="rounded-[24px] border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-2 overflow-hidden h-[300px] overflow-y-auto no-scrollbar">
                    <NotificationList />
                </div>
            </div>

            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-[20px] bg-rose-50 dark:bg-rose-500/10 text-rose-500 font-black hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98]"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" strokeWidth={2.5} />
                    ออกจากระบบ
                </button>
            </div>
        </div>
    );
}
