import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUIStore } from '@/stores/useUIStore';

export default function LoginPage() {
    const router = useRouter();
    const { setProfileOpen } = useUIStore();

    useEffect(() => {
        if (!router.isReady) return;

        // Extract modes
        const isRegister = router.query.mode === 'register';
        const redirectPath = (router.query.redirect as string) || '/';

        // Set the UI state proactively (optional, as the redirect will trigger the effect in MainLayout too)
        // setProfileOpen(true);

        // Redirect to Home with Auth flags
        const targetUrl = new URL(window.location.origin + redirectPath);
        if (isRegister) {
            targetUrl.searchParams.set('auth', 'register');
        } else {
            targetUrl.searchParams.set('auth', 'login');
        }

        router.replace(targetUrl.pathname + targetUrl.search);
    }, [router.isReady, router.query]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <p className="text-sm font-bold text-gray-400 animate-pulse">กำลังเตรียมระบบเข้าสู่ระบบแบบใหม่...</p>
            </div>
        </div>
    );
}
