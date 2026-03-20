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
    Music, 
    Smartphone, 
    Cast, 
    Mic2, 
    ShieldCheck, 
    Infinity as InfinityIcon,
    Zap,
    Heart,
    Star,
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
    const [showIntro, setShowIntro] = useState(true); // New: For Mobile Intro Step
    const [acceptedTerms, setAcceptedTerms] = useState(false); // New: Terms agreement
    const [isSubmitting, setIsSubmitting] = useState(false); // New: For actionable loading only

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

    // Config
    const isRegistrationEnabled = true;
    const { config } = useSystemConfig();
    
    // Premium YouOke Features (Detailed & Balanced for 2 Cols)
    const premiumFeatures = [
        { icon: Cast, title: "แคสต์ขึ้นจอ", desc: "TV จอยักษ์ คุมผ่านมือถือแบบ DJ", color: "text-blue-600", bg: "bg-blue-50" },
        { icon: Mic2, title: "ค้นด้วยเสียง", desc: "พูดชื่อศิลปินหรือเพลงได้ทันที", color: "text-red-600", bg: "bg-red-50" },
        { icon: Smartphone, title: "รีโมทอัจฉริยะ", desc: "เพื่อนช่วยจัดคิว ร้องได้ทุกมุมห้อง", color: "text-green-600", bg: "bg-green-50" },
        { icon: Music, title: "คลังเพลงไม่อั้น", desc: "อัปเดตเพลงใหม่และยอดนิยมทุกวัน", color: "text-purple-600", bg: "bg-purple-50" },
        { icon: ShieldCheck, title: "ไร้โฆษณาคั่น", desc: "สนุกต่อเนื่อง ไม่มีโฆษณากวนใจ", color: "text-emerald-600", bg: "bg-emerald-50" },
        { icon: Heart, title: "โหมดส่วนตัว", desc: "เซฟเพลงโปรดและเพลย์ลิสต์ส่วนตัว", color: "text-pink-600", bg: "bg-pink-50" },
    ];

    // Redirect if logged in (Instant)
    useEffect(() => {
        if (!router.isReady) return;
        
        if (user) {
            // 🚀 ALWAYS REDIRECT TO HOME (as requested)
            const redirectUrl = (router.query.redirect as string) || '/';
            if (redirectUrl === router.asPath) return;
            router.replace(redirectUrl);
        }
    }, [user, router.isReady, router.query, router.asPath]);

    // Handle LINE Callback
    useEffect(() => {
        const { code } = router.query;
        if (code && !user) {
            setLineLoading(true);
            const verifyLineLogin = async () => {
                try {
                    const redirectUri = typeof window !== 'undefined' 
                        ? `${window.location.origin}/login/` 
                        : '';
                    
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
                    setLineLoading(false); // ปลดล็อกเฉพาะตอน Error
                }
                // 🚀 SPEED FIX: ไม่ต้องล้าง URL กลับไปที่ /login แล้ว เพราะแอปกำลังจะถูกดีดไปหน้าแรก
                // และปล่อย spinner ให้หมุนค้างไว้เนียนๆ จนกว่าจะเปลี่ยนหน้าเสร็จสิ้น
            };
            verifyLineLogin();
        }
    }, [router.query, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setIsSubmitting(true);
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

    const handleGoogleLogin = () => {
        // 🚀 SYNCHRONOUS FIX FOR SAFARI POP-UP:
        // By NOT making this function async and NOT calling setLocalError('') here,
        // we prevent React from queueing a render cycle before opening the popup.
        // This ensures the popup counts as a "direct user action" and doesn't get blocked.
        setIsSubmitting(true);
        signInWithGoogle().catch((err: any) => {
            setIsSubmitting(false);
            setLocalError(err.message || 'เข้าสู่ระบบด้วย Google ล้มเหลว');
        });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row relative">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* 🚀 PREMIUM LOADING OVERLAY (Action-Aware) */}
            {((isLoading && isSubmitting) || lineLoading) && (
                <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce mb-6">
                         <span className="text-2xl font-black text-white">Y</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-gray-900 font-black text-lg">กำลังประมวลผล...</span>
                        <span className="text-gray-400 text-sm font-medium px-8 text-center">กรุณารอสักครู่ ระบบกำลังพาคุณเข้าสู่ YouOke</span>
                    </div>
                    <div className="mt-8 flex gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                    </div>
                </div>
            )}

            {/* HEADER: Back Button - Fixed for Native App Feel */}
            <div className={clsx(
                "fixed top-0 left-0 right-0 z-[100] p-6 flex items-center justify-between pointer-events-none transition-opacity",
                !showIntro ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
            )}>
                <Link href="/" className="pointer-events-auto flex items-center gap-2 text-sm font-black text-gray-700 hover:text-black transition-all bg-white px-5 py-2.5 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-95">
                    <ArrowLeft size={18} strokeWidth={3} />
                    <span>กลับ</span>
                </Link>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex flex-col lg:flex-row min-h-screen bg-white relative">
                
                {/* LEFT SIDE: Mobile Intro (Step 1) / Desktop Sidebar */}
                <div className={clsx(
                    "w-full lg:w-[45%] xl:w-[50%] flex flex-col justify-between lg:justify-center p-6 lg:p-24 pt-24 lg:pt-24 bg-white lg:border-r border-gray-100 min-h-screen lg:h-auto",
                    !showIntro ? "hidden lg:flex" : "flex"
                )}>
                    <div className="max-w-xl mx-auto lg:mx-0 flex flex-col h-full lg:h-auto justify-between lg:justify-center lg:gap-12">
                        {/* 1. Hero Content */}
                        <div className="mt-4 lg:mt-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
                                <Zap size={14} fill="currentColor" />
                                <span>ทดลองใช้ฟรี 1 วัน</span>
                            </div>

                            <p className="text-gray-500 text-[15px] lg:text-lg font-medium mb-8 lg:mb-12">
                               {isLogin ? "เข้าสู่ระบบเพื่อร้องเพลงที่ชอบและจัดการคิวเพลงของคุณผ่านระบบ YouTube API ที่ลื่นไหลที่สุด" : "สมัครสมาชิกเพื่อสัมผัสประสบการณ์คาราโอเกะแบบใหม่ที่คุมได้จากมือคุณ"}
                            </p>

                            {/* Feature Grid: 2 Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 lg:gap-x-10 gap-y-6 lg:gap-y-10">
                                {premiumFeatures.map((f, i) => (
                                    <div key={i} className="flex flex-row items-start text-left gap-4 group">
                                        <div className={clsx("w-10 h-10 lg:w-12 lg:h-12 shrink-0 rounded-xl lg:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", f.bg, f.color)}>
                                            <f.icon size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-[14px] lg:text-[16px] leading-tight">{f.title}</h3>
                                            <p className="text-gray-400 text-[12px] lg:text-[13px] leading-snug mt-1">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. MOBILE ONLY ACTIONS (Bottom Space) */}
                        <div className="lg:hidden space-y-3 mt-12 mb-6">
                            <button 
                                onClick={() => { setIsLogin(false); setShowIntro(false); }}
                                className="w-full h-14 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-900/10 active:scale-95 transition-all text-[17px]"
                            >
                                สมัครสมาชิกฟรี
                            </button>
                            <button 
                                onClick={() => { setIsLogin(true); setShowIntro(false); }}
                                className="w-full h-14 bg-white border-2 border-gray-100 text-gray-900 font-bold rounded-2xl active:scale-95 transition-all text-[17px]"
                            >
                                เข้าสู่ระบบ
                            </button>
                        </div>

                        {/* Desktop & Mobile Social Proof */}
                        <div className="flex mt-8 lg:mt-12 pt-8 border-t border-gray-50 items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-bold text-gray-500">
                                มีผู้ใช้งาน <span className="text-gray-900">จำนวนมาก</span> กำลังร้องเพลงอยู่ในขณะนี้
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Auth Form (Step 2) */}
                <div className={clsx(
                    "w-full lg:w-[55%] xl:w-[50%] flex flex-col justify-center items-center py-12 px-6 lg:px-24 bg-[#fcfcfd] lg:bg-transparent min-h-screen lg:min-h-0",
                    showIntro ? "hidden lg:flex" : "flex animate-in fade-in slide-in-from-bottom-4 duration-500"
                )}>
                    {/* BACK TO INTRO BUTTON (Mobile Only) */}
                    <button onClick={() => setShowIntro(true)} className="lg:hidden absolute top-8 left-6 flex items-center gap-2 text-sm font-bold text-gray-400 p-2">
                        <ArrowLeft size={18} />
                        <span>กลับ</span>
                    </button>

                    <div className="w-full max-w-[400px]">
                        {/* Form Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-gray-100 transition-all">
                            <div className="mb-10 text-center">
                                <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                                    {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี'}
                                </h2>
                                <p className="text-gray-500 text-sm font-medium">
                                    {isLogin ? (
                                        <>ยังไม่มีบัญชี? <button onClick={() => setIsLogin(false)} className="text-red-500 font-bold hover:underline decoration-2 underline-offset-4">สร้างใหม่ได้ที่นี่</button></>
                                    ) : (
                                        <>มีบัญชีอยู่แล้ว? <button onClick={() => setIsLogin(true)} className="text-blue-500 font-bold hover:underline decoration-2 underline-offset-4">เข้าสู่ระบบ</button></>
                                    )}
                                </p>
                            </div>

                            {/* Social Login: STABLE & FAST FAST FAST */}
                            <div className="grid grid-cols-1 gap-3 mb-8">
                                <button onClick={signInWithLine} disabled={isLoading || lineLoading || !acceptedTerms} className="h-14 flex justify-center items-center gap-3 px-6 rounded-2xl bg-[#06C755] hover:bg-[#05b34d] text-white font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:cursor-not-allowed">
                                    {lineLoading ? <span className="loading loading-spinner loading-sm" /> : (
                                        <>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.3c0-4.6-4.6-8.3-10.4-8.3C7.8 2 3.1 5.7 3.1 10.3c0 4.1 3.7 7.5 8.7 8.2.3.1.8.2 1 .5.1.1.2.4.1.6l-.3 1.9c-.1.4-.4 1.5-.4 1.5l3.2-1.9s1.4-.8 2-.7l.1-.1c4.5-1.1 6.5-4.5 6.5-10z"/></svg>
                                            <span className="text-[15px]">เข้าสู่ระบบด้วย LINE</span>
                                        </>
                                    )}
                                </button>
                                <button onClick={handleGoogleLogin} disabled={isLoading || !acceptedTerms} className="h-14 flex justify-center items-center gap-3 px-6 rounded-2xl bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-black hover:shadow-sm hover:-translate-y-0.5 transition-all active:scale-95 disabled:cursor-not-allowed">
                                    {isLoading ? <span className="loading loading-spinner loading-sm" /> : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                                                <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
                                            </svg>
                                            <span className="text-[15px]">Google Login</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {/* Terms Checkbox */}
                            <div className="mb-6 px-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center shrink-0 mt-0.5">
                                        <input 
                                            type="checkbox" 
                                            checked={acceptedTerms} 
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="peer w-5 h-5 border-2 border-gray-200 rounded-lg appearance-none checked:bg-gray-900 checked:border-gray-900 transition-all cursor-pointer" 
                                        />
                                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 left-1 transition-opacity pointer-events-none" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5 6 4.5 9 10.5 1"></polyline></svg>
                                    </div>
                                    <span className="text-[13px] font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors">
                                        ฉันได้อ่านและยอมรับ <Link href="/terms" className="text-red-500 underline decoration-red-200 hover:decoration-red-500 transition-all">ข้อตกลงและเงื่อนไขการใช้งาน</Link> ของ YouOke แล้ว
                                    </span>
                                </label>
                            </div>

                        <div className="relative mb-8 text-center">
                            <span className="relative z-10 px-4 bg-white text-[11px] font-black text-gray-400 uppercase tracking-widest">หรือใช้อีเมล</span>
                            <div className="absolute top-1/2 left-0 right-0 border-t border-gray-50" />
                        </div>

                        {/* Traditional Form */}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {(error || localError) && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
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

                            <button type="submit" disabled={isLoading || !acceptedTerms} className={clsx(
                                    "w-full h-14 mt-4 rounded-2xl font-black text-[17px] text-white shadow-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2",
                                    isLogin ? "bg-gray-900 shadow-gray-900/10 hover:bg-black" : "bg-primary shadow-primary/20 hover:brightness-110"
                                )}>
                                {isLoading ? (
                                    <span className="loading loading-spinner" />
                                ) : (
                                    <>
                                        <span>{isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชีแล้วเริ่มเลย!'}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-400 font-medium pb-8 lg:pb-0">
                    การเข้าใช้งานแสดงว่าคุณยอมรับ <Link href="/terms" className="underline">นโยบายความเป็นส่วนตัว</Link> ของเรา
                </p>
            </div>
        </div>
    </div>
    );
}
