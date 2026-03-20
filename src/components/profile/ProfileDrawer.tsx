import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
    XMarkIcon, 
    ArrowLeftOnRectangleIcon, 
    UserIcon, 
    Cog6ToothIcon, 
    SparklesIcon,
    EnvelopeIcon,
    LockClosedIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useSystem } from '@/core/container/SystemContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { MembershipCard } from './MembershipCard';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

interface UserProfile {
    displayName?: string;
    photoURL?: string;
    email?: string;
    role?: string;
}

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

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
    
    // Auth Form State
    const [authView, setAuthView] = useState<'invite' | 'login' | 'register'>('invite');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        // Auto-switch view if URL suggests it
        if (router.query.auth === 'register') setAuthView('register');
        else if (router.query.auth === 'login') setAuthView('login');

        const loadProfile = async () => {
            if (!user?.uid || user.uid === 'dev-admin') return;
            setLoading(true);
            try {
                if (!db) throw new Error("Firestore not initialized");
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [isOpen, user, router.query]);

    const handleSignOut = async () => {
        try {
            onClose();
            await logOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            if (authView === 'login') {
                await signIn(email, password);
            } else {
                if (!name) {
                    setFormError('กรุณากรอกชื่อของคุณ');
                    return;
                }
                await signUp(email, password, name);
            }
            // Success will automatically update global 'user' state, 
            // which triggers the conditional rendering below.
        } catch (err: any) {
            setFormError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        }
    };

    const isPremium = user?.membership?.type !== 'free' && user?.membership?.type !== undefined;
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';

    // Safe membership display
    const displayMembership = user?.membership || { type: 'free', status: 'active', startedAt: null, expiresAt: null };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[150]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                                    <div className="flex h-full flex-col bg-white shadow-2xl">
                                        {/* Header */}
                                        <div className="px-4 py-6 sm:px-6 border-b border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <Dialog.Title className="text-xl font-black text-gray-900 tracking-tight">
                                                    {!user ? (authView === 'invite' ? 'สิทธิพิเศษ' : (authView === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')) : 'ข้อมูลส่วนตัว'}
                                                </Dialog.Title>
                                                <button
                                                    type="button"
                                                    className="rounded-2xl p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all active:scale-90"
                                                    onClick={onClose}
                                                >
                                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>

                                        {!user ? (
                                            <div className="flex-1 flex flex-col overflow-y-auto">
                                                {authView === 'invite' ? (
                                                    <div className="flex-1 flex flex-col p-6">
                                                        {/* Welcome Illustration area */}
                                                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                                            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary">
                                                                <SparklesIcon className="w-12 h-12" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="text-2xl font-black text-gray-900">ปลดล็อคความเป็นสตาร์</h3>
                                                                <p className="text-sm font-bold text-gray-400 leading-relaxed px-4">
                                                                    เข้าสู่ระบบเพื่อบันทึกเพลงโปรด เลือกธีมส่วนตัว และขึ้นจอใหญ่ได้ทันที
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="w-full space-y-3 pt-6">
                                                                <button 
                                                                    onClick={() => setAuthView('login')}
                                                                    className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-[1.25rem] font-black text-base transition-all active:scale-95 shadow-xl shadow-gray-200"
                                                                >
                                                                    เข้าสู่ระบบเลย
                                                                </button>
                                                                <button 
                                                                    onClick={() => setAuthView('register')}
                                                                    className="w-full h-14 bg-white border-2 border-gray-100 hover:border-primary/30 text-gray-900 rounded-[1.25rem] font-black text-base transition-all active:scale-95"
                                                                >
                                                                    เริ่มใช้งานฟรี
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Social Options Footer */}
                                                        <div className="pt-8 border-t border-gray-100">
                                                            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">หรือเชื่อมต่อด้วยวิธีอื่น</p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <button 
                                                                    onClick={signInWithLine}
                                                                    className="flex items-center justify-center gap-2 h-12 bg-[#00B900] hover:bg-[#00A000] text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
                                                                >
                                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" className="w-5 h-5 invert brightness-0" alt="LINE" />
                                                                    LINE
                                                                </button>
                                                                <button 
                                                                    onClick={signInWithGoogle}
                                                                    className="flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                                                                >
                                                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                                                    Google
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 p-6">
                                                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                                                            {authView === 'register' && (
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">ชื่อเล่นของคุณ</label>
                                                                    <div className="relative">
                                                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="กรอกชื่อเรียกของคุณ"
                                                                            value={name}
                                                                            onChange={(e) => setName(e.target.value)}
                                                                            className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">อีเมล</label>
                                                                <div className="relative">
                                                                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                    <input 
                                                                        type="email" 
                                                                        placeholder="your@email.com"
                                                                        value={email}
                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">รหัสผ่าน</label>
                                                                <div className="relative">
                                                                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                    <input 
                                                                        type="password" 
                                                                        placeholder="••••••••"
                                                                        value={password}
                                                                        onChange={(e) => setPassword(e.target.value)}
                                                                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {(formError || authError) && (
                                                                <p className="text-[11px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                                                                    {formError || authError}
                                                                </p>
                                                            )}

                                                            <button 
                                                                type="submit"
                                                                disabled={isLoading}
                                                                className="w-full h-14 bg-primary text-white rounded-[1.25rem] font-black text-base shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                                            >
                                                                {isLoading ? <span className="loading loading-spinner" /> : (authView === 'login' ? 'เข้าสู่ระบบเลย' : 'เริ่มใช้งานฟรี')}
                                                            </button>

                                                            <div className="text-center pt-2">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}
                                                                    className="text-xs font-black text-gray-500 hover:text-primary transition-colors"
                                                                >
                                                                    {authView === 'login' ? 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
                                                                </button>
                                                            </div>
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

                                                {/* Menu Sections */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-2">เมนูสมาชิก</h3>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <button className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 transition-all group">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary transition-all">
                                                                    <UserIcon className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-700">บัญชีของฉัน</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => { onClose(); router.push('/settings'); }}
                                                                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 transition-all group"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary transition-all">
                                                                    <Cog6ToothIcon className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-700">ตั้งค่าการใช้งาน</span>
                                                            </button>
                                                            {isAdmin && (
                                                                <button 
                                                                    onClick={() => { onClose(); router.push('/admin'); }}
                                                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 transition-all group"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-all">
                                                                        <SparklesIcon className="w-5 h-5" />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-gray-700">แผงควบคุมแอดมิน</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-gray-100">
                                                        <button 
                                                            onClick={handleSignOut}
                                                            className="flex items-center justify-center gap-3 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
                                                        >
                                                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                                            ออกจากระบบ
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
