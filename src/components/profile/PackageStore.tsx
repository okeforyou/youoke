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
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={cn(
                            "relative overflow-hidden rounded-2xl border bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:border-primary/30 cursor-pointer group flex items-center justify-between",
                            pkg.isPopular ? "border-primary/20 bg-primary/5 shadow-sm" : "border-border"
                        )}
                        onClick={() => router.push('/packages')}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                pkg.isPopular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                            )}>
                                <Star className={cn("w-5 h-5", pkg.isPopular ? "fill-primary-foreground" : "")} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    {pkg.name}
                                    {pkg.isPopular && (
                                        <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Popular</span>
                                    )}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-medium text-foreground">฿{pkg.price.toLocaleString()}</span>
                                    <span className="text-[10px] text-muted-foreground">• {pkg.durationDays} วัน</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            ดูรายละเอียด
                            <ChevronLeft className="w-3 h-3 rotate-180" />
                        </div>
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
