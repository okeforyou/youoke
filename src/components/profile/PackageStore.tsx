import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { Star, Loader2, QrCode } from "lucide-react";
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
                const pkgList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Package[];

                setPackages(pkgList);
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

        // v4.9.31: Premium Integration Flow
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
            <div className="space-y-3">
                {packages
                    .filter(pkg => !pkg.id.toLowerCase().includes('test'))
                    .map((pkg) => {
                        const isPopular = pkg.isPopular;
                        
                        return (
                            <div
                                key={pkg.id}
                                onClick={() => handleBuy(pkg)}
                                className={cn(
                                    "group relative overflow-hidden rounded-[28px] border p-4 transition-all duration-300 cursor-pointer",
                                    isPopular 
                                        ? "bg-slate-900 border-slate-800 shadow-xl shadow-slate-200" 
                                        : "bg-white border-slate-100 hover:border-primary/30"
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute top-3 right-4">
                                        <div className="px-2 py-0.5 bg-primary text-[8px] font-black text-white rounded-full uppercase tracking-widest">
                                            POPULAR
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                                            isPopular ? "bg-primary text-white" : "bg-slate-50 text-slate-400"
                                        )}>
                                            <Star className={cn("w-5 h-5", isPopular && "fill-current")} />
                                        </div>
                                        <div>
                                            <h4 className={cn("font-black text-sm", isPopular ? "text-white" : "text-slate-900")}>
                                                {pkg.name}
                                            </h4>
                                            <p className={cn("text-[10px] font-bold text-slate-400")}>
                                                ระยะเวลา {pkg.durationDays} วัน
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn("text-2xl font-black", isPopular ? "text-primary" : "text-slate-900")}>
                                                ฿{pkg.price.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                            isPopular ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                                        )}>
                                            เลือกแพ็กเกจ
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            <div className="p-4 bg-slate-50 rounded-[28px] border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                    * เมื่อเลือกแพ็กเกจแล้ว ระบบจะพาคุณไปยังหน้ายืนยันการโอนเงิน เพื่อตรวจสอบข้อมูลและแจ้งชำระเงินผ่าน LINE ครับ
                </p>
            </div>

            <button
                onClick={() => router.push('/packages')}
                className="w-full mt-2 py-3 rounded-2xl border border-dashed border-slate-200 hover:border-primary/50 text-[10px] font-black text-slate-300 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
                <QrCode className="w-3 h-3" /> ดูฟีเจอร์พรีเมียมทั้งหมด
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
