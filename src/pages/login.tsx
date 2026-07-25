import { useState, useEffect, useRef } from 'react';
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
    Home,
    CheckCircle2
} from 'lucide-react';
import { useSystemConfig } from '../hooks/useSystemConfig';
import clsx from 'clsx';

const getFriendlyErrorMessage = (err: any): string => {
    if (!err) return 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    const code = err.code || err.message;
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
    if (code === 'auth/email-already-in-use') {
        return 'อีเมลนี้ถูกใช้งานแล้ว';
    }
    if (code === 'auth/user-disabled' || (err.message && err.message.includes('user-disabled'))) {
        return 'บัญชีนี้หมดอายุการใช้งาน/มีปัญหา กรุณาติดต่อ Admin เพื่อดำเนินการแก้ไข';
    }
    return err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
};

export default function LoginPage() {
    const router = useRouter();
    const { user, signInWithGoogle, linkGoogleAccount, signInWithLine, signInWithCustomToken, signIn, signUp, error, isLoading } = useAuthStore();

    const [isLogin, setIsLogin] = useState(true);
    const [lineLoading, setLineLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [name, setName] = useState('');
    const [showIntro, setShowIntro] = useState(true); 
    const [acceptedTerms, setAcceptedTerms] = useState(false); 
    const [isSubmitting, setIsSubmitting] = useState(false); 

    useEffect(() => {
        if (router.isReady) {
            if (router.query.mode === 'register') {
                setIsLogin(false);
            } else {
                setIsLogin(true);
            }
        }
    }, [router.isReady, router.query.mode]);

    const { config } = useSystemConfig();
    
    const premiumFeatures = [
        { icon: Cast, title: "แคสต์ขึ้นจอ", desc: "TV จอยักษ์ คุมผ่านมือถือแบบ DJ", color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: Mic2, title: "ค้นด้วยเสียง", desc: "พูดชื่อศิลปินหรือเพลงได้ทันที", color: "text-red-500", bg: "bg-red-500/10" },
        { icon: Smartphone, title: "รีโมทอัจฉริยะ", desc: "เพื่อนช่วยจัดคิว ร้องได้ทุกมุมห้อง", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { icon: Music, title: "คลังเพลงไม่อั้น", desc: "อัปเดตเพลงใหม่และยอดนิยมทุกวัน", color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: ShieldCheck, title: "ไร้โฆษณาคั่น", desc: "สนุกต่อเนื่อง ไม่มีโฆษณากวนใจ", color: "text-amber-500", bg: "bg-amber-500/10" },
        { icon: Heart, title: "โหมดส่วนตัว", desc: "เซฟเพลงโปรดและเพลย์ลิสต์ส่วนตัว", color: "text-pink-500", bg: "bg-pink-500/10" },
    ];

    const lineProcessedRef = useRef(false);

    useEffect(() => {
        if (!router.isReady) return;
        if (user && router.query.action === 'link') return;
        if (router.query.code) return;

        if (user) {
            const redirectUrl = (router.query.redirect as string) || '/';
            if (redirectUrl === router.asPath) return;
            router.replace(redirectUrl);
        }
    }, [user, router.isReady, router.query, router.asPath]);

    useEffect(() => {
        if (!router.isReady) return;
        const { code, state } = router.query;
        if (!code || lineProcessedRef.current) return;
        
        const isLinkingFlow = state && state !== 'auth_login';
        if (!isLinkingFlow && user) return;

        lineProcessedRef.current = true;
        setLineLoading(true);

        const processLineCallback = async () => {
            try {
                const redirectUri = typeof window !== 'undefined' 
                    ? `${window.location.origin}/login/` 
                    : '';
                
                const res = await fetch('/api/auth/line-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, redirectUri, state })
                });
                
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to verify LINE');
                }
                
                const data = await res.json();

                if (state === 'link_account' && data.lineUserId && user?.uid) {
                    const { realtimeDb, db } = await import('@/firebase');
                    
                    // Update RTDB (Backward Compatibility)
                    if (realtimeDb) {
                        const { ref, update } = await import('firebase/database');
                        await update(ref(realtimeDb, `users/${user.uid}`), {
                            lineUserId: data.lineUserId,
                            lineDisplayName: data.lineDisplayName || '',
                        });
                    }
                    
                    // Update Firestore (Crucial for Core System Identity)
                    if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'users', user.uid), {
                            lineUserId: data.lineUserId,
                            lineDisplayName: data.lineDisplayName || '',
                        });
                    }
                    
                    // Force a hard reload to ensure AuthStore re-fetches the latest Firestore state
                    window.location.href = '/';
                } else {
                    console.warn("⚠️ [LINE] Login with LINE is disabled. Only linking is allowed.");
                    setLocalError('ระบบปิดการเข้าสู่ระบบด้วย LINE กรุณาใช้ Google หรืออีเมลแทนครับ');
                    setLineLoading(false);
                }
            } catch (err: any) {
                console.error('❌ LINE Callback Error:', err);
                setLocalError(err.message || 'การเชื่อมต่อ LINE ล้มเหลว กรุณาลองใหม่');
                setLineLoading(false);
                lineProcessedRef.current = false;
            }
        };
        processLineCallback();
    }, [router.isReady, router.query, user]);

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
            setLocalError(getFriendlyErrorMessage(err));
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        if (isLoading || isSubmitting) return;
        setIsSubmitting(true);
        const action = user ? linkGoogleAccount() : signInWithGoogle();
        action.catch((err: any) => {
            setIsSubmitting(false);
            setLocalError(getFriendlyErrorMessage(err));
        });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row relative font-sans overflow-x-hidden !text-zinc-950">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* Premium Loading Overlay */}
            {((isLoading && isSubmitting) || lineLoading) && (
                <div className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-zinc-900 rounded-[2rem] flex items-center justify-center animate-bounce mb-6">
                         <span className="text-2xl font-black text-white">Y</span>
                    </div>
                </div>
            )}

            {/* Back Button */}
            <div className={clsx(
                "fixed top-0 left-0 right-0 z-[100] p-6 flex items-center justify-between pointer-events-none transition-all",
                !showIntro ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
            )}>
                <Link href="/" className="pointer-events-auto flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 bg-white px-5 py-2.5 rounded-2xl border border-zinc-200 active:scale-95 transition-all shadow-none">
                    <ArrowLeft size={16} strokeWidth={3} />
                    <span>กลับหน้าหลัก</span>
                </Link>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row w-full h-full relative">
                
                {/* LEFT SIDE: Features Intro (Forced Light Mode) */}
                <div className={clsx(
                    "w-full lg:w-[45%] xl:w-[50%] flex flex-col justify-center p-8 lg:p-24 pt-24 lg:pt-24 bg-zinc-50 lg:border-r border-zinc-100 min-h-screen lg:h-auto",
                    !showIntro ? "hidden lg:flex" : "flex"
                )}>
                    <div className="max-w-xl mx-auto lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                            <Zap size={14} fill="currentColor" />
                            <span>{user ? 'เชื่อมบัญชี YouTube รับสิทธิเพิ่ม' : 'ระบบค้นหาและจัดการคิวเพลง'}</span>
                        </div>

                        <h2 className="text-3xl lg:text-5xl font-black text-zinc-950 leading-[1.1] tracking-tighter mb-6">
                            สนุกกับคาราโอเกะ<br/>ด้วย YouTube
                        </h2>

                        <p className="text-zinc-950 text-xs lg:text-sm font-bold mb-10 leading-relaxed max-w-md opacity-70">
                           เราเป็นเพียงระบบค้นหา จัดการคิวเพลง และตัดเสียงร้องด้วย AI เราไม่ได้เป็นผู้อัปโหลดหรือจัดเก็บเนื้อหา การดึงข้อมูลอ้างอิงจากกฎของ YouTube โดยตรง ผู้ใช้งานต้องรับผิดชอบด้วยตนเองในกรณีที่นำไปใช้ในเชิงพาณิชย์
                        </p>

                        <div className="grid grid-cols-2 gap-x-4 lg:gap-x-10 gap-y-6 lg:gap-y-8 mb-12">
                            {premiumFeatures.map((f, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={clsx("w-10 h-10 lg:w-12 lg:h-12 shrink-0 rounded-2xl flex items-center justify-center border", f.bg, f.color, "border-current/10")}>
                                        <f.icon size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="pt-0.5">
                                        <h3 className="font-black text-zinc-950 text-[13px] lg:text-[15px] leading-tight tracking-tight">{f.title}</h3>
                                        <p className="text-zinc-500 text-[10px] lg:text-[11px] font-bold leading-tight mt-1">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="lg:hidden space-y-3">
                            <button onClick={() => { setIsLogin(false); setShowIntro(false); }} className="w-full h-14 bg-zinc-900 text-white font-black rounded-3xl active:scale-95 transition-all text-base border-none shadow-none">สร้างบัญชีใหม่</button>
                            <button onClick={() => { setIsLogin(true); setShowIntro(false); }} className="w-full h-14 bg-white border border-zinc-200 text-zinc-900 font-black rounded-3xl active:scale-95 transition-all text-base shadow-none">เข้าสู่ระบบ</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Auth Form (Forced Light Mode) */}
                <div className={clsx(
                    "w-full lg:w-[55%] xl:w-[50%] flex flex-col justify-center items-center py-12 px-6 lg:px-24 bg-white min-h-screen lg:min-h-0 relative",
                    showIntro ? "hidden lg:flex" : "flex animate-in fade-in slide-in-from-bottom-4 duration-500"
                )}>
                    {/* Back to Intro (Mobile) */}
                    <button onClick={() => setShowIntro(true)} className="lg:hidden absolute top-8 left-6 flex items-center gap-2 text-[10px] font-black text-zinc-600 bg-white border border-zinc-200 rounded-2xl px-5 py-2.5 active:scale-95 transition-all">
                        <ArrowLeft size={16} strokeWidth={3} />
                        <span>กลับ</span>
                    </button>

                    <div className="w-full max-w-[380px]">
                        <div className="mb-10 text-center">
                            <h2 className="text-2xl lg:text-3xl font-black text-zinc-950 mb-2 tracking-tighter">
                                {isLogin ? 'ยินดีต้อนรับกลับมา' : 'เข้าร่วม YouOKE'}
                            </h2>
                            <p className="text-zinc-500 text-[13px] font-bold">
                                {isLogin ? (
                                    <>ยังไม่มีบัญชี? <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">สมัครสมาชิกใหม่</button></>
                                ) : (
                                    <>มีบัญชีอยู่แล้ว? <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">เข้าสู่ระบบ</button></>
                                )}
                            </p>
                        </div>

                        <div className="space-y-3 mb-8">
                            {/* LINE Login button removed based on Simplified LINE Strategy */}
                            <button onClick={handleGoogleLogin} disabled={isLoading || !acceptedTerms} className="w-full h-14 flex justify-center items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-black transition-all active:scale-95 disabled:opacity-40 shadow-none">
                                <svg width="20" height="20" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                                <span>ดำเนินการด้วย Google</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="peer hidden" />
                                <div className="w-5 h-5 rounded-lg border-2 border-zinc-200 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-all bg-white">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                                </div>
                                <span className="text-[11px] font-black text-zinc-500 leading-tight">
                                    ฉันยอมรับ <Link href="/terms" className="text-zinc-900 underline decoration-primary/30">เงื่อนไขการใช้งาน</Link> ของ YouOKE
                                </span>
                            </label>
                        </div>

                        <div className="relative py-8 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                            <span className="relative px-4 bg-white text-[9px] font-black text-zinc-300 uppercase tracking-widest">หรือใช้อีเมล</span>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {localError && (
                                <div className="bg-red-500/10 text-red-600 text-[11px] font-black p-4 rounded-2xl border border-red-500/20 flex items-center gap-3">
                                    <Zap size={14} fill="currentColor" />
                                    <span>{localError}</span>
                                </div>
                            )}

                            {!isLogin && (
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-5 text-sm font-bold text-zinc-900 outline-none ring-0 placeholder:text-zinc-400" placeholder="ชื่อเล่นของคุณ" />
                            )}
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-5 text-sm font-bold text-zinc-900 outline-none ring-0 placeholder:text-zinc-400" placeholder="อีเมล" />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-5 text-sm font-bold text-zinc-900 outline-none ring-0 placeholder:text-zinc-400" placeholder="รหัสผ่าน" />

                            <button type="submit" disabled={isLoading || !acceptedTerms} className="w-full h-14 bg-zinc-900 text-white font-black rounded-3xl active:scale-95 transition-all text-base mt-2 shadow-none border-none">
                                {isLogin ? 'เข้าสู่ระบบ' : 'เริ่มเป็นสมาชิกตอนนี้'}
                            </button>
                        </form>

                        <p className="mt-12 text-center text-[10px] text-zinc-400 font-black uppercase tracking-widest leading-loose">
                            YouOKE -The Smart Karaoke OS<br/>
                            © {new Date().getFullYear()} okeforyou.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
