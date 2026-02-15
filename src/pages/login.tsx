import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import Link from 'next/link';
import { CheckCircleIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import { useSystemConfig } from '../hooks/useSystemConfig';

export default function LoginPage() {
    const router = useRouter();
    const { user, signInWithGoogle, signInWithLine, signInWithCustomToken, signIn, signUp, error, isLoading } = useAuthStore();

    useEffect(() => {
        console.log('⚡ [LoginPage] State Update:', {
            hasUser: !!user,
            isLoading,
            routerReady: router.isReady
        });
    }, [user, isLoading, router.isReady]);

    const [isLogin, setIsLogin] = useState(true);
    const [lineLoading, setLineLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [name, setName] = useState('');

    // Config
    const isRegistrationEnabled = true;
    const { config } = useSystemConfig();
    const loginContent = config.content?.login || {
        title: "ปลดปล่อยพลังเสียง\nร้องเพลงที่คุณรัก",
        subtitle: "เข้าร่วมชุมชนคนรักเสียงเพลง สร้างเพลย์ลิสต์ส่วนตัว และสนุกไปกับคาราโอเกะคุณภาพสูงได้ที่นี่",
        features: [
            { title: "คลังเพลงมหาศาล", desc: "อัปเดตใหม่ทุกวัน จาก YouTube & Spotify" },
            { title: "จัดการเพลย์ลิสต์ง่ายๆ", desc: "สร้าง แก้ไข และแชร์ให้เพื่อนๆ ได้ทันที" }
        ]
    };

    // Redirect if logged in
    // Redirect if logged in
    useEffect(() => {
        if (!router.isReady || isLoading) return;

        if (user) {
            let redirectUrl = (router.query.redirect as string) || '/';

            // If no specific redirect is active, send Admins/Owners to Dashboard
            // If no specific redirect is active, send Admins/Owners to Dashboard
            // FIXME: Disabled to prevent Redirect Loop (Login -> Admin -> Login)
            // if (redirectUrl === '/' && (user.role === 'admin' || user.role === 'owner' || user.email === 'boonyanone@gmail.com')) {
            //      redirectUrl = '/admin';
            // }

            // Prevent redirect loop if redirectUrl is current page
            if (redirectUrl === router.asPath) return;

            console.log(`⚡ [LoginPage] Authenticated (${user.email}). Redirecting to: ${redirectUrl}`);
            router.replace(redirectUrl); // Use replace to avoid history stack buildup
        }
    }, [user, router.isReady, isLoading, router.query, router.asPath]);

    // Handle LINE Callback (Same logic as before)
    useEffect(() => {
        const { code } = router.query;
        if (code && !user) {
            setLineLoading(true);
            const verifyLineLogin = async () => {
                try {
                    let redirectUri = 'https://play.okeforyou.com/login/';

                    if (typeof window !== 'undefined') {
                        redirectUri = `${window.location.origin}/login/`;
                    }
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

    useEffect(() => {
        if (!isRegistrationEnabled && !isLogin) setIsLogin(true);
    }, [isRegistrationEnabled, isLogin]);

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
            } else if (err.code === 'auth/network-request-failed') {
                msg = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต หรือปิด VPN/AdBlocker แล้วลองใหม่';
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
        <div className="min-h-screen flex bg-white">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* LEFT SIDE: Info & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary blur-3xl mix-blend-screen"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-600 blur-3xl mix-blend-screen"></div>
                </div>

                {/* Top: Logo */}
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/10">
                        <span className="text-2xl font-black text-primary">Y</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4 leading-tight whitespace-pre-line">
                        {loginContent.title}
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md">
                        {loginContent.subtitle}
                    </p>
                </div>

                {/* Middle: Features */}
                <div className="relative z-10 space-y-4">
                    {loginContent.features?.map((feature, i) => {
                        const Content = (
                            <>
                                <div className="bg-white/10 p-2 rounded-lg transition-transform group-hover:scale-110">
                                    {/* Simple icon cycling based on index */}
                                    {i % 2 === 0 ? <MusicalNoteIcon className="w-5 h-5 text-green-400" /> : <CheckCircleIcon className="w-5 h-5 text-blue-400" />}
                                </div>
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {feature.title}
                                        {feature.link && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full text-white/80">Go</span>}
                                    </div>
                                    <div className="text-sm text-gray-400">{feature.desc}</div>
                                </div>
                            </>
                        );

                        return feature.link ? (
                            <a
                                href={feature.link}
                                target="_blank"
                                rel="noreferrer"
                                key={i}
                                className="flex items-center gap-4 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                            >
                                {Content}
                            </a>
                        ) : (
                            <div key={i} className="flex items-center gap-4 p-2 -mx-2 rounded-xl group">
                                {Content}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom: Terms */}
                <div className="relative z-10 text-xs text-gray-500">
                    <p>© 2024 YouOke. All rights reserved.</p>
                    <div className="flex gap-4 mt-2">
                        <a
                            href={loginContent.termsLink || "#"}
                            target={loginContent.termsLink ? "_blank" : undefined}
                            rel={loginContent.termsLink ? "noreferrer" : undefined}
                            className="hover:text-white transition-colors"
                        >
                            เงื่อนไขการใช้งาน
                        </a>
                        <a
                            href={loginContent.privacyLink || "#"}
                            target={loginContent.privacyLink ? "_blank" : undefined}
                            rel={loginContent.privacyLink ? "noreferrer" : undefined}
                            className="hover:text-white transition-colors"
                        >
                            นโยบายความเป็นส่วนตัว
                        </a>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">

                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">Y</div>
                        <h2 className="text-2xl font-bold text-gray-900">YouOke</h2>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {isLogin ? (
                                <>ยังไม่มีบัญชี? <button onClick={() => setIsLogin(false)} className="font-medium text-primary hover:text-red-700 transition-colors">สมัครสมาชิกฟรี</button></>
                            ) : (
                                <>มีบัญชีอยู่แล้ว? <button onClick={() => setIsLogin(true)} className="font-medium text-primary hover:text-red-700 transition-colors">เข้าสู่ระบบ</button></>
                            )}
                        </p>
                    </div>

                    <div className="mt-8">
                        {/* Social Logins */}
                        <div className="space-y-3">
                            <button
                                onClick={signInWithLine}
                                disabled={isLoading || lineLoading}
                                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[#06C755] hover:bg-[#05b34d] hover:shadow-md transition-all disabled:opacity-50"
                            >
                                {lineLoading ? <span className="loading loading-spinner loading-sm" /> : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.51 5.4 3.89 7.03-.17 1.05-.62 2.58-.72 2.95-.08.31.29.54.54.34.41-.33 2.27-1.87 3.09-2.34.39.06.79.09 1.2.09 5.52 0 10-4.03 10-9S15.52 2 12 2zm0 15c-4.41 0-8-3.13-8-7s3.59-7 8-7 8 3.13 8 7-3.59 7-8 7zm4.25-8.28h-1.5c-.28 0-.5.22-.5.5v2.89h-1.5V9.22c0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5.22-.5.5v3.61c0 .28.22.5.5.5h4c.28 0 .5-.22.5-.5v-1.5c0-.28-.22-.5-.5-.5h-1.5v-.56h1.5c.28 0 .5-.22.5-.5V9.22c0-.28-.22-.5-.5-.5zm-6.5 0h-1.5c-.28 0-.5.22-.5.5v3.61c0 .28.22.5.5.5h1.5c.28 0 .5-.22.5-.5V9.22c0-.28-.22-.5-.5-.5zm-3 0H5.25c-.28 0-.5.22-.5.5v3.61c0 .28.22.5.5.5H6.75c.28 0 .5-.22.5-.5V9.22c0-.28-.22-.5-.5-.5z" /></svg>
                                        เข้าสู่ระบบด้วย LINE
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50"
                            >
                                {isLoading ? <span className="loading loading-spinner loading-sm" /> : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.027-3.2 2.027-2.027 2.64-5.227 2.64-7.013 0-.48-.053-1.12-.133-1.787H12.48z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                        Google Login
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">หรือใช้อีเมล</span>
                            </div>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {(error || localError) && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex gap-2 items-center animate-shake">
                                    <span className="font-bold">!</span> {localError || error}
                                </div>
                            )}

                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ - นามสกุล</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="เช่น สมชาย ใจดี"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">อีเมล</label>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="name@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">รหัสผ่าน</label>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4"
                            >
                                {isLoading ? 'กำลังโหลด...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <Link href="/" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                                &larr; กลับหน้าหลัก
                            </Link>
                        </div>

                        {/* Dev Login Button (Development Only) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 pt-8 border-t border-gray-100/50">
                                <button
                                    onClick={() => {
                                        const { devLogin } = useAuthStore.getState();
                                        devLogin();
                                    }}
                                    className="w-full py-2 px-4 bg-gray-100 text-gray-500 rounded-lg text-xs font-mono hover:bg-gray-200 transition-colors"
                                >
                                    Login as Dev Admin (LocalHost Only)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
