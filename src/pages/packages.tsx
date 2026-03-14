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
    Heart,
    Zap
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

    const handleBuy = async (pkg: Package) => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (pkg.price === 0) {
            // Instant Activation for Free/Trial packages
            try {
                setLoading(true);
                const { activateFreePackage } = await import('@/modules/billing/services/paymentService');
                await activateFreePackage(user.uid!, pkg.id);
                alert("ยินดีด้วย! คุณได้รับสิทธิ์ใช้งานพรีเมียมแล้ว (1 วัน)");
                router.push('/');
            } catch (error) {
                console.error("Activation error:", error);
                alert("เกิดข้อผิดพลาดในการเปิดใช้งาน กรุณาลองใหม่ภายหลัง");
            } finally {
                setLoading(false);
            }
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-widest mb-4 uppercase">
                        <Star className="w-3.5 h-3.5 fill-primary" />
                        Premium Pass
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-foreground">ปลดล็อกขีดจำกัดความสนุก</h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed font-semibold">
                        สัมผัสประสบการณ์ร้องคาราโอเกะแบบมืออาชีพ ด้วยฟีเจอร์ที่ออกแบบมาเพื่อความสะดวกสบายและอรรถรสสูงสุด
                    </p>
                </div>

                {/* Features Grid - Restored Larger Style */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {KILLER_FEATURES.map((feature, i) => (
                        <div key={i} className="bg-card border rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 group-hover:scale-110 transition-transform duration-500",
                                feature.color
                            )}>
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-[13px] md:text-base mb-1 tracking-tight">{feature.title}</h3>
                            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight font-semibold">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Pricing Cards - Restored Larger Structure but small fonts & same-line header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                                <div
                                    key={pkg.id}
                                    className={cn(
                                        "relative bg-card border rounded-[2.5rem] p-10 flex flex-col transition-all duration-500 group overflow-hidden",
                                        pkg.isPopular
                                            ? "border-primary/50 shadow-[0_24px_50px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/20"
                                            : "border-border shadow-sm hover:shadow-2xl hover:shadow-primary/5"
                                    )}
                                >
                                    {pkg.isPopular && (
                                        <div className="absolute top-0 right-0 bg-primary text-white px-6 py-1.5 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg z-10">
                                            Popular
                                        </div>
                                    )}

                                    <div className="mb-8 border-b pb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-black tracking-tight">{pkg.name}</h3>
                                            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">{pkg.durationDays} วัน</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black tracking-tighter">฿{pkg.price.toLocaleString()}</span>
                                            <span className="text-muted-foreground font-bold text-[10px] uppercase opacity-40">บาท</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10 flex-1 relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">สิทธิประโยชน์พรีเมียม</p>
                                        {featuresList.map((f, i) => (
                                            <div key={i} className="flex items-start gap-3 text-xs group/item">
                                                <div className="mt-0.5 bg-primary/10 rounded-full p-1 group-hover/item:bg-primary/20 transition-colors shrink-0">
                                                    <Check className="w-3 h-3 text-primary" />
                                                </div>
                                                <span className="text-foreground/80 font-bold group-hover/item:text-foreground transition-colors leading-relaxed">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 relative z-10">
                                        <button
                                            onClick={() => handleBuy(pkg)}
                                            className={cn(
                                                "w-full h-12 rounded-[1.2rem] flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95 shadow-lg",
                                                pkg.isPopular
                                                    ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                                    : "bg-foreground text-background hover:bg-foreground/90"
                                            )}
                                        >
                                            {pkg.price === 0 ? <Zap className="w-4.5 h-4.5" /> : <QrCode className="w-4.5 h-4.5" />}
                                            {pkg.price === 0 ? "รับสิทธิ์ใช้งานฟรี" : "สมัครสมาชิกทันที"}
                                        </button>

                                        {pkg.price > 0 && (
                                            <button
                                                onClick={() => handleManualTransfer(pkg)}
                                                className="w-full text-[10px] font-black text-muted-foreground/60 hover:text-primary transition-colors flex items-center justify-center gap-2 py-1"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                โอนเงิน / แนบสลิป
                                            </button>
                                        )}
                                    </div>

                                    {pkg.isPopular && (
                                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                                    )}
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
