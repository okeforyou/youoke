import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Zap,
} from 'lucide-react';
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Toggle Mode Logic
    useEffect(() => {
        if (router.isReady) {
            setIsLogin(router.query.mode !== 'register');
        }
    }, [router.isReady, router.query.mode]);

    // Redirect to HOME (/) after login/signup
    useEffect(() => {
        if (!router.isReady || isLoading || !mounted) return;
        if (user) {
            let redirectUrl = (router.query.redirect as string) || '/';
            if (redirectUrl === '/login' || redirectUrl === router.asPath) {
                redirectUrl = '/';
            }
            router.replace(redirectUrl);
        }
    }, [user, router.isReady, isLoading, router.query, router.asPath, mounted]);

    // Handle LINE Callback
    useEffect(() => {
        const { code } = router.query;
        if (code && !user && mounted) {
            setLineLoading(true);
            const verifyLineLogin = async () => {
                try {
                    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://play.okeforyou.com';
                    let redirectUri = `${origin}/login/`;
                    const res = await fetch('/api/auth/line-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri })
                    });
                    if (!res.ok) throw new Error('Failed to verify LINE login');
                    const { token } = await res.json();
                    await signInWithCustomToken(token);
                } catch (err: any) {
                    setLocalError('การเข้าสู่ระบบด้วย LINE ล้มเหลว');
                } finally {
                    setLineLoading(false);
                    router.replace('/login', undefined, { shallow: true });
                }
            };
            verifyLineLogin();
        }
    }, [router.query, user, mounted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password, name);
            }
        } catch (err: any) {
            let msg = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'อีเมลนี้ถูกใช้งานแล้ว';
            } else if (err.code === 'auth/weak-password') {
                msg = 'รหัสผ่านต้องมี 6 ตัวขึ้นไป';
            }
            setLocalError(msg);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 relative">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* Header - Simple Back Button */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-end items-center pointer-events-none">
                <Link href="/" className="pointer-events-auto flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <ArrowLeft size={14} />
                    <span>กลับหน้าหลัก</span>
                </Link>
            </div>

            {/* Auth Form Container - Sharp Card UI */}
            <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <div className="mb-8 text-center">
                    <h2 className="text-xl font-black text-gray-900 mb-1.5 tracking-tight">
                        {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
                    </h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                        {isLogin ? (
                            <>No account? <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">Sign up</button></>
                        ) : (
                            <>Have account? <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">Log in</button></>
                        )}
                    </p>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-1 gap-2.5 mb-8">
                        <button onClick={signInWithLine} disabled={isLoading || lineLoading} className="h-12 flex justify-center items-center gap-3 px-6 rounded-xl bg-[#06C755] hover:brightness-105 text-white font-black transition-all active:scale-95 disabled:opacity-50">
                        {lineLoading ? <span className="loading loading-spinner loading-xs" /> : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                                <span className="text-sm">LINE Login</span>
                            </>
                        )}
                    </button>
                    <button onClick={signInWithGoogle} disabled={isLoading} className="h-12 flex justify-center items-center gap-3 px-6 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 font-bold transition-all active:scale-95 disabled:opacity-50">
                        {isLoading ? <span className="loading loading-spinner loading-xs" /> : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                                    <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
                                </svg>
                                <span className="text-sm">Google Login</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="relative mb-8 text-center">
                    <span className="relative z-10 px-4 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">or email</span>
                    <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100" />
                </div>

                <form className="space-y-3.5" onSubmit={handleSubmit}>
                    {(error || localError) && (
                        <div className="bg-red-50 text-red-500 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2.5 animate-in shake duration-500">
                            <Zap size={14} fill="currentColor" />
                            <span>{localError || error}</span>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Name</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl px-4 text-gray-900 font-bold transition-all outline-none text-sm" placeholder="Your name" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl px-4 text-gray-900 font-bold transition-all outline-none text-sm" placeholder="name@example.com" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Password</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl px-4 text-gray-900 font-bold transition-all outline-none text-sm" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full h-12 mt-4 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-sm shadow-xl shadow-gray-900/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                        {isLoading ? <span className="loading loading-spinner loading-xs" /> : <span>{isLogin ? 'Login' : 'Create Account'}</span>}
                    </button>
                </form>
            </div>

            <p className="mt-8 text-center text-[10px] text-gray-400 font-medium px-10">
                By continuing, you agree to our <Link href="/terms" className="underline font-bold hover:text-gray-600 transition-colors">Terms & Privacy Policy</Link>
            </p>
        </div>
    );
}
