import React, { useEffect, useState } from 'react';
import { PartyPopper, Crown } from 'lucide-react';
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
        : (upsell?.title || "โควต้าการลองใช้งานสิ้นสุดแล้ว");

    const buttonText = !isLoggedIn 
        ? (upsell?.button_text || "เชื่อมต่อผ่าน Gmail เพื่อรับสิทธิพิเศษ") 
        : "อัปเกรดแผนการใช้งาน";

    const onClose = () => setLimitModalOpen(false);

    const onAction = () => {
        setLimitModalOpen(false);
        if (!isLoggedIn) {
            router.push('/login?action=link');
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
                            <span className="text-3xl">😢</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {title}
                    </h2>

                    <div className="text-gray-500 dark:text-zinc-400 mb-8 px-2 font-medium leading-relaxed text-sm whitespace-pre-wrap">
                        {!isLoggedIn ? (
                            upsell?.subtitle || (
                                <>
                                    กรุณา <span className="text-zinc-900 dark:text-white font-black">เชื่อมต่อผ่าน Gmail</span> เพื่อใช้งานผ่านสิทธิส่วนบุคคลของคุณ
                                    <br />
                                    <span className="text-[11px] opacity-80">(YouOke เป็นเพียงระบบจัดคิวเพลงผ่านบัญชีของสมาชิกเท่านั้น)</span>
                                    <br />
                                    เพื่อเล่นเพลงโปรดของคุณได้ต่อเนื่องและไม่มีโฆษณาคั่น
                                </>
                            )
                        ) : (
                            "แพ็กเกจพรีเมียมส่วนตัวของคุณสิ้นสุดแล้ว เลือกแผนการใช้งานใหม่เพื่อสนุกต่อได้ทันที"
                        )}
                    </div>

                    {/* Premium Offer Box (Shell Strategy) */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 mb-8 text-left relative overflow-hidden border border-zinc-100 dark:border-zinc-800">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary text-white uppercase tracking-wider">
                                   YouTube Shell
                                </span>
                            </div>

                            <h3 className="text-base font-black text-zinc-900 dark:text-white">
                                {!isLoggedIn ? (upsell?.offer_text || "ทดลองใช้พรีเมียมส่วนตัว!") : "สนุกแบบไม่จำกัดอีกครั้ง"}
                            </h3>
                            {upsell?.offer_subtext && !isLoggedIn && (
                                <p className="text-[10px] text-zinc-400 mt-1 font-medium">{upsell.offer_subtext}</p>
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
