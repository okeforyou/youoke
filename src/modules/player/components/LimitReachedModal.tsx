import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Crown, PartyPopper } from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useRouter } from 'next/router';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const LimitReachedModal = () => {
    const { isLimitModalOpen, setLimitModalOpen } = useUIStore();
    const { config } = useSystemConfig();
    const { user } = useAuthStore();
    const router = useRouter();

    // 🏷️ Role Resolution Logic
    let userRole = 'guest';
    if (user) userRole = user.membership?.type || 'free';

    const [maxSongs, setMaxSongs] = useState(0);
    const [upsellLimit, setUpsellLimit] = useState(20);

    // Fetch Real Limits from Firestore
    useEffect(() => {
        const fetchLimits = async () => {
            if (!db || !isLimitModalOpen) return;
            try {
                // 1. Fetch current user role limits
                const planSnap = await getDoc(doc(db, 'plans', userRole));
                if (planSnap.exists()) {
                    setMaxSongs(planSnap.data().maxDailySongs || 0);
                } else {
                    const limits = config?.membership?.[userRole];
                    setMaxSongs(limits?.max_daily_songs || 0);
                }

                // 2. Fetch day_pass limits for dynamic upsell message
                const dayPassSnap = await getDoc(doc(db, 'plans', 'day_pass'));
                if (dayPassSnap.exists()) {
                    setUpsellLimit(dayPassSnap.data().maxDailySongs || 20);
                }
            } catch (err) {
                console.error("Error fetching limits for modal:", err);
            }
        };
        fetchLimits();
    }, [userRole, db, isLimitModalOpen, config]);

    // Configurable Texts (Fallback to defaults)
    const upsell = config?.upsell || {};
    const title = upsell.title || "หมดโควต้าฟังเพลงวันนี้แล้ว";
    const subtitle = userRole === 'guest' 
        ? `โควต้าสำหรับนักร้องทั่วไปคือ ${maxSongs} เพลง/วัน (สมัครสมาชิกเพื่อรับสิทธิ์เพิ่ม!)`
        : upsell.subtitle || `โควต้าสำหรับแพ็กเกจฟรีคือ ${maxSongs} เพลง/วัน`;
    
    const offerText = upsell.offer_text || `รับสิทธิ์ร้องฟรีเพิ่มเป็น ${upsellLimit} เพลง!`;
    const offerSubtext = upsell.offer_subtext || "เพียงสมัครสมาชิกเพื่อรับแผนฟรี 1 วัน • เพลงเยอะขึ้น • สนุกได้ต่อเนื่อง";
    const buttonText = userRole === 'guest' ? "สมัครสมาชิกรับสิทธิ์ฟรี" : (upsell.button_text || "อัปเกรดแผนการใช้งาน");

    const onClose = () => setLimitModalOpen(false);

    const onSubscribe = () => {
        setLimitModalOpen(false);
        if (userRole === 'guest') {
            // Send to login but with a hint to show register form if possible, 
            // or just standard login since social login does both
            router.push('/login?mode=register');
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
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">

                {/* Decorative Background Glows */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center">
                    {/* Icon Header */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6 shrink-0 ring-4 ring-red-50">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                            <span className="text-3xl">😢</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {title}
                    </h2>

                    <p className="text-gray-500 mb-8 px-4 leading-relaxed">
                        {subtitle}
                    </p>

                    {/* Premium Offer Box */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 mb-8 text-left relative overflow-hidden group border border-gray-700 shadow-xl">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Crown className="w-24 h-24 rotate-12 -mt-4 -mr-4" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-400 text-yellow-900 uppercase tracking-wider">
                                    Special Offer
                                </span>
                                <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                                    <SparkleIcon /> สำหรับสมาชิกใหม่
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">
                                {offerText}
                            </h3>
                            <p className="text-xs text-gray-400 mb-0">
                                {offerSubtext}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onSubscribe}
                            className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all text-white font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            <PartyPopper className="w-5 h-5" />
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

const SparkleIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
    </svg>
);
