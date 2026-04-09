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

            {/* v5.3 Pure Flat Navigation */}
            <header className="sticky top-0 z-[100] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b-2 border-zinc-100 dark:border-zinc-900">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button 
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-sm font-black text-zinc-950 dark:text-white transition-all active:scale-95 group"
                    >
                        <ChevronLeft className="w-5 h-5 stroke-[3] group-hover:-translate-x-1 transition-transform" />
                        <span>กลับสู่หน้าคาราโอเกะ</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#06C755] flex items-center justify-center text-white scale-90">
                            <MessageCircle className="w-5 h-5" fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400">LINE Connected</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pt-12">
                {/* 1. Pure Flat Trial Hero */}
                <div 
                    onClick={() => {
                        const trialPkg = packages.find(p => p.price === 0);
                        if (trialPkg) handleBuy(trialPkg);
                    }}
                    className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                    <div className="group relative overflow-hidden rounded-[40px] p-8 md:p-12 bg-emerald-600 border-4 border-emerald-700 cursor-pointer transition-all active:scale-[0.98]">
                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-10">
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    <Zap className="w-3 h-3 fill-current" />
                                    Special Trial Gift
                                </div>
                                <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
                                    รับสิทธิ์พรีเมียม <br />
                                    <span className="text-emerald-100">ฟรี 1 วันเต็มๆ</span>
                                </h1>
                                <p className="text-emerald-50/80 font-bold text-sm md:text-lg max-w-xl">
                                    สัมผัสประสบการณ์ร้องเพลงแบบไม่มีโฆษณาคั่น 24 ชม. <br className="hidden md:block" />
                                    ปลดล็อกทุกความสามารถเพื่อความบันเทิงที่สมบูรณ์แบบ
                                </p>
                            </div>

                            <button className="w-full md:w-auto h-16 px-10 bg-white text-emerald-950 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all">
                                <Sparkles className="w-6 h-6" />
                                ใช้ฟรีทันที
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Main Title - High Contrast */}
                <div className="text-center space-y-4 mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-2xl text-[10px] font-black tracking-widest uppercase border-2 border-zinc-200 dark:border-zinc-800">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Premium Selection
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black text-zinc-950 dark:text-white tracking-tighter leading-[0.85]">
                        สมัครแพ็กเกจ <br />
                        <span className="text-primary">ร้องเพลงให้สุดชีวิต</span>
                    </h2>
                    <p className="text-zinc-500 font-bold text-sm md:text-base">เลือกแพ็กเกจที่โดนใจคุณที่สุด ยิ่งสมัครนานยิ่งคุ้มค่า</p>
                </div>

                {/* 3. Pure Flat Package Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-[460px] rounded-[48px] bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 animate-pulse" />
                        ))
                    ) : (
                        packages.filter(p => p.price > 0).map((pkg) => {
                            const isAnnual = pkg.durationDays >= 300;
                            const isPopular = pkg.isPopular || isAnnual;
                            
                            return (
                                <div 
                                    key={pkg.id}
                                    className={cn(
                                        "group relative flex flex-col h-full rounded-[48px] p-10 transition-all duration-300 border-4",
                                        isPopular 
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white scale-105 z-10" 
                                            : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                                    )}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-white rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2 border-4 border-white dark:border-zinc-950">
                                            <Zap className="w-3 h-3 fill-current" />
                                            🔥 BEST VALUE
                                        </div>
                                    )}

                                    <div className="space-y-6 flex-grow">
                                        <div className="space-y-1">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isPopular ? "text-primary" : "text-zinc-400")}>
                                                VIP Package
                                            </p>
                                            <h3 className="text-3xl font-black tracking-tight">{pkg.name}</h3>
                                        </div>
                                        
                                        <div className="flex flex-col border-t-2 border-dashed border-zinc-100 dark:border-zinc-800 pt-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-6xl font-black tracking-tighter">฿{pkg.price}</span>
                                                <span className={cn("text-sm font-black uppercase tracking-widest opacity-40 ml-1")}>
                                                    /{pkg.durationDays >= 9999 ? 'LIFETIME' : `${pkg.durationDays} DAYS`}
                                                </span>
                                            </div>
                                            <p className={cn("text-[11px] font-black uppercase tracking-widest mt-2", isPopular ? "text-zinc-400" : "text-zinc-500")}>
                                                No recurring hidden fees
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6">
                                            {KILLER_FEATURES.slice(0, 4).map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border-2",
                                                        isPopular ? "bg-white text-zinc-950 border-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                                    )}>
                                                        <Check className="w-3 h-3 stroke-[4]" />
                                                    </div>
                                                    <span className="text-sm font-black">{feature.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBuy(pkg)}
                                        className={cn(
                                            "mt-10 w-full h-16 rounded-3xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-95",
                                            isPopular
                                                ? "bg-primary text-white border-2 border-primary"
                                                : "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 border-2 border-transparent"
                                        )}
                                    >
                                        {isLineConnected ? <MessageCircle className="w-5 h-5" fill="currentColor" /> : <ChevronRight className="w-5 h-5 stroke-[3]" />}
                                        {isLineConnected ? "สมัครแพ็กเกจนี้" : "เชื่อมต่อเพื่อสมัคร"}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 4. Feature Showcase Section */}
                <section className="mt-40 border-t-4 border-zinc-100 dark:border-zinc-900 pt-20">
                    <div className="text-center mb-16 space-y-4 px-6">
                        <div className="w-16 h-1 bg-primary mx-auto rounded-full mb-6"></div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-950 dark:text-white leading-none">ทำไมต้อง YouOKE Premium?</h2>
                        <p className="text-zinc-500 font-bold max-w-2xl mx-auto">ฟีเจอร์ระดับอัจฉริยะที่ออกแบบมาเพื่อให้คุณเป็นราชาและราชินีแห่งคาราโอเกะที่บ้านคุณเอง</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                        {KILLER_FEATURES.map((feature, i) => (
                            <div 
                                key={i}
                                className="p-8 rounded-[40px] bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 hover:border-primary transition-all active:scale-[0.98]"
                            >
                                <div className={cn(
                                    "w-14 h-14 rounded-[20px] flex items-center justify-center mb-6 shadow-none",
                                    feature.color, "text-white"
                                )}>
                                    <feature.icon className="w-7 h-7" strokeWidth={2.5} />
                                </div>
                                <h3 className="font-black text-xl mb-3 text-zinc-950 dark:text-white leading-tight">{feature.title}</h3>
                                <p className="text-sm font-bold text-zinc-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Final Footer Promotion Content */}
                <div className="mt-32 p-10 md:p-16 rounded-[60px] bg-zinc-950 text-white text-center border-4 border-zinc-950 space-y-8">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-[#06C755] rounded-[32px] flex items-center justify-center border-4 border-[#06C755]">
                           <MessageCircle className="w-10 h-10" fill="currentColor" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-[0.9]">
                            ดูแลคุณ <span className="text-primary italic font-serif">ทุกขั้นตอน</span>
                        </h3>
                        <p className="max-w-xl mx-auto text-zinc-400 font-bold">
                            หากคุณมีข้อสงสัยหรือต้องการความช่วยเหลือในการสมัครสมาชิก <br />
                            ทักหาแอดมินทาง LINE ได้ตลอด 24 ชม. ครับ
                        </p>
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={() => window.open('https://line.me/ti/p/~@243lercy', '_blank')}
                            className="bg-[#06C755] text-white h-16 px-10 rounded-3xl font-black text-lg flex items-center justify-center gap-3 mx-auto transition-all active:scale-95"
                        >
                            <MessageCircle className="w-6 h-6" fill="currentColor" />
                            ติดต่อ @243lercy ทาง LINE
                        </button>
                    </div>
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
