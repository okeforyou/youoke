import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import Link from 'next/link';
import { 
    CheckCircleIcon, 
} from '@heroicons/react/24/solid';
import { 
    ArrowLeft, 
    Zap,
} from 'lucide-react';
import { useSystemConfig } from '../hooks/useSystemConfig';
import clsx from 'clsx';

export default function LoginPage() {
    const router = useRouter();
    const { user, signInWithGoogle, signInWithLine, signInWithCustomToken, signIn, signUp, error, isLoading } = useAuthStore();

    const [isLogin, setIsLogin] = useState(true);
    const [lineLoading, setLineLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [name, setName] = useState('');

    // Toggle Mode Logic
    useEffect(() => {
        if (router.isReady) {
            if (router.query.mode === 'register') {
                setIsLogin(false);
            } else {
                setIsLogin(true);
            }
        }
    }, [router.isReady, router.query.mode]);

    // Redirect if logged in
    useEffect(() => {
        if (!router.isReady || isLoading) return;
        if (user) {
            const isNewUser = !user.membership || user.membership.type === 'free' || !user.membership.startedAt;
            let redirectUrl = (router.query.redirect as string) || '/';
            if (isNewUser && redirectUrl === '/') {
                redirectUrl = '/packages';
            }
            if (redirectUrl === router.asPath) return;
            router.replace(redirectUrl);
        }
    }, [user, router.isReady, isLoading, router.query, router.asPath]);

    // Handle LINE Callback
    useEffect(() => {
        const { code } = router.query;
        if (code && !user) {
            setLineLoading(true);
            const verifyLineLogin = async () => {
                try {
                    let redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/login/` : 'https://play.okeforyou.com/login/';
                    const res = await fetch('/api/auth/line-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri })
                    });
                    if (!res.ok) throw new Error('Failed to verify LINE login');
                    const { token } = await res.json();
                    await signInWithCustomToken(token);
                } catch (err: any) {
                    setLocalError('การเข้าสู่ระบบด้วย LINE ล้มเหลว กรุณาลองใหม่');
                } finally {
                    setLineLoading(false);
                    router.replace('/login', undefined, { shallow: true });
                }
            };
            verifyLineLogin();
        }
    }, [router.query, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
        } catch (err: any) {
            let msg = err.message;
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'อีเมลนี้ถูกใช้งานแล้ว';
            } else if (err.code === 'auth/weak-password') {
                msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
            }
            setLocalError(msg);
        }
    };

    const handleGoogleLogin = async () => {
        setLocalError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setLocalError(err.message || 'เข้าสู่ระบบด้วย Google ล้มเหลว');
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-6 relative">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* Header / Nav */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none">
                <Link href="/" className="pointer-events-auto flex items-center gap-2 group p-2 rounded-xl hover:bg-white transition-all">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <span className="text-xl font-black text-white">Y</span>
                    </div>
                    <span className="font-black text-gray-900 text-lg">YouOke</span>
                </Link>

                <Link href="/" className="pointer-events-auto flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    <ArrowLeft size={16} />
                    <span>กลับหน้าหลัก</span>
                </Link>
            </div>

            {/* Auth Form Container - Centered */}
            <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-gray-100 transition-all">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">
                            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            {isLogin ? (
                                <>ยังไม่มีบัญชีใช่หรือไม่? <button onClick={() => setIsLogin(false)} className="text-red-500 font-bold hover:underline decoration-2 underline-offset-4">สร้างบัญชีใหม่</button></>
                            ) : (
                                <>มีบัญชีอยู่แล้วใช่หรือไม่? <button onClick={() => setIsLogin(true)} className="text-blue-500 font-bold hover:underline decoration-2 underline-offset-4">เข้าสู่ระบบที่นี่</button></>
                            )}
                        </p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-1 gap-3 mb-8">
                         <button onClick={signInWithLine} disabled={isLoading || lineLoading} className="h-14 flex justify-center items-center gap-3 px-6 rounded-2xl bg-[#06C755] hover:bg-[#05b34d] text-white font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50">
                            {lineLoading ? <span className="loading loading-spinner loading-sm" /> : (
                                <>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                                    <span className="text-[15px]">เข้าโดย LINE</span>
                                </>
                            )}
                        </button>
                        <button onClick={handleGoogleLogin} disabled={isLoading} className="h-14 flex justify-center items-center gap-3 px-6 rounded-2xl bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-black hover:shadow-sm hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50">
                            {isLoading ? <span className="loading loading-spinner loading-sm" /> : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                                        <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
                                    </svg>
                                    <span className="text-[15px]">เข้าโดย Google</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative mb-8 text-center">
                        <span className="relative z-10 px-4 bg-white text-[11px] font-black text-gray-400 uppercase tracking-widest">หรือใช้อีเมล</span>
                        <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100" />
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {(error || localError) && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                                <Zap size={16} fill="currentColor" />
                                <span>{localError || error}</span>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">ชื่อเรียก</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-14 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none" placeholder="เช่น คุณใจดี" />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">อีเมล</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none" placeholder="name@example.com" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">รหัสผ่าน</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={isLoading} className={clsx(
                            "w-full h-14 mt-4 rounded-2xl font-black text-[17px] text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2",
                            isLogin ? "bg-gray-900 shadow-gray-900/10 hover:bg-black" : "bg-primary shadow-primary/20 hover:brightness-110"
                        )}>
                            {isLoading ? (
                                <span className="loading loading-spinner" />
                            ) : (
                                <span>{isLogin ? 'เข้าสู่ระบบ' : 'เริ่มใช้งานเลย!'}</span>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-[11px] text-gray-400 font-medium">
                    ด้วยการดำเนินการต่อ คุณยอมรับ <Link href="/terms" className="underline font-bold hover:text-gray-600 transition-colors">ข้อตกลงและนโยบายความเป็นส่วนตัว</Link> ขอบคุณครับ
                </p>
            </div>
        </div>
    );
}
