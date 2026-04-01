import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSystem } from '@/core/container/SystemContext';
import { db } from '@/firebase'; // Use Firestore (Client SDK)
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircleIcon, ExclamationCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { SYSTEM_VERSION } from '@/core/version';

/**
 * YouOKE LINE Identity Connector (v4.3.0)
 * หน้าเว็บสำหรับผูกบัญชี Gmail เข้ากับ LINE ID ผ่าน LIFF หรือ LINE Login
 */

export default function LineConnectPage() {
    const { user } = useSystem().auth();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('กำลังเชื่อมต่อระบบ LINE...');
    const [lineInfo, setLineInfo] = useState<{ displayName?: string; userId?: string }>({});

    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/profile/line-connect');
            return;
        }

        // Logic to capture LINE ID from URL Params (If redirected from LIFF/OAuth)
        const { l_uid, l_name } = router.query;
        
        if (l_uid && l_name) {
            handleLinking(l_uid as string, l_name as string);
        } else {
            // Mocking for testing or Waiting for LIFF
            // In a real LIFF app, we would initialize liff here
            setStatus('error');
            setMessage('ไม่พบข้อมูลการยืนยันตัวตนจาก LINE กรุณาลองใหม่อีกครั้งผ่านแอป LINE ครับ');
        }
    }, [user, router.query]);

    const handleLinking = async (lineUserId: string, displayName: string) => {
        try {
            if (!user?.uid || !db) return;

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                lineUserId: lineUserId,
                lineDisplayName: displayName,
                lineConnectedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setLineInfo({ userId: lineUserId, displayName: displayName });
            setStatus('success');
            setMessage('เชื่อมต่อบัญชี LINE สำเร็จแล้ว!');
            
            // Redirect back to profile after 3 seconds
            setTimeout(() => {
                router.push('/profile');
            }, 3000);
        } catch (error: any) {
            console.error('Linking error:', error);
            setStatus('error');
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <Head>
                <title>LINE Connection - YouOKE</title>
            </Head>

            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Visual Header */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto border border-gray-100 shadow-sm overflow-hidden ring-4 ring-white">
                        <svg className="w-12 h-12 fill-[#00B900]" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.047c-.052.312-.252 1.226 1.088.668 1.341-.558 7.237-4.263 9.87-7.296 1.83-1.926 2.091-3.328 2.091-5.71z"/></svg>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Identity Bridge</h1>
                    <p className="text-sm font-medium text-gray-400">ผูกตัวตน Gmail เข้ากับ LINE Messaging</p>
                </div>

                {/* Status Card */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-[32px] p-8 space-y-6">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="loading loading-spinner loading-lg text-[#00B900]"></div>
                            <p className="text-sm font-bold text-gray-600">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-4">
                            <CheckCircleIcon className="w-16 h-16 text-[#00B900] animate-bounce-short" />
                            <div className="space-y-1">
                                <p className="text-lg font-black text-gray-900">{message}</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ยินดีต้อนรับ {lineInfo.displayName}!</p>
                            </div>
                            <p className="text-[10px] text-gray-400">ระบบกำลังพาคุณกลับไปที่หน้าโปรไฟล์...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-4">
                            <ExclamationCircleIcon className="w-16 h-16 text-red-500" />
                            <div className="space-y-1">
                                <p className="text-base font-bold text-gray-900">เกิดข้อผิดพลาด</p>
                                <p className="text-xs text-gray-400 px-4 leading-relaxed">{message}</p>
                            </div>
                            <button 
                                onClick={() => router.push('/profile')}
                                className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                            >
                                กลับไปหน้าโปรไฟล์
                            </button>
                        </div>
                    )}
                </div>

                {/* Benefits */}
                <div className="flex items-center justify-center gap-6 pt-4 grayscale opacity-40">
                    <div className="flex flex-col items-center gap-1">
                        <SparklesIcon className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Updates</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                        <span className="text-[8px] font-black uppercase tracking-widest">Verify</span>
                    </div>
                </div>

                <footer className="pt-8">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">YouOKE System v{SYSTEM_VERSION}</p>
                </footer>
            </div>
        </div>
    );
}
