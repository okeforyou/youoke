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

    const [isLogin, setIsLogin] = useState(true);
    const [lineLoading, setLineLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [name, setName] = useState('');

    // Initial State from Query
    useEffect(() => {
        if (router.isReady && router.query.mode === 'register') {
            setIsLogin(false);
        }
    }, [router.isReady, router.query.mode]);

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
    useEffect(() => {
        if (!router.isReady || isLoading) return;
        if (user) {
            // CRITICAL: If new user (just registered) or has no active plan, force packages
            const isNewUser = !user.membership || user.membership.type === 'free' || !user.membership.startedAt;
            
            let redirectUrl = (router.query.redirect as string) || '/';
            
            if (isNewUser && redirectUrl === '/') {
                console.log('🚀 [Login] New/Free user detected. Redirecting to Packages.');
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
        <div className="min-h-screen flex bg-white">
            <Head>
                <title>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} - YouOke</title>
            </Head>

            {/* LEFT SIDE: Info & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary blur-3xl mix-blend-screen"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-600 blur-3xl mix-blend-screen"></div>
                </div>

                <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 border border-white/10">
                        <span className="text-2xl font-black text-primary">Y</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4 leading-tight whitespace-pre-line">{loginContent.title}</h1>
                    <p className="text-gray-400 text-lg max-w-md">{loginContent.subtitle}</p>
                </div>

                <div className="relative z-10 space-y-4">
                    {loginContent.features?.map((feature, i) => (
                        <div key={i} className="flex items-center gap-4 p-2 -mx-2 rounded-xl group">
                            <div className="bg-white/10 p-2 rounded-lg transition-transform group-hover:scale-110">
                                {i % 2 === 0 ? <MusicalNoteIcon className="w-5 h-5 text-green-400" /> : <CheckCircleIcon className="w-5 h-5 text-blue-400" />}
                            </div>
                            <div>
                                <div className="font-bold flex items-center gap-2">{feature.title}</div>
                                <div className="text-sm text-gray-400">{feature.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="relative z-10 text-xs text-gray-500">
                    <p>© 2024 YouOke. All rights reserved.</p>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">
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
                        <div className="space-y-3">
                            <button onClick={signInWithLine} disabled={isLoading || lineLoading} className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[#06C755] hover:bg-[#05b34d] transition-all">
                                {lineLoading ? <span className="loading loading-spinner" /> : "เข้าสู่ระบบด้วย LINE"}
                            </button>
                            <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                                {isLoading ? <span className="loading loading-spinner" /> : "Google Login"}
                            </button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">หรือใช้อีเมล</span></div>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {(error || localError) && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
                                    {localError || error}
                                </div>
                            )}

                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ - นามสกุล</label>
                                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="สมชาย ใจดี" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">อีเมล</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="name@example.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">รหัสผ่าน</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="••••••••" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 bg-gray-900 text-white rounded-xl font-bold transition-all mt-4">
                                {isLoading ? 'กำลังโหลด...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
