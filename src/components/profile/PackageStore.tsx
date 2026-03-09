import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { Check, Star, Loader2, Upload, QrCode, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { UploadSlipModal } from "./UploadSlipModal";
import { OmiseQRModal } from "@/modules/billing/components/OmiseQRModal";
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
    const [showQRModal, setShowQRModal] = useState(false);
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

    const handleBuy = (pkg: Package) => {
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อนซื้อแพ็กเกจ");
            router.push('/login');
            return;
        }
        setSelectedPkg(pkg);
        setShowQRModal(true);
    };

    const handleManualTransfer = (pkg: Package) => {
        if (!user) {
            router.push('/login');
            return;
        }
        setSelectedPkg(pkg);
        setShowUploadModal(true);
    };

    if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner text-primary"></span></div>;

    if (packages.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-base-300 rounded-xl">
                <p className="text-base-content/60">ไม่พบแพ็กเกจที่เปิดขายในขณะนี้</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    เลือกแพ็กเกจความสนุก
                </h3>
                <p className="text-sm text-muted-foreground mt-1">ปลดล็อคฟีเจอร์พรีเมียม ร้องเพลงได้ไม่จำกัด!</p>
            </div>

            <div className="space-y-2">
                {packages
                    .filter(pkg => !pkg.id.toLowerCase().includes('test')) // Filter out test packages
                    .map((pkg) => {
                        // Color logic
                        const isFree = pkg.price === 0;
                        const isAnnual = pkg.durationDays >= 365 && pkg.durationDays < 9999;
                        const isPermanent = pkg.durationDays >= 9999;

                        let accentClass = "bg-blue-500";
                        if (isFree) accentClass = "bg-slate-400";
                        if (isAnnual) accentClass = "bg-purple-500";
                        if (isPermanent) accentClass = "bg-amber-500";

                        return (
                            <div
                                key={pkg.id}
                                className={cn(
                                    "group relative overflow-hidden rounded-xl border p-2.5 transition-all duration-200 hover:bg-muted/50 cursor-pointer flex items-center justify-between",
                                    pkg.isPopular ? "border-primary/40 bg-primary/[0.03]" : "border-border"
                                )}
                                onClick={() => router.push('/packages')}
                            >
                                <div className="flex items-center gap-3 overflow-hidden ml-1">
                                    <div className={cn("w-1 h-5 rounded-full shrink-0", accentClass)} />
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <h4 className="font-extrabold text-[13px] text-foreground tracking-tight shrink-0 italic">{pkg.name}</h4>
                                        <span className="text-muted-foreground/30 text-[10px] shrink-0">|</span>
                                        <span className="text-[14px] font-black italic text-foreground shrink-0 leading-none">฿{pkg.price.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground shrink-0 leading-none opacity-50 select-none">({pkg.durationDays} วัน)</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mr-1">
                                    {pkg.isPopular && (
                                        <span className="text-[7px] font-black bg-primary text-white px-1.5 py-0.5 rounded-md uppercase tracking-widest italic shrink-0">BEST Choice</span>
                                    )}
                                    <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        );
                    })}
            </div>

            <button
                onClick={() => router.push('/packages')}
                className="w-full mt-6 py-3 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 text-xs font-bold text-primary transition-all hover:bg-primary/5 flex items-center justify-center gap-2"
            >
                <QrCode className="w-4 h-4" /> ดูฟีเจอร์พรีเมียมทั้งหมดและชำระเงิน
            </button>

            <UploadSlipModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                pkg={selectedPkg}
            />

            <OmiseQRModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                pkg={selectedPkg}
            />
        </div>
    );
};
