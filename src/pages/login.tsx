import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import Link from 'next/link';
import { 
    Zap,
    X,
} from 'lucide-react';

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
        <div className="fixed inset-0 min-h-screen bg-gray-50 flex justify-end z-[100] animate-in fade-in duration-300 overflow-hidden">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* MOCK BACKGROUND - TO SHOW THE BLUR EFFECT */}
            <div className="absolute inset-0 z-0">
                {/* Simulated Content to make blur visible */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-8 filter blur-[2px] opacity-20">
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="aspect-video bg-gray-300 rounded-3xl" />
                    ))}
                </div>
            </div>

            {/* BLURRY OVERLAY - Exact match to ProfileDrawer */}
            <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md transition-all active:backdrop-blur-lg" onClick={() => router.push('/')} />

            {/* THE DRAWER PANEL */}
            <div className="relative z-20 w-screen max-w-sm h-full bg-white shadow-[0_0_100px_rgba(0,0,0,0.15)] animate-in slide-in-from-right duration-500 sm:duration-700 overflow-y-auto flex flex-col pointer-events-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-[110]">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        {isLogin ? 'ร่วมเป็นครอบครัว YouOke' : 'สมัครสมาชิกใหม่'}
                    </h3>
                    <button 
                        onClick={() => router.push('/')} 
                        className="rounded-full p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    
                    {/* Welcome Section */}
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/5">
                            <Zap size={40} className="animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-gray-900 leading-tight">
                                {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สมัครสมาชิกฟรี'}
                            </h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {isLogin ? (
                                    <>ยังไม่มีบัญชี? <button onClick={() => setIsLogin(false)} className="text-primary hover:underline underline-offset-4">สมัครที่นี่เพื่อใช้งานฟรี</button></>
                                ) : (
                                    <>มีบัญชีอยู่แล้ว? <button onClick={() => setIsLogin(true)} className="text-primary hover:underline underline-offset-4">เข้าสู่ระบบตรงนี้</button></>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="space-y-3 mb-10 w-full">
                        <button onClick={signInWithLine} disabled={isLoading || lineLoading} className="w-full h-14 rounded-2xl bg-[#06C755] hover:brightness-105 text-white font-black text-base shadow-lg shadow-[#06C755]/10 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                            <span>เข้าใช้งานด้วย LINE</span>
                        </button>
                        <button onClick={signInWithGoogle} disabled={isLoading} className="w-full h-14 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                                <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
                            </svg>
                            <span>เข้าใช้งานด้วย Google</span>
                        </button>
                    </div>

                    <div className="relative mb-10 text-center">
                        <span className="relative z-10 px-4 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">หรือลงทะเบียน</span>
                        <div className="absolute top-1/2 left-0 right-0 border-t border-gray-100" />
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {(error || localError) && (
                            <div className="bg-red-50 text-red-500 text-[11px] font-bold p-3 rounded-2xl flex items-center gap-2.5 animate-in shake duration-500">
                                <Zap size={14} fill="currentColor" />
                                <span>{localError || error}</span>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">ชื่อ</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 bg-gray-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none text-[15px]" placeholder="ระบุชื่อเรียกของคุณ" />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">อีเมล</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none text-[15px]" placeholder="example@email.com" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">รหัสผ่าน</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 text-gray-900 font-bold transition-all outline-none text-[15px]" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full h-14 mt-6 rounded-2xl bg-primary hover:brightness-110 text-white font-black text-base shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-10">
                            {isLoading ? <span className="loading loading-spinner loading-xs" /> : <span>{isLogin ? 'เข้าสู่ระบบเลย' : 'เริ่มใช้งานฟรี'}</span>}
                        </button>
                    </form>

                    <div className="mt-auto pt-8 border-t border-gray-50 pb-6 text-center">
                        <p className="text-[10px] text-gray-400 font-medium px-4 leading-relaxed tracking-tight">
                            การดำเนินการต่อแสดงว่าคุณยอมรับ <Link href="/terms" className="underline font-bold hover:text-gray-600 transition-colors">ข้อตกลงและนโยบายความเป็นส่วนตัว</Link> ขอบคุณครับ
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
