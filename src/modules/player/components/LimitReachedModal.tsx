import React, { useEffect, useState } from 'react';
import { X, Lock, Crown, Sparkles, Youtube } from 'lucide-react';
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
                    const limits = config?.membership?.[userRole];
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
        ? "สิทธิสมาชิกพรีเมียมส่วนตัวหมดอายุแล้ว!" 
        : "คุณฟังครบโควตาฟรีแล้ว!";

    const buttonText = !isLoggedIn 
        ? "เชื่อมต่อบัญชี YouTube (Gmail)" 
        : "เลือกแพ็กเกจพรีเมียม";

    const onClose = () => setLimitModalOpen(false);

    const onAction = () => {
        setLimitModalOpen(false);
        if (!isLoggedIn) {
            router.push('/login?action=link');
        } else {
            router.push('/pricing');
        }
    };

    if (!isLimitModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-base-100 rounded-[2.5rem] w-full max-w-md p-10 shadow-3xl animate-in zoom-in-95 duration-500 overflow-hidden border border-white/10">

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mt-24 -mr-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center">
                    {/* Icon Header (Premium Shield) */}
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary mb-8 shadow-2xl shadow-primary/30 transform -rotate-3">
                        {!isLoggedIn ? (
                            <Lock className="w-12 h-12 text-white" strokeWidth={2.5} />
                        ) : (
                            <Crown className="w-12 h-12 text-white" strokeWidth={2.5} />
                        )}
                    </div>

                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">
                        {title}
                    </h2>

                    <p className="text-white/60 mb-10 px-2 leading-relaxed font-medium">
                        {!isLoggedIn ? (
                            <>
                                กรุณาใช้บัญชี <span className="text-primary font-bold">YouTube (Gmail)</span> ของคุณ
                                <br />
                                เพื่อรับสิทธิการเข้าถึงแบบส่วนบุคคลผ่าน YouOke
                                <br />
                                <span className="text-white font-bold opacity-90 underline decoration-primary/50 underline-offset-4 decoration-2">
                                  และเริ่มต้นการเล่นแบบไร้โฆษณาคั่น 🛡️✨
                                </span>
                            </>
                        ) : (
                            <>
                                สิทธิการใช้งานแบบพรีเมียมส่วนบุคคลของคุณสิ้นสุดแล้ว
                                <br />
                                กรุณาเลือกแพ็กเกจที่คุณต้องการ
                                <br />
                                <span className="text-primary font-bold">เพื่อขยับขยายเวลาความสุขกับ YouOke 🎵⏳</span>
                            </>
                        )}
                    </p>

                    {/* Features (Shell Strategy) */}
                    {!isLoggedIn && (
                        <div className="grid grid-cols-1 gap-4 mb-10 text-left bg-white/5 rounded-2xl p-6 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-xs font-bold text-white/80">เล่นผ่านบัญชีของคุณเอง (Ad-Free)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Youtube className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-xs font-bold text-white/80">ดึงสิทธิ Playlist โดยตรงจากบัญชีคุณ</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={onAction}
                            className="w-full py-5 rounded-[1.25rem] bg-primary hover:brightness-110 active:scale-[0.97] transition-all text-white font-black text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            <Sparkles className="w-6 h-6" />
                            <span>{buttonText}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-white/30 hover:text-white/60 font-black text-xs uppercase tracking-widest transition-colors"
                        >
                            กลับไปสำรวจก่อน
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
