import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import {
    Check,
    Star,
    Smartphone,
    Tv,
    Target,
    Zap,
    ShieldCheck,
    Music,
    Search,
    Mic2,
    Bookmark,
    Play,
    Ban,
    ChevronLeft,
    QrCode,
    Upload,
    Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useRouter } from 'next/router';
import { OmiseQRModal } from '@/modules/billing/components/OmiseQRModal';
import { UploadSlipModal } from '@/components/profile/UploadSlipModal';

interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description?: string;
    features?: any;
    isPopular?: boolean;
}

const KILLER_FEATURES = [
    { title: "รีโมทมือถือ", desc: "คุมคิวเพลงผ่านมือถือ 100%", icon: Smartphone, color: "bg-amber-500" },
    { title: "ระบบ 2 หน้าจอ", desc: "ร้องจอใหญ่ เลือกเพลงบนมือถือ", icon: Tv, color: "bg-purple-500" },
    { title: "ส่งขึ้นจอ TV", desc: "รองรับ Casting ทุกรูปแบบ", icon: Play, color: "bg-blue-500" },
    { title: "ไร้โฆษณาคั่น", desc: "ร้องต่อเนื่องแบบ VIP ไร้โฆษณา", icon: Ban, color: "bg-rose-500" },
    { title: "แยกเพลง/คาราโอเกะ", desc: "ค้นหาแม่นยำ เลือกได้ตรงใจ", icon: Search, color: "bg-indigo-500" },
    { title: "ค้นหาด้วยเสียง", desc: "ไม่ต้องพิมพ์ แค่พูดก็เจอเพลง", icon: Mic2, color: "bg-pink-500" },
    { title: "บันทึกเพลงโปรด", desc: "มีสมุดเพลงส่วนตัวเก็บไว้ร้องบ่อย", icon: Bookmark, color: "bg-green-500" },
    { title: "คลังเพลงทั่วโลก", desc: "เพลงถูกใจจาก YouTube ครบสูตร", icon: Heart, color: "bg-red-500" },
];

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPkg, setSelectedPkg] = useState<Package | undefined>(undefined);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
            <Head>
                <title>ยกระดับความสนุก - YouOke Premium</title>
                <meta name="description" content="เลือกแพ็กเกจพรีเมียม YouOke เพื่อประสบการณ์ร้องคาราโอเกะที่ดีที่สุด" />
            </Head>

            {/* Sticky Header */}
            <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md px-4 py-4 md:px-8">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">เลือกแพ็กเกจพรีเมียม</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 md:px-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
                        <Star className="w-3.5 h-3.5 fill-primary" />
                        PREMIUM PASS
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4">ปลดล็อกขีดจำกัดความสนุก</h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        สัมผัสประสบการณ์ร้องคาราโอเกะแบบโปร ด้วยฟีเจอร์ที่ออกแบบมาเพื่อความสะดวกสบายและอรรถรสสูงสุด
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {KILLER_FEATURES.map((feature, i) => (
                        <div key={i} className="bg-card border rounded-2xl p-4 md:p-6 shadow-sm flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300",
                                feature.color
                            )}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-sm md:text-base mb-1">{feature.title}</h3>
                            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg) => {
                        // Extract feature labels if it's an object, or use as is if it's an array
                        const featuresList = pkg.features
                            ? (Array.isArray(pkg.features)
                                ? pkg.features
                                : Object.entries(pkg.features)
                                    .filter(([_, enabled]) => enabled === true)
                                    .map(([label]) => label))
                            : ["ร้องเพลงได้ไม่จำกัด"];

                        return (
                            <div
                                key={pkg.id}
                                className={cn(
                                    "relative bg-card border-2 rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-2",
                                    pkg.isPopular
                                        ? "border-primary shadow-xl shadow-primary/10"
                                        : "border-border shadow-md"
                                )}
                            >
                                {pkg.isPopular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                        ยอดนิยม
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">฿{pkg.price.toLocaleString()}</span>
                                        <span className="text-muted-foreground text-sm">/ {pkg.durationDays} วัน</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 flex-1">
                                    {featuresList.map((f, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm">
                                            <div className="mt-1 bg-green-500/10 rounded-full p-0.5">
                                                <Check className="w-3.5 h-3.5 text-green-500" />
                                            </div>
                                            <span className="text-foreground/80 font-medium">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => handleBuy(pkg)}
                                        className={cn(
                                            "w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95",
                                            pkg.isPopular
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                : "bg-muted hover:bg-muted/80"
                                        )}
                                    >
                                        <QrCode className="w-5 h-5" />
                                        ซื้อพรีเมียม (PromptPay)
                                    </button>

                                    <button
                                        onClick={() => handleManualTransfer(pkg)}
                                        className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 py-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        โอนเงิน / แนบสลิป
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <OmiseQRModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                pkg={selectedPkg}
            />

            <UploadSlipModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                pkg={selectedPkg}
            />
        </div>
    );
}
