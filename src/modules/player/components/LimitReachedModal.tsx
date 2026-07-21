import React from 'react';
import { PartyPopper, Mic2, X } from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useRouter } from 'next/router';

export const LimitReachedModal = () => {
    const { isLimitModalOpen, setLimitModalOpen } = useUIStore();
    const { config } = useSystemConfig();
    const { user } = useAuthStore();
    const router = useRouter();

    const upsell = config?.upsell;
    const isLoggedIn = !!user;
    const isExpired = user?.membership?.status === 'expired';

    const title = isLoggedIn && isExpired 
        ? "สิทธิสมาชิกหมดอายุแล้ว!" 
        : (upsell?.title || "เข้าสู่ระบบเพื่อใช้งาน");

    const buttonText = !isLoggedIn 
        ? (upsell?.button_text || "เข้าสู่ระบบด้วย Gmail") 
        : "อัปเกรดแผนการใช้งาน";

    const onClose = () => setLimitModalOpen(false);

    const onAction = () => {
        setLimitModalOpen(false);
        if (!isLoggedIn) {
            router.push('/login');
        } else {
            router.push('/packages');
        }
    };

    if (!isLimitModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-zinc-950 rounded-[2.5rem] w-full max-w-sm p-8 animate-in zoom-in-95 duration-300 overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-2xl">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors z-20"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                <div className="relative z-10 text-center mt-2">
                    {/* Icon Header */}
                    {!isLoggedIn ? (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/10 mb-6 shrink-0 ring-4 ring-blue-50 dark:ring-blue-500/10">
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6 shrink-0 ring-4 ring-red-50">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Mic2 className="w-7 h-7 text-red-500" />
                            </div>
                        </div>
                    )}

                    {!isLoggedIn ? (
                        <>
                            <h2 className="text-[20px] font-extrabold text-gray-900 dark:text-white mb-3 leading-snug">
                                เข้าสู่ระบบบัญชี Gmail <br/>
                                เพื่อฟังเพลงบน YouTube
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-8 font-medium leading-relaxed px-2">
                                (YouOke เป็นเพียงเครื่องเล่นและระบบจัดคิวเพลงเพื่อความสะดวกเท่านั้น)
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                {title}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8 font-medium leading-relaxed px-2">
                                แพ็กเกจพรีเมียมส่วนตัวของคุณสิ้นสุดแล้ว เลือกแผนการใช้งานใหม่เพื่อสนุกต่อได้ทันที
                            </p>
                        </>
                    )}

                    {/* Premium Offer Box (Shell Strategy) */}
                    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 mb-8 text-center relative overflow-hidden border border-zinc-800 shadow-lg">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent opacity-50"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-white/10 text-white uppercase tracking-wider border border-white/20">
                                   YouTube Shell
                                </span>
                            </div>

                            <h3 className="text-[17px] font-black text-white mb-2">
                                {!isLoggedIn ? (upsell?.offer_text || "รับสิทธิพิเศษสมาชิก VIP") : "สนุกแบบไม่จำกัดอีกครั้ง"}
                            </h3>
                            
                            <p className="text-[11px] text-zinc-300 font-medium max-w-[220px] mx-auto leading-relaxed">
                                {!isLoggedIn 
                                    ? (upsell?.offer_subtext || "ฟังเพลงไม่อั้น • ไม่มีโฆษณา • คิวเพลงไม่จำกัด")
                                    : "ฟังเพลงไม่อั้น • ไม่มีโฆษณา • คิวเพลงไม่จำกัด"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onAction}
                            className="w-full py-3.5 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] active:scale-[0.98] transition-all text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 border-none"
                        >
                            {!isLoggedIn ? (
                                <>
                                    <div className="bg-white rounded-full p-1 mr-1">
                                        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                    </div>
                                    <span>{buttonText}</span>
                                </>
                            ) : (
                                <>
                                    <PartyPopper className="w-4 h-4 text-white" />
                                    <span>{buttonText}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
