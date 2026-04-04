import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/firebase";
import { Star, Loader2, QrCode, Zap, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { UploadSlipModal } from "./UploadSlipModal";
import { useRouter } from "next/router";



interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description?: string;
    features?: string[];
    isPopular?: boolean;
}

export const PackageStore = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedPkg, setSelectedPkg] = useState<Package | undefined>(undefined);

    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                if (!db) return;
                const q = query(
                    collection(db, "packages"),
                    orderBy("price", "asc")
                );

                const snapshot = await getDocs(q);
                const pkgList = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // v4.9.68: Fix field name to match admin UI (isActive)
                        isActive: data.isActive !== false 
                    };
                }) as (Package & { isActive: boolean })[];

                // v4.9.68: Hide if isActive is explicitly false
                const activePackages = pkgList.filter(pkg => 
                    pkg.isActive !== false && 
                    !pkg.id.toLowerCase().includes('test')
                );

                console.log("📦 Active Packages Count:", activePackages.length);
                setPackages(activePackages);
            } catch (error) {
                console.error("Error fetching packages:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);


    const handleBuy = async (pkg: Package) => {
        if (!user) {
            router.push('/login');
            return;
        }

        // v4.9.52: Premium Integration Flow
        if (pkg.price === 0) {
            // Instant Activation for Free/Trial packages
            try {
                setLoading(true);
                const { activateFreePackage } = await import('@/modules/billing/services/paymentService');
                await activateFreePackage(user.uid!, pkg.id);
                alert(`ยินดีด้วย! แพ็กเกจ ${pkg.name} ของคุณถูกเปิดใช้งานแล้ว`);
                window.location.reload(); 
            } catch (error: any) {
                console.error("❌ Activation failed:", error);
                alert("เกิดข้อผิดพลาดในการเปิดใช้งานแพ็กเกจฟรี");
            } finally {
                setLoading(false);
            }
            return;
        }

        // Paid Packages -> Open Upload Modal
        setSelectedPkg(pkg);
        setShowUploadModal(true);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-slate-400">กำลังดึงข้อมูลแพ็กเกจ...</p>
        </div>
    );

    if (packages.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-[32px]">
                <p className="text-sm font-bold text-slate-400">ไม่พบแพ็กเกจที่เปิดขายในขณะนี้</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* v4.9.33: Quick Trial Activation Spotlight */}
            <div 
                onClick={() => {
                    const trialPkg = packages.find(p => p.price === 0 && p.durationDays === 1) || packages.find(p => p.price === 0);
                    if (trialPkg) handleBuy(trialPkg);
                }}
                className="relative group overflow-hidden rounded-[28px] p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/10"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <h4 className="font-black text-sm text-white leading-tight">รับสิทธิ์พรีเมียมฟรี 1 วัน</h4>
                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-0.5">Full Unlocked Experience</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-lg">
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {packages
                    .filter(pkg => !pkg.id.toLowerCase().includes('test'))
                    .map((pkg) => {
                        const isFree = pkg.price === 0;
                        const isAnnual = pkg.durationDays >= 300 && pkg.durationDays < 9999;
                        const isPermanent = pkg.durationDays >= 9999;
                        const isPopular = pkg.isPopular;

                        // v4.9.32 Dynamic Color Coding Logic
                        let accentClass = "bg-primary";
                        let bgClass = "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800";
                        
                        if (isFree) accentClass = "bg-slate-400";
                        if (isAnnual) accentClass = "bg-purple-600";
                        if (isPermanent) accentClass = "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
                        
                        return (
                            <div
                                key={pkg.id}
                                onClick={() => handleBuy(pkg)}
                                className={cn(
                                    "group relative overflow-hidden rounded-[24px] border transition-all duration-300 cursor-pointer flex items-center justify-between p-3.5",
                                    bgClass,
                                    "hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]",
                                    isPopular && "border-primary/20 ring-1 ring-primary/5"
                                )}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Color Indicator Vertical Bar (v4.3.4 style return) */}
                                    <div className={cn("w-1.5 h-10 rounded-full shrink-0 shadow-sm", accentClass)} />

                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <h4 className="font-black text-[15px] text-slate-900 dark:text-white truncate tracking-tight shrink-0">{pkg.name}</h4>
                                            {isPopular && (
                                                <span className="text-[7px] font-black bg-primary text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0">แนะนำ</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 truncate opacity-80 uppercase tracking-widest mt-0.5">
                                            {pkg.durationDays >= 9999 ? 'เปิดใช้งานถาวร' : `${pkg.durationDays} วัน`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <div className="text-right">
                                        <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                            ฿{pkg.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                        "bg-slate-50 group-hover:bg-primary group-hover:text-white dark:bg-zinc-800"
                                    )}>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            <div className="p-4 bg-primary/5 rounded-[24px] border border-primary/10">
                <p className="text-[10px] font-black text-primary/70 leading-relaxed text-center">
                    * เมื่อเลือกแพ็กเกจแล้ว ระบบจะพาคุณไปที่หน้าชำระเงิน <br />
                    คุณสามารถแจ้งโอนเงินผ่านแชท LINE @243lercy ได้ทันทีครับ
                </p>
            </div>

            <button
                onClick={() => router.push('/packages')}
                className="w-full mt-2 py-4 rounded-[28px] border-2 border-dashed border-primary/30 hover:border-primary text-xs font-black text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
                <QrCode className="w-5 h-5" /> 
                <span>ดูรายละเอียดฟีเจอร์พรีเมียมทั้งหมด</span>
            </button>

            {selectedPkg && (
                <UploadSlipModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    pkg={selectedPkg}
                />
            )}
        </div>
    );
};
