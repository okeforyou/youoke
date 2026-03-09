import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import {
    Check,
    Star,
    Smartphone,
    Tv,
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
    { title: "รีโมทมือถือ", desc: "คุมคิวเพลงผ่านมือถือ", icon: Smartphone, color: "bg-amber-500" },
    { title: "ระบบ 2 หน้าจอ", desc: "เลือกเพลงบนมือถือ", icon: Tv, color: "bg-purple-500" },
    { title: "ส่งขึ้นจอ TV", desc: "รองรับ Casting", icon: Play, color: "bg-blue-500" },
    { title: "ไร้โฆษณาคั่น", desc: "ร้องต่อเนื่องแบบ VIP", icon: Ban, color: "bg-rose-500" },
    { title: "แยกเพลง/คาราโอเกะ", desc: "ค้นหาแม่นยำตรงใจ", icon: Search, color: "bg-indigo-500" },
    { title: "ค้นหาด้วยเสียง", desc: "ไม่ต้องพิมพ์ แค่พูด", icon: Mic2, color: "bg-pink-500" },
    { title: "บันทึกเพลงโปรด", desc: "มีสมุดเพลงส่วนตัว", icon: Bookmark, color: "bg-green-500" },
    { title: "คลังเพลงทั่วโลก", desc: "เพลงครบจาก YouTube", icon: Heart, color: "bg-red-500" },
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

    const getPackageColor = (pkg: Package) => {
        if (pkg.price === 0) return "border-slate-200 text-slate-500 bg-slate-50";
        if (pkg.durationDays <= 30) return "border-blue-200 text-blue-600 bg-blue-50/30";
        if (pkg.durationDays <= 365) return "border-purple-200 text-purple-600 bg-purple-50/30";
        return "border-amber-200 text-amber-600 bg-amber-50/30";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <span className="loading loading-spinner text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
            <Head>
                <title>Premium Plans - YouOke</title>
            </Head>

            <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md px-4 py-3 md:px-8">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold">เลือกแพ็กเกจพรีเมียม</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 md:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black italic tracking-tighter mb-2">ปลดล็อกความสนุก</h2>
                    <p className="text-muted-foreground text-sm font-medium">สัมผัสประสบการณ์คาราโอเกะแบบเหนือระดับ</p>
                </div>

                {/* Features Grid - Smaller Icons */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-10 text-center">
                    {KILLER_FEATURES.map((feature, i) => (
                        <div key={i} className="flex flex-col items-center group">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-1 shadow-sm transition-transform group-hover:scale-110", feature.color)}>
                                <feature.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground truncate w-full">{feature.title}</span>
                        </div>
                    ))}
                </div>

                {/* Pricing List - Compact Rows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {packages
                        .filter(pkg => !pkg.id.toLowerCase().includes('test'))
                        .map((pkg) => {
                            const featuresList = pkg.features
                                ? (Array.isArray(pkg.features)
                                    ? pkg.features
                                    : Object.entries(pkg.features)
                                        .filter(([_, enabled]) => enabled === true)
                                        .map(([label]) => label))
                                : ["ร้องเพลงได้ไม่จำกัด"];

                            return (
                                <div key={pkg.id} className={cn("rounded-2xl border p-6 transition-all bg-card shadow-sm flex flex-col", pkg.isPopular ? "border-primary ring-1 ring-primary/10" : "border-border")}>
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", pkg.isPopular ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                                <Star className={cn("w-5 h-5", pkg.isPopular ? "fill-white" : "")} />
                                            </div>
                                            <div>
                                                <h3 className="font-black italic text-lg leading-none">{pkg.name}</h3>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1 opacity-60">{pkg.durationDays} วัน</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black italic">฿{pkg.price.toLocaleString()}</span>
                                            {pkg.isPopular && <p className="text-[9px] font-black text-primary uppercase tracking-tighter italic">Recommended</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
                                        {featuresList.slice(0, 6).map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                <Check className="w-3 h-3 text-primary shrink-0" />
                                                <span className="truncate">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                                        <button onClick={() => handleBuy(pkg)} className={cn("flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-transform active:scale-95", pkg.isPopular ? "bg-primary text-white" : "bg-foreground text-background")}>
                                            <QrCode className="w-4 h-4" /> สมัครสมาชิก
                                        </button>
                                        <button onClick={() => handleManualTransfer(pkg)} className="h-10 px-4 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground hover:bg-muted transition-colors">
                                            <Upload className="w-3.5 h-3.5" /> โอนเงิน
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </main>

            <OmiseQRModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} pkg={selectedPkg} />
            <UploadSlipModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} pkg={selectedPkg} />
        </div>
    );
}
