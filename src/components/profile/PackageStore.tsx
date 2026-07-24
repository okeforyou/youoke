import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    CheckCircleIcon, 
    SparklesIcon, 
    ChevronRightIcon, 
    ShieldCheckIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { cn } from '@/lib/utils';
import { Zap, QrCode } from 'lucide-react';
import { UploadSlipModal } from './UploadSlipModal';
import { LineRequiredModal } from './LineRequiredModal';
import { useUIStore } from '@/stores/useUIStore';

import { db } from '@/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description?: string;
    isPopular?: boolean;
    isActive?: boolean;
}

export const PackageStore = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuthStore();
    const { showConfirm } = useUIStore();
    const [selectedPkg, setSelectedPkg] = useState<Package | undefined>(undefined);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLineModal, setShowLineModal] = useState(false);
    const [realProfile, setRealProfile] = useState<any>(null);

    // 🌐 Fetch Dynamic Packages from Firebase
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                if (!db) return;
                const q = query(
                    collection(db, "packages"),
                    orderBy("price", "asc")
                );

                const snapshot = await getDocs(q);
                const pkgList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Package[];

                // Filter only active packages
                const activePackages = pkgList.filter(pkg => pkg.isActive !== false);
                setPackages(activePackages);
            } catch (error) {
                console.error("Error fetching packages:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

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
    if (loading) {
        return (
            <div className="flex flex-col space-y-4">
                <div className="h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-900 animate-pulse border border-gray-100 dark:border-zinc-800/50 shadow-sm" />
                <div className="space-y-3">
                    <div className="h-32 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse border border-gray-100 dark:border-zinc-800/50 shadow-sm" />
                    <div className="h-32 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse border border-gray-100 dark:border-zinc-800/50 shadow-sm" />
                </div>
            </div>
        );
    }

    const trialPackage = packages.find(p => p.price === 0);

    return (
        <div className="flex flex-col space-y-4">
            {/* Trial Package Row */}
            {!hideTrialCard && trialPackage && (
                <div 
                    onClick={() => {
                        if (isTrialActive) return;
                        handleSelect(trialPackage);
                    }}
                    className={cn(
                        "group relative overflow-hidden rounded-3xl p-4 transition-all shadow-sm flex items-center justify-between",
                        isTrialActive 
                            ? "bg-emerald-800 cursor-default" 
                            : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-[0.98]"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                            {isTrialActive ? <CheckCircleIcon className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-current" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white leading-tight">
                                {isTrialActive ? "ได้รับสิทธิ์ใช้งานฟรี 1 วันแล้ว" : "ทดลองใช้พรีเมียมฟรี"}
                            </h3>
                            <p className="text-[11px] font-medium text-emerald-100/80 mt-0.5">
                                {isTrialActive ? "สนุกกับการร้องเพลงให้เต็มที่ครับ!" : "รับสิทธิ์ใช้งานฟรี 1 วันเต็ม"}
                            </p>
                        </div>
                    </div>
                    {!isTrialActive && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <ChevronRightIcon className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">เลือกแพ็กเกจ VIP</p>
                <button 
                    onClick={() => router.push('/packages')} 
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-0.5"
                >
                    ดูรายละเอียดสิทธิประโยชน์
                    <ChevronRightIcon className="w-3 h-3" strokeWidth={3} />
                </button>
            </div>

            {/* Compact Package List */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50 shadow-sm">
                {packages.filter(p => p.price > 0).map((pkg) => {
                    const isPremium = pkg.price > 100;

                    return (
                        <div 
                            key={pkg.id}
                            onClick={() => handleSelect(pkg)}
                            className="group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer active:bg-zinc-100 dark:active:bg-zinc-800"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white",
                                    isPremium ? "bg-purple-500" : "bg-blue-500"
                                )}>
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{pkg.name}</h4>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider",
                                            isPremium ? "bg-purple-500" : "bg-blue-500"
                                        )}>แนะนำ</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[11px] font-medium text-zinc-500">ใช้งานได้ {pkg.durationDays} วัน</p>
                                        <div className="hidden sm:flex items-center gap-1 text-emerald-500">
                                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-bold">ปลอดภัย</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-14 sm:pl-0">
                                <span className="text-base font-black text-zinc-900 dark:text-white">฿{pkg.price}</span>
                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
                                    <ChevronRightIcon className="w-4 h-4 text-zinc-400" strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 px-4 py-3.5 rounded-2xl bg-zinc-950 flex items-center justify-center text-center">
                    <p className="text-[11px] font-bold text-zinc-400 leading-tight">
                        แจ้งโอนเงินผ่าน LINE <span className="text-white">@243lercy</span>
                    </p>
                </div>
                <button
                    onClick={() => router.push('/packages')}
                    className="flex-1 px-4 py-3.5 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-[11px] font-bold text-zinc-900 dark:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <InformationCircleIcon className="w-4 h-4 text-zinc-400" /> 
                    <span>เปรียบเทียบแพ็กเกจทั้งหมด</span>
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
