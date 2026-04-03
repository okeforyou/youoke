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
    Zap,
    Crown
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
    const isLineConnected = !!user?.lineUserId;

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
                console.log("🚀 Activating free package:", pkg.name, "for user:", user.uid);
                setLoading(true);
                const { activateFreePackage } = await import('@/modules/billing/services/paymentService');
                await activateFreePackage(user.uid!, pkg.id);
                console.log("✅ Free package activated successfully");
                alert(`ยินดีด้วย! แพ็กเกจ ${pkg.name} ของคุณถูกเปิดใช้งานแล้ว`);
                router.push('/');
            } catch (error: any) {
                console.error("❌ Activation failed:", error);
                alert("เกิดข้อผิดพลาดในการเปิดใช้งานแพ็กเกจฟรี");
            } finally {
                setLoading(false);
            }
            return;
        }

        // For Paid Packages - Open Payment Modal
        setSelectedPkg(pkg);
        setShowUploadModal(true);
    };

    const handleManualTransfer = (pkg: Package) => {
        if (!user) {
            router.push('/login');
            return;
        }
        setSelectedPkg(pkg);
        setShowUploadModal(true);
    };

    const handleActivateWithQR = (pkg: Package) => {
        setSelectedPkg(pkg);
        setShowQRModal(true);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
            <Head>
                <title>YouOKE - เลือกแพ็กเกจคาราโอเกะ</title>
                <meta name="description" content="เลือกแพ็กเกจคาราโอเกะที่ต้องการ ร้องเพลงต่อเนื่องไม่มีโฆษณาคั่น" />
            </Head>

            {/* Header Content */}
            <header className="relative pt-24 pb-16 px-6 max-w-7xl mx-auto overflow-hidden">
                <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Crown className="w-4 h-4" />
                        YouOKE Premium Experience
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-700">
                        ร้องเพลงให้สุด <br />
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-600 bg-clip-text text-transparent">หยุดทุกโฆษณา</span>
                    </h1>
                    
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl font-bold max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        ร่วมเป็นส่วนหนึ่งของครอบครัว YouOKE รับสิทธิพิเศษมากมาย <br className="hidden md:block" /> ปลดล็อกฟีเจอร์พรีเมียมให้การร้องเพลงของคุณสนุกขึ้น 200%
                    </p>
                </div>
            </header>

            {/* Package Grid */}
            <main className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-[500px] rounded-[3rem] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                        ))
                    ) : (
                        packages.map((pkg) => (
                            <div 
                                key={pkg.id}
                                className={cn(
                                    "group relative flex flex-col h-full rounded-[3rem] p-8 transition-all duration-500",
                                    pkg.isPopular 
                                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-12px_rgba(255,255,255,0.1)] scale-105 z-10" 
                                        : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-none"
                                )}
                            >
                                {pkg.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-white rounded-full text-xs font-black tracking-widest uppercase shadow-xl shadow-primary/20">
                                        추천 - ยอดนิยม
                                    </div>
                                )}

                                <div className="space-y-6 flex-grow">
                                    <h3 className="text-2xl font-black">{pkg.name}</h3>
                                    
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black tracking-tighter">฿{pkg.price}</span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            pkg.isPopular ? "opacity-60" : "text-zinc-400"
                                        )}>
                                            /{pkg.durationDays} วัน
                                        </span>
                                    </div>

                                    {pkg.description && (
                                        <p className={cn(
                                            "text-sm font-bold line-clamp-2",
                                            pkg.isPopular ? "opacity-70" : "text-zinc-500"
                                        )}>
                                            {pkg.description}
                                        </p>
                                    )}

                                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        {Object.entries(pkg.features || {}).map(([key, val]: [string, any], idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                                    pkg.isPopular ? "bg-primary text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                                )}>
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                </div>
                                                <span className="text-sm font-bold">{key} {val && `(${val})`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="space-y-3 relative z-10">
                                        <button
                                            onClick={() => {
                                                // 🛡️ v4.9.13: FORCE LINE CONNECTION FOR BILLING
                                                if (!isLineConnected && pkg.price > 0) {
                                                    alert("📢 เพื่อรับเลขบัญชีและแจ้งเตือนผ่าน LINE\nกรุณาเชื่อมต่อ LINE ก่อนดำเนินการสั่งซื้อครับ");
                                                    router.push('/profile');
                                                    return;
                                                }

                                                if (pkg.price === 0) {
                                                    handleBuy(pkg);
                                                } else {
                                                    handleManualTransfer(pkg);
                                                }
                                           }}
                                            className={cn(
                                                "w-full h-12 rounded-[1.2rem] flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-95 shadow-lg",
                                                pkg.isPopular
                                                    ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                                    : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-zinc-200/50 dark:shadow-none"
                                            )}
                                        >
                                            {pkg.price === 0 ? <Zap className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
                                            {pkg.price === 0 ? "รับสิทธิ์ใช้งานฟรี" : (isLineConnected ? "ชำระเงินด้วย QR Code" : "เชื่อมต่อ LINE เพื่อสั่งซื้อ")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Features Section */}
                <section className="mt-32">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight">ทำไมต้อง YouOKE Premium?</h2>
                        <p className="text-zinc-500 font-bold max-w-xl mx-auto">ฟีเจอร์ระดับอัจฉริยะที่ออกแบบมาเพื่อให้คุณเป็นราชาและราชินีแห่งคาราโอเกะ</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {KILLER_FEATURES.map((feature, i) => (
                            <div 
                                key={i}
                                className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-primary/20 transition-all group"
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                    feature.color,
                                    "text-white"
                                )}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-lg mb-2">{feature.title}</h3>
                                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Modals */}
            {selectedPkg && (
                <>
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
                </>
            )}
        </div>
    );
}
