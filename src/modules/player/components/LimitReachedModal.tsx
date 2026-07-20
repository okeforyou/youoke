import React, { useEffect, useState } from 'react';
import { PartyPopper, Crown, Mic2 } from 'lucide-react';
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
        : (upsell?.title || "กรุณาเข้าสู่ระบบเพื่อใช้งาน");

    const buttonText = !isLoggedIn 
        ? (upsell?.button_text || "เชื่อมต่อผ่าน Gmail ฟรี 1 วัน") 
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
            <div className="relative bg-white dark:bg-zinc-950 rounded-[2.5rem] w-full max-w-sm p-8 animate-in zoom-in-95 duration-300 overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-none">
                <div className="relative z-10 text-center">
                    {/* Icon Header */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6 shrink-0 ring-4 ring-red-50">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Mic2 className="w-7 h-7 text-red-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {title}
                    </h2>

                    <div className="text-gray-500 dark:text-zinc-400 mb-8 px-2 font-medium leading-relaxed text-sm whitespace-pre-wrap">
                        {!isLoggedIn ? (
                            <>
                                คุณจำเป็นต้องเข้าสู่ระบบด้วยบัญชี Gmail เพื่อเข้าถึงคลังเพลงบน YouTube 
                                <br /><br />
                                <span className="text-[11px] opacity-80 leading-tight block">
                                    (เราเป็นเพียงเครื่องเล่นและระบบจัดคิวเพลงเพื่อความสะดวกเท่านั้น การใช้งานเป็นการใช้สิทธิ์ผ่านบัญชีของคุณเองโดยตรง เพื่อให้เป็นไปตามข้อกำหนดด้านลิขสิทธิ์)
                                </span>
                            </>
                        ) : (
                            "แพ็กเกจพรีเมียมส่วนตัวของคุณสิ้นสุดแล้ว เลือกแผนการใช้งานใหม่เพื่อสนุกต่อได้ทันที"
                        )}
                    </div>

                    {/* Premium Offer Box (Shell Strategy) */}
                    <div className="bg-zinc-950 dark:bg-black rounded-3xl p-6 mb-8 text-center relative overflow-hidden border border-zinc-800">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary text-white uppercase tracking-wider">
                                   YouTube Shell
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-white mb-2">
                                {!isLoggedIn ? (upsell?.offer_text || "ทดลองใช้พรีเมียมส่วนตัว!") : "สนุกแบบไม่จำกัดอีกครั้ง"}
                            </h3>
                            {upsell?.offer_subtext && !isLoggedIn && (
                                <p className="text-xs text-zinc-400 font-medium max-w-[200px] mx-auto">{upsell.offer_subtext}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onAction}
                            className="w-full py-4 rounded-2xl bg-primary hover:bg-red-600 active:scale-[0.98] transition-all text-white font-black text-sm flex items-center justify-center gap-2 shadow-none border-none"
                        >
                            <PartyPopper className="w-4 h-4 text-white" />
                            <span>{buttonText}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors hover:bg-gray-50"
                        >
                            ไว้คราวหลัง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
