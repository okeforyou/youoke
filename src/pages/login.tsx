import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';

export default function LoginPage() {
    const router = useRouter();
    const { user, signInWithCustomToken, isHydrated } = useAuthStore();
    const [lineLoading, setLineLoading] = useState(false);
    const [error, setError] = useState('');
    const processingRef = useRef(false);

    useEffect(() => {
        if (!router.isReady || !isHydrated) return;

        const { code, mode, redirect, error: lineError } = router.query;

        // 1. Check for LINE errors from URL
        if (lineError) {
            setError(`LINE Error: ${lineError}`);
            return;
        }

        // 2. Handle LINE Callback
        if (code && !user && !processingRef.current) {
            processingRef.current = true;
            setLineLoading(true);
            
            const verifyLineLogin = async () => {
                try {
                    // Try to be strict with origin
                    // STRICT: Must match LINE Developers Console exactly
                    const origin = (typeof window !== 'undefined' && window.location.origin.includes('localhost')) 
                        ? 'http://localhost:3000' 
                        : 'https://play.okeforyou.com';
                    const redirectUri = `${origin}/login/`;
                    
                    console.log('📡 Verifying LINE code:', code, 'with URI:', redirectUri);

                    const res = await fetch('/api/auth/line-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri })
                    });
                    
                    const data = await res.json();
                    
                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to verify LINE login');
                    }
                    
                    if (data.token) {
                        await signInWithCustomToken(data.token);
                        // router.replace handles redirection after state update via the user dependency
                    } else {
                        throw new Error('No token received');
                    }
                } catch (err: any) {
                    console.error('❌ Line Login Debug:', err);
                    setError(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`);
                    setLineLoading(false);
                    processingRef.current = false;
                }
            };
            
            verifyLineLogin();
            return;
        }

        // 3. Normal Redirect Logic
        if (user) {
            const dest = (redirect as string) || '/';
            router.replace(dest);
            return;
        }

        // 4. Default Home Redirect (with Auth Trigger)
        if (!code && !lineLoading && !error) {
            const isRegister = mode === 'register';
            const targetUrl = new URL(window.location.origin + (redirect as string || '/'));
            targetUrl.searchParams.set('auth', isRegister ? 'register' : 'login');
            router.replace(targetUrl.pathname + targetUrl.search);
        }

    }, [router.isReady, router.query, user, isHydrated]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center gap-8 text-center animate-in fade-in zoom-in-95 duration-500">
                
                {error ? (
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-pulse">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full border-4 border-white animate-bounce" />
                    </div>
                )}

                <div className="space-y-2">
                    <h1 className="text-xl font-black text-gray-900 leading-tight">
                        {lineLoading ? 'เข้าสู่ระบบด้วย LINE' : (error ? 'พบข้อผิดพลาด' : 'กำลังนำท่านไป...')}
                    </h1>
                    <p className="text-[13px] font-bold text-gray-400 leading-relaxed px-4">
                        {error ? (
                            <span className="text-red-400 block break-words">{error}</span>
                        ) : (
                            'กรุณารอสักครู่ ระบบกำลังสื่อสารกับฐานข้อมูล YouOke'
                        )}
                    </p>
                </div>

                {error ? (
                    <button 
                        onClick={() => router.push('/')} 
                        className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-base shadow-lg transition-all active:scale-95"
                    >
                        ตกลง กลับหน้าหลัก
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-60">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                        กำลังประมวลผล
                    </div>
                )}
            </div>
        </div>
    );
}
