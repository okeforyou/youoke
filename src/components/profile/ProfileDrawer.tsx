import React, { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    UserCircleIcon,
    BookOpenIcon,
    SparklesIcon,
    CreditCardIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon,
    MusicalNoteIcon,
    DevicePhoneMobileIcon,
    TvIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../stores/useUIStore';
import { useSystem } from '../../core/container/SystemContext'; // DI Container
import Link from 'next/link';
import { getUserProfile } from '../../services/userService';
import { UserProfile } from '../../types/subscription';
import { MembershipCard } from './MembershipCard';
import { PackageStore } from './PackageStore';
import { NotificationList } from './NotificationList';
import { cn } from '@/lib/utils';
import { auth } from '@/firebase';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { Zap } from 'lucide-react';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthView = 'invite' | 'login' | 'register';

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { user, signOut: logOut } = useSystem().auth();
    const signIn = useAuthStore(state => state.signIn);
    const signUp = useAuthStore(state => state.signUp);
    const signInWithGoogle = useAuthStore(state => state.signInWithGoogle);
    const signInWithLine = useAuthStore(state => state.signInWithLine);
    const isLoading = useAuthStore(state => state.isLoading);
    const authError = useAuthStore(state => state.error);
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [authView, setAuthView] = useState<AuthView>('invite');
    const { musicTheme, setMusicTheme } = useUIStore();

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (user?.uid) {
                loadProfile();
            } else {
                // Determine initial view from query or default
                if (router.query.auth === 'register' || router.query.mode === 'register') {
                    setAuthView('register');
                } else if (router.query.auth === 'login') {
                    setAuthView('login');
                } else {
                    setAuthView('invite');
                }
            }
        } else {
            // Reset states when closed
            setLocalError('');
            setEmail('');
            setPassword('');
            setName('');
        }
    }, [isOpen, user, router.query]);

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

    const { showConfirm } = useUIStore();

    const handleLogout = () => {
        showConfirm({
            title: 'ออกจากระบบ',
            message: 'คุณต้องการออกจากระบบใช่หรือไม่? คุณจะยังสามารถฟังเพลงฟรีได้ตามโควต้าที่มี',
            confirmText: 'ออกจากระบบ',
            cancelText: 'ยกเลิก',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await logOut();
                    onClose();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        try {
            if (authView === 'login') {
                await signIn(email, password);
            } else {
                await signUp(email, password, name);
            }
            // Success handler is usually in useAuthStore which triggers user state change
        } catch (err: any) {
            let msg = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'อีเมลนี้ถูกใช้งานแล้ว';
            }
            setLocalError(msg);
        }
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

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[150]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                                    <div className="flex h-full flex-col overflow-y-auto bg-white shadow-2xl relative">

                                        {/* Header */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-[110]">
                                            <Dialog.Title className={cn("text-lg font-bold text-gray-900 transition-all", (authView !== 'invite' && !user) ? "translate-x-0" : "")}>
                                                {user ? 'โปรไฟล์ของฉัน' : (
                                                    authView === 'login' ? 'เข้าสู่ระบบ' : 
                                                    authView === 'register' ? 'สมัครสมาชิก' : 'ร่วมเป็นครอบครัว YouOke'
                                                )}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                                                onClick={onClose}
                                            >
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-col">
                                            {loading && !profile ? (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <div className="loading loading-spinner loading-lg text-primary"></div>
                                                </div>
                                            ) : !user ? (
                                                <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-500">
                                                    
                                                    {/* INVITE VIEW */}
                                                    {authView === 'invite' && (
                                                        <div className="flex-1 flex flex-col pt-4">
                                                            <div className="flex flex-col items-center text-center space-y-4 mb-2">
                                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/5">
                                                                    <SparklesIcon className="w-8 h-8" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h3 className="text-xl font-black text-gray-900 leading-tight">ร้องคาราโอเกะไม่จำกัด</h3>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">สมัครสมาชิกใหม่: รับฟรี 1 วัน!</p>
                                                                </div>
                                                            </div>

                                                            <p className="text-gray-500 text-[13px] font-medium text-center mb-10 px-4 leading-relaxed">
                                                                สมัครสมาชิกวันนี้เพื่อปลดล็อกฟีเจอร์พรีเมียม และสนุกกับการร้องคาราโอเกะได้ทุกวัน
                                                            </p>

                                                            <div className="space-y-3 mb-12 w-full max-w-[280px] mx-auto">
                                                                {[
                                                                    { icon: MusicalNoteIcon, text: "ฟังเพลงจาก YouTube ไม่จำกัด", color: "text-blue-500", bg: "bg-blue-50" },
                                                                    { icon: TvIcon, text: "โหมดขึ้นจอ (Cast) ทันที", color: "text-purple-500", bg: "bg-purple-50" },
                                                                    { icon: DevicePhoneMobileIcon, text: "รีโมทมือถือ ควบคุมอิสระ", color: "text-green-500", bg: "bg-green-50" },
                                                                    { icon: ShieldCheckIcon, text: "ไม่มีโฆษณาคั่นความสนุก", color: "text-orange-500", bg: "bg-orange-50" }
                                                                ].map((item, i) => (
                                                                    <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                                                                            <item.icon className="w-5 h-5" />
                                                                        </div>
                                                                        <span className="text-[13px] font-bold text-gray-700 leading-snug">{item.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="w-full space-y-3 mt-auto mb-6">
                                                                <button 
                                                                    onClick={() => setAuthView('register')}
                                                                    className="w-full h-14 rounded-2xl bg-primary hover:brightness-110 text-white font-black text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                                                >
                                                                    สมัครสมาชิกฟรี
                                                                </button>
                                                                <button 
                                                                    onClick={() => setAuthView('login')}
                                                                    className="w-full h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm transition-all active:scale-[0.98] border border-gray-100"
                                                                >
                                                                    เข้าสู่ระบบที่มีอยู่
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* LOGIN / REGISTER VIEW */}
                                                    {(authView === 'login' || authView === 'register') && (
                                                        <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
                                                            <div className="mb-8 text-center">
                                                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                                                                    <Zap size={24} />
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                                    {authView === 'login' ? (
                                                                        <>ยังไม่มีบัญชี? <button onClick={() => setAuthView('register')} className="text-primary hover:underline">สมัครที่นี่</button></>
                                                                    ) : (
                                                                        <>มีบัญชีอยู่แล้ว? <button onClick={() => setAuthView('login')} className="text-primary hover:underline">เข้าสู่ระบบ</button></>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {/* Social Buttons */}
                                                            <div className="grid grid-cols-1 gap-3 mb-8">
                                                                <button onClick={signInWithLine} disabled={isLoading} className="h-12 flex justify-center items-center gap-3 px-6 rounded-2xl bg-[#06C755] hover:brightness-105 text-white font-black transition-all active:scale-95 disabled:opacity-50">
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                                                                    <span className="text-[15px]">ไลน์ Login</span>
                                                                </button>
                                                                <button onClick={signInWithGoogle} disabled={isLoading} className="h-12 flex justify-center items-center gap-3 px-6 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 font-bold transition-all active:scale-95 disabled:opacity-50">
                                                                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                                                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                                                                        <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                                                                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
                                                                    </svg>
                                                                    <span className="text-[15px]">Google Login</span>
                                                                </button>
                                                            </div>

                                                            <div className="relative mb-8 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">หรือแจ้งอีเมล</div>

                                                            <form className="space-y-4" onSubmit={handleSubmit}>
                                                                {(authError || localError) && (
                                                                    <div className="bg-red-50 text-red-500 text-[11px] font-bold p-3 rounded-2xl flex items-center gap-2.5">
                                                                        <Zap size={14} fill="currentColor" />
                                                                        <span>{localError || authError}</span>
                                                                    </div>
                                                                )}

                                                                {authView === 'register' && (
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">ชื่อ</label>
                                                                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 bg-gray-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none text-[15px]" placeholder="ชื่อของคุณ" />
                                                                    </div>
                                                                )}

                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">อีเมล</label>
                                                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 bg-gray-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none text-[15px]" placeholder="example@email.com" />
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">รหัสผ่าน</label>
                                                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 bg-gray-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none text-[15px]" placeholder="••••••••" />
                                                                </div>

                                                                <button type="submit" disabled={isLoading} className="w-full h-14 mt-6 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-base transition-all active:scale-[0.98] disabled:opacity-50">
                                                                    {isLoading ? <span className="loading loading-spinner" /> : (authView === 'login' ? 'เข้าสู่ระบบเลย' : 'เริ่มใช้งานฟรี')}
                                                                </button>
                                                            </form>

                                                            <button 
                                                                onClick={() => setAuthView('invite')}
                                                                className="mt-6 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                ← กลับไปดูสิทธิพิเศษ
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                                                    {/* Compact Profile Header */}
                                                    <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-[2rem] border border-gray-100 mb-8">
                                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary font-black text-2xl overflow-hidden ring-2 ring-white">
                                                            {(profile?.photoURL || user?.photoURL) ? <img src={(profile?.photoURL || user?.photoURL) as string} className="w-full h-full object-cover" /> : <span>{user.email?.[0].toUpperCase()}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h2 className="text-base font-bold text-gray-900 truncate flex items-center gap-1.5">
                                                                {profile?.displayName || user?.displayName || "YouOke User"}
                                                                {isPremium && <SparklesIcon className="w-3.5 h-3.5 text-yellow-500" />}
                                                            </h2>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{isPremium ? 'Smarter Member' : 'เลเวล 1 สมาชิกทั่วไป'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Membership Card */}
                                                    <div className="mb-8">
                                                        <MembershipCard membership={displayMembership as any} role={isAdmin ? 'admin' : 'user'} onUpgrade={() => { onClose(); router.push('/packages'); }} />
                                                    </div>

                                                    {/* settings list */}
                                                    <div className="space-y-6">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">เมนูเข้าถึงด่วน</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {menuItems.map((item, i) => (
                                                                    <Link key={i} href={item.href} onClick={onClose} className="flex flex-col gap-3 p-4 bg-gray-50 hover:bg-white hover:shadow-md rounded-2xl border border-transparent hover:border-gray-100 transition-all group">
                                                                        <item.icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                                                        <span className="text-[11px] font-bold text-gray-700">{item.label}</span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Notification & Logout */}
                                                        <div className="space-y-2">
                                                            <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-red-50/30 hover:bg-red-50 rounded-2xl text-red-600 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                                                    <span className="text-xs font-bold">ออกจากระบบ</span>
                                                                </div>
                                                                <ChevronRightIcon className="w-4 h-4 opacity-40" />
                                                            </button>
                                                        </div>

                                                        <div className="p-4 rounded-[2rem] bg-indigo-50/30 border border-indigo-50">
                                                            <NotificationList />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Social Proof Footer */}
                                        {!user && authView === 'invite' && (
                                            <div className="p-6 border-t border-gray-50 bg-white flex flex-col items-center gap-3">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                                                            <img src={`https://i.pravatar.cc/100?img=${i+30}`} alt="avatar" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400">มีใครบางคนสมัครสมาชิกแล้ว <span className="text-gray-900">10,000+</span> คน</p>
                                            </div>
                                        )}

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div >
                    </div >
                </div >
            </Dialog >
        </Transition.Root >
    );
}
