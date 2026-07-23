import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSystem } from '@/core/container/SystemContext';
import { useUIStore } from '@/stores/useUIStore';
import { getUserProfile } from '@/services/userService';
import { UserProfile } from '@/types/subscription';
import { CalendarIcon, ClockIcon, KeyIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileTab({ onClose }: { onClose: () => void }) {
    const { user, signOut } = useSystem().auth();
    const router = useRouter();
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
                router.push('/login');
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center p-20"><div className="loading loading-spinner loading-lg text-primary"></div></div>;
    }

    const providerId = user?.providerData?.[0]?.providerId || 'password';
    const providerName = providerId.includes('google') ? 'Google' : providerId.includes('line') ? 'LINE' : 'Email';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* User Profile Section */}
            <div>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-1">ข้อมูลผู้ใช้ (USER PROFILE)</h3>
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm relative">
                    
                    {/* Logout Button (Top Right in Card) */}
                    <button
                        onClick={handleLogout}
                        className="absolute top-6 right-6 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/20 dark:hover:bg-rose-500/20 text-xs font-bold transition-all"
                    >
                        ออกจากระบบ
                    </button>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center shrink-0">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-zinc-400 font-black text-2xl">{user?.displayName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center ring-2 ring-white">
                                <UserIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>

                        {/* Name & Details */}
                        <div className="flex-1 pt-1">
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">
                                {user?.displayName || 'ผู้ใช้งานระบบ'}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-3">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {user?.email || 'ไม่มีอีเมล'}
                            </div>
                            <div className="inline-flex px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                {user?.role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                        
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                                <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400">วันที่สมัครสมาชิก</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                                    {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400">เข้าสู่ระบบล่าสุด</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                                    {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                <KeyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400">เข้าสู่ระบบด้วย</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{providerName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                                <CheckBadgeIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400">สถานะอีเมล</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                                    {user?.emailVerified ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ยืนยัน'}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Note: Usage stats hidden per user request */}

            {/* Membership Details */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">แพ็กเกจบัญชี (Membership Status)</h3>
                </div>
                <p className="text-xs text-zinc-500 font-medium mb-6 ml-11">
                    ระบบ YouOke รองรับการอัปเกรดเพื่อเพิ่มขีดความสามารถในการร้องเพลงแบบไร้ขีดจำกัด
                </p>

                <div className="space-y-4 ml-11">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">แพ็กเกจปัจจุบัน</p>
                            <p className="text-xs font-medium text-zinc-500">
                                {user?.role === 'admin' ? 'ไม่มีวันหมดอายุ' :
                                profile?.membership?.type === 'free' ? 'ใช้งานแบบจำกัด' :
                                profile?.membership?.type === 'lifetime' ? 'ใช้งานได้ตลอดชีพ' :
                                `หมดอายุ: ${profile?.membership?.expiresAt ? new Date(profile.membership.expiresAt).toLocaleDateString('th-TH') : '-'}`
                                }
                            </p>
                        </div>
                        <div className="font-black text-indigo-600 dark:text-indigo-400">
                            {user?.role === 'admin' ? "ผู้ดูแลระบบ (ADMIN)" : (profile?.membership?.type === 'lifetime' ? "ตลอดชีพ (PRO)" : "ใช้งานฟรี")}
                        </div>
                    </div>
                </div>

                <div className="mt-6 ml-11 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-100 dark:border-indigo-500/10">
                    <div className="flex items-start gap-3 text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-xs font-medium leading-relaxed">
                            <strong className="font-bold">เคล็ดลับความคุ้มค่า:</strong> อัปเกรดเป็น VIP เพื่อปลดล็อกฟีเจอร์แยกเสียงร้อง AI และร้องเพลงแบบไม่มีโฆษณาคั่น ร้องสนุกไม่สะดุด!
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            onClose();
                            router.push('/packages');
                        }}
                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap"
                    >
                        ดูแพ็กเกจทั้งหมด
                    </button>
                </div>
            </div>

        </div>
    );
}

function UserIcon(props: React.ComponentProps<'svg'>) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    )
}
