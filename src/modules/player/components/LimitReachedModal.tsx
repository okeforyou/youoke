import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Crown, PartyPopper, Sparkles } from 'lucide-react';
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

    // Fetch Real Limits from Firestore
    useEffect(() => {
        const fetchLimits = async () => {
            if (!db || !isLimitModalOpen) return;
            try {
                // Fetch current user role limits
                const planSnap = await getDoc(doc(db, 'plans', userRole));
                if (planSnap.exists()) {
                    setMaxSongs(planSnap.data().maxDailySongs || 0);
                } else {
                    const limits = config?.membership?.[userRole as keyof typeof config.membership];
                    setMaxSongs(limits?.max_daily_songs || 0);
                }
            } catch (err) {
                console.error("Error fetching limits for modal:", err);
            }
        };
        fetchLimits();
    }, [userRole, db, isLimitModalOpen, config]);

    const isLoggedIn = !!user;
    const isExpired = user?.membership?.status === 'expired';

    // UI Texts based on strategy
    const title = isLoggedIn && isExpired 
        ? "สิทธิสมาชิกหมดอายุแล้ว!" 
        : "หมดโควต้าฟังเพลงวันนี้แล้ว";

    const buttonText = !isLoggedIn 
        ? "เชื่อมต่อบัญชี YouTube (Gmail)" 
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

                    <div className="text-gray-500 mb-8 px-4 leading-relaxed text-sm">
                        {!isLoggedIn ? (
                            <>
                                กรุณาใช้บัญชี <span className="text-primary font-bold">YouTube (Gmail)</span> ของคุณ
                                <br />
                                เพื่อรับสิทธิการเข้าถึงแบบส่วนบุคคลผ่าน YouOke
                                <br />
                                <span className="text-red-600 font-bold">
                                  และเล่นผ่านบัญชีของคุณแบบไร้โฆษณาคั่น 🔐✨
                                </span>
                            </>
                        ) : (
                            <>
                                สิทธิการใช้งานแบบพรีเมียมส่วนบุคคลของคุณสิ้นสุดแล้ว
                                <br />
                                กรุณาเลือกแพ็กเกจที่คุณต้องการ
                                <br />
                                <span className="text-primary font-semibold">เพื่อขยายเวลาความสุขกับ YouOke 🎵⏳</span>
                            </>
                        )}
                    </div>

                    {/* Premium Offer Box (Shell Strategy) */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 mb-8 text-left relative overflow-hidden group border border-gray-700 shadow-xl">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Crown className="w-24 h-24 rotate-12 -mt-4 -mr-4" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-400 text-yellow-900 uppercase tracking-wider">
                                   YouTube Shell Access
                                </span>
                                <span className="text-xs text-yellow-400 font-medium flex items-center gap-1 leading-none">
                                    <SparkleIcon /> เชื่อมบัญชีรับสิทธิเพิ่ม
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">
                                {!isLoggedIn ? "รับสิทธิทดลองพรีเมียมส่วนตัว!" : "อัปเกรดเพื่อความสนุกไม่จำกัด"}
                            </h3>
                            <p className="text-xs text-gray-400 mb-0">
                                {!isLoggedIn 
                                    ? "เพียงเชื่อมต่อ Google เพื่อเข้าถึงการเล่นแบบไม่มีโฆษณาด้วยบัญชีของคุณเอง" 
                                    : "เลือกแผนการใช้งานที่เหมาะกับคุณเพื่อร้องเพลงได้ไม่อั้น"}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onAction}
                            className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all text-white font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            {!isLoggedIn ? <PartyPopper className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
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
