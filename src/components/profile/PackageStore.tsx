import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
    CheckCircleIcon, 
    SparklesIcon, 
    ChevronRightIcon, 
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { cn } from '@/lib/utils';
import { Zap, QrCode } from 'lucide-react';
import { UploadSlipModal } from './UploadSlipModal';
import { LineRequiredModal } from './LineRequiredModal';
import { useUIStore } from '@/stores/useUIStore';

interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description?: string;
    isPopular?: boolean;
}

const PACKAGES: Package[] = [
    { id: 'trial_1d', name: '1 วัน', price: 0, durationDays: 1, description: 'ทดลองใช้งานเครื่องมือพรีเมียมทั้งหมด' },
    { id: 'monthly_50', name: '1 เดือน', price: 50, durationDays: 30, description: 'ร้องเพลงไม่อั้น ไม่มีโฆษณาคั่น' },
    { id: 'yearly_350', name: '1 ปี', price: 350, durationDays: 365, description: 'คุ้มค่าที่สุด สนุกต่อเนื่องยาวนาน' },
];

export const PackageStore = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { showConfirm } = useUIStore();
    const [selectedPkg, setSelectedPkg] = useState<Package | undefined>(undefined);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLineModal, setShowLineModal] = useState(false);

    const [realProfile, setRealProfile] = useState<any>(null);

    useEffect(() => {
        if (!user?.uid) return;
        const fetchProfile = async () => {
            const { getUserProfile } = await import('@/services/userService');
            const result = await getUserProfile(user.uid);
            if (result.success) setRealProfile(result.data);
        };
        fetchProfile();
    }, [user?.uid]);

    const isPremium = realProfile?.role === 'premium' || user?.isPremium;
    const membershipType = realProfile?.subscription?.plan || user?.membership?.type || user?.tier;
    const membershipStatus = realProfile?.subscription?.status || user?.membership?.status;
    const isTrialActive = isPremium && membershipType === 'trial';
    
    // Hide trial if they are already premium OR currently on trial OR expired
    const hideTrialCard = membershipType === 'trial' || isPremium || membershipStatus === 'expired';

    const handleSelect = async (pkg: Package) => {
        if (!user) {
            router.push('/login');
            return;
        }

        // v5.3.28 Mandatory LINE Connection Check (Restore System Modal)
        if (!user.lineUserId) {
            setShowLineModal(true);
            return;
        }

        if (pkg.price === 0) {
            try {
                const { activateFreePackage } = await import('@/modules/billing/services/paymentService');
                await activateFreePackage(user.uid!, pkg.id);
                showConfirm({
                    title: "เปิดใช้งานสำเร็จ! 🎉",
                    message: `สิทธิ์ใช้งานฟรี 1 วันถูกเพิ่มให้บัญชีของคุณเรียบร้อยแล้ว ขอให้สนุกกับการร้องเพลงนะครับ!`,
                    type: "success",
                    confirmText: "ตกลง",
                    onConfirm: () => window.location.reload()
                });
            } catch (error) {
                console.error("Free activation failed:", error);
                showConfirm({
                    title: "เกิดข้อผิดพลาด",
                    message: "ไม่สามารถเปิดใช้งานแพ็กเกจฟรีได้ กรุณาลองใหม่อีกครั้งครับ",
                    type: "danger",
                    confirmText: "ตกลง",
                    onConfirm: () => {}
                });
            }
            return;
        }

        setSelectedPkg(pkg);
        setShowUploadModal(true);
    };

    return (
        <div className="flex flex-col space-y-4">
            {/* v5.4: Trial Hero (Thai & Ultra Compact) */}
            {!hideTrialCard && (
                <div 
                    onClick={() => {
                        if (isTrialActive) return;
                        handleSelect(PACKAGES[0]);
                    }}
                    className={cn(
                        "group relative overflow-hidden rounded-3xl p-4 border-2 transition-all",
                        isTrialActive 
                            ? "bg-emerald-800 border-emerald-900 cursor-default" 
                            : "bg-emerald-600 border-emerald-700 cursor-pointer active:scale-[0.98]"
                    )}
                >
                    <div className="relative flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                {isTrialActive ? <CheckCircleIcon className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-current" />}
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white leading-tight">
                                    {isTrialActive ? "ได้รับสิทธิ์ใช้งานฟรี 1 วันแล้ว" : "ทดลองใช้พรีเมียมฟรี"}
                                </h3>
                                <p className="text-[10px] font-bold text-emerald-100/80">
                                    {isTrialActive ? "สนุกกับการร้องเพลงให้เต็มที่ครับ!" : "รับสิทธิ์ใช้งานฟรี 1 วันเต็ม"}
                                </p>
                            </div>
                        </div>
                        {!isTrialActive && (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <ChevronRightIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">เลือกแพ็กเกจ VIP</p>

            <div className="space-y-3">
                {PACKAGES.filter(p => p.price > 0).map((pkg) => {
                    const isPremium = pkg.price > 100;

                    return (
                        <div 
                            key={pkg.id}
                            onClick={() => handleSelect(pkg)}
                            className={cn(
                                "group relative p-5 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98]",
                                isPremium 
                                    ? "bg-zinc-50 border-purple-100 hover:border-purple-300" 
                                    : "bg-zinc-50 border-blue-100 hover:border-blue-300"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-xl font-black text-zinc-950 tracking-tight">{pkg.name}</h4>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase",
                                            isPremium ? "bg-purple-500" : "bg-blue-500"
                                        )}>แนะนำ</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        <p className="text-[11px] font-bold">ใช้งานได้ {pkg.durationDays} วัน</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110",
                                    isPremium ? "bg-purple-600" : "bg-blue-600"
                                )}>
                                    <ChevronRightIcon className="w-6 h-6 stroke-[3]" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed border-zinc-200 flex items-center justify-between">
                                <div className="flex items-baseline gap-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-0.5">ราคาแพ็กเกจ</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-zinc-950">฿{pkg.price}</span>
                                        <span className="text-[10px] font-bold text-zinc-400">/ ครั้งเดียว</span>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-white border border-zinc-100 flex items-center gap-1.5">
                                    <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ชำระเงินปลอดภัย</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-2">
                <div className="p-5 rounded-3xl bg-zinc-950 flex items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-zinc-400 leading-relaxed italic">
                        * แจ้งโอนเงินผ่านแชท <span className="text-white font-black">LINE @243lercy</span> ได้ทันทีครับ <br />
                        ระบบจะเปิดสิทธิ์การใช้งานให้คุณภายใน 1-3 นาที
                    </p>
                </div>

                <button
                    onClick={() => router.push('/packages')}
                    className="w-full mt-3 py-5 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-[13px] font-black text-zinc-950 dark:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <QrCode className="w-5 h-5" /> 
                    <span>ดูรายละเอียดและเลือกแพ็กเกจทั้งหมด</span>
                </button>
            </div>

            {/* Subscription Modal Integration */}
            {selectedPkg && (
                <UploadSlipModal 
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    pkg={selectedPkg}
                />
            )}

            {/* v5.3.29: LINE Connection Mandatory Modal */}
            <LineRequiredModal 
                isOpen={showLineModal} 
                onClose={() => setShowLineModal(false)} 
            />
        </div>
    );
};
