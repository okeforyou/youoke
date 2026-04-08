import React from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Crown, PartyPopper } from 'lucide-react';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestLimit: number;
}

export default function GuestLimitModal({
  isOpen,
  onClose,
  guestLimit,
}: GuestLimitModalProps) {
    const router = useRouter();
    const { user } = useAuthStore();

    if (!isOpen) return null;

    const isLoggedIn = !!user;
    const isExpired = user?.membership?.status === 'expired';

    const handleAction = () => {
        onClose();
        if (!isLoggedIn) {
            router.push('/login?action=link');
        } else {
            router.push('/pricing');
        }
    };

    const title = isLoggedIn && isExpired 
        ? "สิทธิสมาชิกหมดอายุแล้ว!" 
        : "หมดโควต้าฟังเพลงวันนี้แล้ว";

    const buttonText = !isLoggedIn 
        ? "เชื่อมต่อบัญชี YouTube (Gmail)" 
        : "อัปเกรดแผนการใช้งาน";

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

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {title}
                    </h2>

                    <div className="text-gray-500 dark:text-zinc-400 mb-8 px-2 font-medium leading-relaxed text-sm">
                        {!isLoggedIn ? (
                            "เชื่อมต่อบัญชี YouTube ส่วนตัวเพื่อรับสิทธิพิเศษ และเล่นเพลงโปรดของคุณแบบไม่มีโฆษณาคั่น"
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
                                {!isLoggedIn ? "ทดลองใช้พรีเมียมส่วนตัว!" : "สนุกแบบไม่จำกัดอีกครั้ง"}
                            </h3>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleAction}
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
}
