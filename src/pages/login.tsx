import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';

export default function LoginPage() {
    const router = useRouter();
    const { user, signInWithCustomToken } = useAuthStore();
    const [lineLoading, setLineLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!router.isReady) return;

        const { code, mode, redirect } = router.query;

        // 1. HANDLE LINE CALLBACK FIRST
        if (code && !user) {
            setLineLoading(true);
            const verifyLineLogin = async () => {
                try {
                    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://play.okeforyou.com';
                    // Must match LINE registered URL exactly
                    let redirectUri = `${origin}/login/`;
                    
                    const res = await fetch('/api/auth/line-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri })
                    });
                    
                    if (!res.ok) throw new Error('Failed to verify LINE login');
                    const { token } = await res.json();
                    await signInWithCustomToken(token);
                    
                    // After success, redirect to home
                    router.replace('/');
                } catch (err: any) {
                    console.error('Line Login Error:', err);
                    setError('การเข้าสู่ระบบด้วย LINE ล้มเหลว');
                    setLineLoading(false);
                }
            };
            verifyLineLogin();
            return; // Stop here if processing LINE
        }

        // 2. NORMAL REDIRECT TO HOME (OPEN DRAWER)
        // If we have a user already, or no code, just go home and let MainLayout open the drawer if needed
        if (user) {
            router.replace((redirect as string) || '/');
            return;
        }

        // Handle case where user is just visiting /login
        if (!code) {
            const isRegister = mode === 'register';
            const targetUrl = new URL(window.location.origin + (redirect as string || '/'));
            targetUrl.searchParams.set('auth', isRegister ? 'register' : 'login');
            router.replace(targetUrl.pathname + targetUrl.search);
        }

    }, [router.isReady, router.query, user]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <div className="space-y-2">
                    <p className="text-base font-black text-gray-900">
                        {lineLoading ? 'กำลังเข้าสู่ระบบด้วย LINE...' : 'กำลังพามุ่งหน้าไปที่หน้าหลัก...'}
                    </p>
                    <p className="text-xs font-bold text-gray-400">
                        {error ? <span className="text-red-500">{error}</span> : 'กรุณารอสักครู่ ระบบกำลังสื่อสารกับฐานข้อมูล'}
                    </p>
                </div>
                {error && (
                    <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-gray-100 rounded-2xl text-sm font-bold text-gray-600">
                        กลับหน้าหลัก
                    </button>
                )}
            </div>
        </div>
    );
}
