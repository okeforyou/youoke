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

            <div className="space-y-3">
                {packages
                    .filter(pkg => !pkg.id.toLowerCase().includes('test')) // Filter out test packages
                    .map((pkg) => (
                        <div
                            key={pkg.id}
                            className={cn(
                                "group relative overflow-hidden rounded-[1.5rem] border p-4 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 cursor-pointer flex items-center gap-4",
                                pkg.isPopular
                                    ? "bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/30 ring-1 ring-primary/10"
                                    : "bg-card hover:bg-muted/40 border-border hover:border-primary/20"
                            )}
                            onClick={() => router.push('/packages')}
                        >
                            {/* Icon / Brand Circle */}
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                                pkg.isPopular
                                    ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-primary/20"
                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                <Star className={cn("w-5 h-5", pkg.isPopular ? "fill-white" : "group-hover:fill-primary")} />
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="flex flex-col min-w-0">
                                    <h4 className="font-black text-[15px] tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                        {pkg.name}
                                        {pkg.isPopular && (
                                            <span className="text-[7px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest italic shadow-sm">Best Choice</span>
                                        )}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-sm font-black italic bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">฿{pkg.price.toLocaleString()}</span>
                                        <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-tighter shrink-0 select-none">
                                            • {pkg.durationDays} วัน
                                        </span>
                                    </div>
                                </div>

                                {/* Action Arrow */}
                                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </div>

                            {/* Subtle Deco */}
                            {pkg.isPopular && (
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
                            )}
                        </div>
                    ))}
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
