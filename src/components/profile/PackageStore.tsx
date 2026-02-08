import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { Check, Star, Loader2, Upload, QrCode } from "lucide-react";
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={cn(
                            "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:bg-muted/50 hover:shadow-md cursor-pointer group flex flex-col",
                            pkg.isPopular ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
                        )}
                        onClick={() => handleBuy(pkg)} // Click card to buy
                    >
                        {pkg.isPopular && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10 uppercase tracking-wide">
                                Popular
                            </div>
                        )}

                        <div className="mb-4">
                            <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">{pkg.name}</h4>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-foreground">{pkg.price.toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">บาท</span>
                            </div>
                            <div className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground mt-2">
                                {pkg.durationDays} วัน
                            </div>
                        </div>

                        <div className="space-y-2 mb-4 flex-1">
                            {pkg.features && pkg.features.length > 0 ? (
                                pkg.features.slice(0, 3).map((feature, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2 leading-tight">{feature}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-green-500" /> ร้องเพลงได้ไม่จำกัด
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mt-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleBuy(pkg); }}
                                className={cn(
                                    "w-full rounded-lg text-xs font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-3 flex items-center justify-center gap-2",
                                    pkg.isPopular
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}>
                                <QrCode className="w-4 h-4" /> สแกนจ่าย (PromptPay)
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); handleManualTransfer(pkg); }}
                                className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 hover:bg-muted rounded-lg transition-colors"
                            >
                                <Upload className="w-3 h-3" /> โอนเงิน / แนบสลิป
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
