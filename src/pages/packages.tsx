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
    Crown,
    MessageCircle,
    Sparkles,
    ChevronRight,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useRouter } from 'next/router';
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
    { title: "ระบบ 2 หน้าจอ", desc: "ร้องจอใหญ่ เลือกเพลงบนมือถือ", icon: Tv, color: "bg-purple-600" },
    { title: "ส่งขึ้นจอ TV", desc: "รองรับ Casting ทุกรูปแบบ", icon: Play, color: "bg-blue-600" },
    { title: "ไร้โฆษณาคั่น", desc: "ร้องต่อเนื่องแบบ VIP ไร้โฆษณา", icon: Ban, color: "bg-rose-600" },
    { title: "แยกเพลง/คาราโอเกะ", desc: "ค้นหาแม่นยำ เลือกได้ตรงใจ", icon: Search, color: "bg-indigo-600" },
    { title: "ค้นหาด้วยเสียง", desc: "ไม่ต้องพิมพ์ แค่พูดก็เจอเพลง", icon: Mic2, color: "bg-pink-600" },
    { title: "บันทึกเพลงโปรด", desc: "มีสมุดเพลงส่วนตัวเก็บไว้ร้องบ่อย", icon: Bookmark, color: "bg-emerald-600" },
    { title: "คลังเพลงทั่วโลก", desc: "เพลงถูกใจจาก YouTube ครบสูตร", icon: Heart, color: "bg-red-600" },
];

let shopPackageCache: Package[] | null = null;

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>(shopPackageCache || []);
    const [loading, setLoading] = useState(!shopPackageCache);
    const [selectedPkg, setSelectedPkg] = useState<Package | undefined>(undefined);
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
                })) as (Package & { isActive?: boolean })[];

                const filteredPackages = pkgList.filter(pkg => 
                    pkg.isActive !== false && 
                    !pkg.id.toLowerCase().includes('test')
                );

                setPackages(filteredPackages);
                shopPackageCache = filteredPackages;
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
            try {
                setLoading(true);
                const { activateFreePackage } = await import('@/modules/billing/services/paymentService');
                await activateFreePackage(user.uid!, pkg.id);
                // v5.3: Using standard alerts for high-contrast accessibility (will be replaced by flat toasts later)
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

        setSelectedPkg(pkg);
        setShowUploadModal(true);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary selection:text-white pb-20">
            <Head>
                <title>เลือกแพ็กเกจ - YouOKE</title>
                <meta name="description" content="ร้องเพลงต่อเนื่องแบบไม่มีโฆษณาคั่นด้วย YouOKE Premium" />
            </Head>

            {/* v5.3 Pure Flat Navigation (Compact) */}
            <header className="sticky top-0 z-[100] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b-2 border-zinc-100 dark:border-zinc-900">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <button 
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-[13px] font-black text-zinc-950 dark:text-white transition-all active:scale-95 group"
                    >
                        <ChevronLeft className="w-5 h-5 stroke-[3] group-hover:-translate-x-1 transition-transform" />
                        <span>กลับ</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#06C755] flex items-center justify-center text-white">
                            <MessageCircle className="w-4 h-4" fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400">Shop</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pt-10">
                {/* 1. Pure Flat Trial Hero (More Compact) */}
                <div 
                    onClick={() => {
                        const trialPkg = packages.find(p => p.price === 0);
                        if (trialPkg) handleBuy(trialPkg);
                    }}
                    className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                    <div className="group relative overflow-hidden rounded-[32px] p-6 md:p-10 bg-emerald-600 border-4 border-emerald-700 cursor-pointer transition-all active:scale-[0.98]">
                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
                            <div className="flex-1 space-y-3 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                    <Zap className="w-3 h-3 fill-current" />
                                    Special Gift
                                </div>
                                <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                                    ทดลองใช้พรีเมียม <span className="text-emerald-100">ฟรี 1 วัน</span>
                                </h1>
                                <p className="text-emerald-50/80 font-bold text-xs md:text-base max-w-xl">
                                    สัมผัสประสบการณ์ร้องเพลงแบบไม่มีโฆษณาคั่น 24 ชม. <br />
                                    ปลดล็อกทุกความสามารถเพื่อความบันเทิงที่สมบูรณ์แบบ
                                </p>
                            </div>

                            <button className="w-full md:w-auto h-14 px-8 bg-white text-emerald-950 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-none">
                                <Sparkles className="w-5 h-5" />
                                ใช้ฟรีทันที
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Main Title - Smaller Scaling */}
                <div className="text-center space-y-3 mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-xl text-[10px] font-black tracking-widest uppercase border-2 border-zinc-200 dark:border-zinc-800">
                        <Crown className="w-3 h-3 text-amber-500" />
                        VIP Packages
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none px-4">
                        สมัครเป็น <span className="text-primary italic">YouOKE VIP</span>
                    </h2>
                </div>

                {/* 3. Pure Flat Package Grid (Reduced Padding & Sizes) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-80 rounded-[32px] bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 animate-pulse" />
                        ))
                    ) : (
                        packages.filter(p => p.price > 0).map((pkg) => {
                            const isAnnual = pkg.durationDays >= 300;
                            const isPopular = pkg.isPopular || isAnnual;
                            
                            return (
                                <div 
                                    key={pkg.id}
                                    className={cn(
                                        "group relative flex flex-col h-full rounded-[32px] p-8 transition-all duration-300 border-4",
                                        isPopular 
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white scale-100 z-10" 
                                            : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                                    )}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-2 border-4 border-white dark:border-zinc-950">
                                            🔥 BEST
                                        </div>
                                    )}

                                    <div className="space-y-5 flex-grow">
                                        <div className="space-y-1">
                                            <p className={cn("text-[9px] font-black uppercase tracking-widest", isPopular ? "text-primary" : "text-zinc-400")}>
                                                Member Tier
                                            </p>
                                            <h3 className="text-2xl font-black tracking-tight">{pkg.name}</h3>
                                        </div>
                                        
                                        <div className="flex flex-col border-t-2 border-dashed border-zinc-100 dark:border-zinc-800 pt-5">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-black tracking-tighter">฿{pkg.price}</span>
                                                <span className={cn("text-xs font-black uppercase tracking-widest opacity-40 ml-1")}>
                                                    /{pkg.durationDays >= 9999 ? 'LIFE' : `${pkg.durationDays}D`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-5">
                                            {KILLER_FEATURES.slice(0, 4).map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border-2",
                                                        isPopular ? "bg-white text-zinc-950 border-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                                    )}>
                                                        <Check className="w-2.5 h-2.5 stroke-[4]" />
                                                    </div>
                                                    <span className="text-[13px] font-black">{feature.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBuy(pkg)}
                                        className={cn(
                                            "mt-8 w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-base transition-all active:scale-95 shadow-none",
                                            isPopular
                                                ? "bg-primary text-white border-none"
                                                : "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 border-none"
                                        )}
                                    >
                                        {isLineConnected ? "เลือกแพ็กเกจ" : "เชื่อมต่อเพื่อสมัคร"}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 4. Feature Showcase Section (Smaller Layout) */}
                <section className="mt-24 border-t-4 border-zinc-100 dark:border-zinc-900 pt-16">
                    <div className="text-center mb-10 space-y-3 px-6">
                        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-950 dark:text-white leading-none">ทำไมต้อง YouOKE Premium?</h2>
                        <p className="text-zinc-500 font-bold text-xs max-w-xl mx-auto">ฟีเจอร์ที่ออกแบบมาเพื่อให้คุณเป็นราชาและราชินีแห่งคาราโอเกะ</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                        {KILLER_FEATURES.map((feature, i) => (
                            <div 
                                key={i}
                                className="p-6 rounded-[24px] bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 transition-all active:scale-[0.98]"
                            >
                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center mb-4",
                                    feature.color, "text-white"
                                )}>
                                    <feature.icon className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                                <h3 className="font-black text-sm mb-2 text-zinc-950 dark:text-white leading-tight">{feature.title}</h3>
                                <p className="text-[11px] font-bold text-zinc-500 leading-tight">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Compact Support Banner */}
                <div className="mt-20 p-8 rounded-[40px] bg-zinc-950 text-white text-center border-2 border-zinc-950 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-black tracking-tight">ติดปัญหาการใช้งาน?</h3>
                        <p className="max-w-xl mx-auto text-zinc-500 text-xs font-bold leading-relaxed">
                            ต้องการความช่วยเหลือในการสมัครสมาชิก <br />
                            ทักหาแอดมินทาง LINE ได้ตลอด 24 ชม. ครับ
                        </p>
                    </div>
                    <button 
                        onClick={() => window.open('https://line.me/ti/p/~@243lercy', '_blank')}
                        className="bg-[#06C755] text-white h-14 px-8 rounded-2xl font-black text-base flex items-center justify-center gap-3 mx-auto transition-all active:scale-95 shadow-none"
                    >
                        <MessageCircle className="w-5 h-5" fill="currentColor" />
                        ติดต่อ @243lercy
                    </button>
                </div>
            </main>

            {/* Modals */}
            {selectedPkg && (
                <UploadSlipModal 
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    pkg={selectedPkg}
                />
            )}
        </div>
    );
}
