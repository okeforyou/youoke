import { useState, useEffect, Fragment } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/firebase";
import { Star, Loader2, QrCode, Zap, Sparkles, ChevronRight, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { UploadSlipModal } from "./UploadSlipModal";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";

interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description?: string;
    features?: string[];
    isPopular?: boolean;
}

let packageCache: (Package & { isActive: boolean })[] | null = null;

export const PackageStore = () => {
    const [packages, setPackages] = useState<(Package & { isActive: boolean })[]>(packageCache || []);
    const [loading, setLoading] = useState(!packageCache);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedPkg, setSelectedPkg] = useState<Package | undefined>(undefined);
    const [showLineGuard, setShowLineGuard] = useState(false);

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
                const pkgList = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        isActive: data.isActive !== false 
                    };
                }) as (Package & { isActive: boolean })[];

                const activePackages = pkgList.filter(pkg => 
                    pkg.isActive !== false && 
                    !pkg.id.toLowerCase().includes('test')
                );

                setPackages(activePackages);
                packageCache = activePackages; 
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

        if (!user.lineUserId) {
            setShowLineGuard(true);
            return;
        }

        if (pkg.price === 0) {
            try {
                setLoading(true);
                const { activateFreePackage } = await import('@/modules/billing/services/paymentService');
                await activateFreePackage(user.uid!, pkg.id);
                alert(`ยินดีด้วย! แพ็กเกจ ${pkg.name} ของคุณถูกเปิดใช้งานแล้ว`);
                window.location.reload(); 
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

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse px-4">
                <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-3xl w-full"></div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl w-full"></div>
                ))}
            </div>
        );
    }

    if (packages.length === 0) {
        return (
            <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px]">
                <p className="text-sm font-black text-zinc-400">ยังไม่มีแพ็กเกจที่เปิดขายในขณะนี้</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 px-1 pb-10">
            {/* v6 Pure Flat Trial Hero */}
            <div 
                onClick={() => {
                    const trialPkg = packages.find(p => p.price === 0);
                    if (trialPkg) handleBuy(trialPkg);
                }}
                className="relative overflow-hidden rounded-[32px] p-5 cursor-pointer transition-all active:scale-[0.98] bg-emerald-500 border-2 border-emerald-600 shadow-none"
            >
                <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-none">
                            <Zap className="w-6 h-6 fill-current" strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-white leading-tight">ทดลองใช้พรีเมียมฟรี</h4>
                            <p className="text-[11px] font-black text-emerald-100 uppercase tracking-widest mt-0.5">รับสิทธิ์ใช้งานฟรี 1 วันเต็ม</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center text-white">
                        <ChevronRight className="w-6 h-6" strokeWidth={3} />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="px-2 text-[11px] font-black text-zinc-400 uppercase tracking-widest">เลือกแพ็กเกจ VIP</p>
                {packages
                    .filter(pkg => !pkg.id.toLowerCase().includes('test') && pkg.price > 0)
                    .map((pkg) => {
                        const isAnnual = pkg.durationDays >= 300 && pkg.durationDays < 9999;
                        const isPermanent = pkg.durationDays >= 9999;
                        const isPopular = pkg.isPopular || isAnnual;

                        let colorStyle = {
                            text: "text-zinc-900 dark:text-white",
                            accent: "bg-zinc-800 dark:bg-zinc-200",
                            bg: "bg-zinc-50 dark:bg-zinc-900",
                            border: "border-zinc-200 dark:border-zinc-800",
                            button: "bg-zinc-950 dark:bg-white text-white dark:text-zinc-900"
                        };
                        
                        if (isAnnual) colorStyle = {
                            text: "text-purple-600 dark:text-purple-400",
                            accent: "bg-purple-600",
                            bg: "bg-purple-500/5",
                            border: "border-purple-600/20",
                            button: "bg-purple-600 text-white"
                        };
                        
                        if (isPermanent) colorStyle = {
                            text: "text-amber-600",
                            accent: "bg-amber-500",
                            bg: "bg-amber-500/5",
                            border: "border-amber-500/20",
                            button: "bg-amber-500 text-white"
                        };

                        if (pkg.id.includes('month')) colorStyle = {
                            text: "text-blue-600 dark:text-blue-400",
                            accent: "bg-blue-600",
                            bg: "bg-blue-600/5",
                            border: "border-blue-600/20",
                            button: "bg-blue-600 text-white"
                        };
                        
                        return (
                            <div
                                key={pkg.id}
                                onClick={() => handleBuy(pkg)}
                                className={cn(
                                    "relative overflow-hidden rounded-[32px] border-2 transition-all duration-300 cursor-pointer flex flex-col p-5",
                                    colorStyle.bg, colorStyle.border,
                                    "active:scale-[0.98]",
                                    isPopular && "ring-4 ring-primary/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={cn("font-black text-xl tracking-tight leading-none", colorStyle.text)}>
                                                {pkg.name}
                                            </h4>
                                            {isPopular && (
                                                <div className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">แนะนำ</div>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <Star className={cn("w-3 h-3 fill-current", isPermanent ? "text-amber-500" : "text-zinc-300")} />
                                            {pkg.durationDays >= 9999 ? 'สมาชิกถาวร ไม่ต้องซื้อซ้ำ' : `ใช้งานได้ ${pkg.durationDays} วัน`}
                                        </p>
                                    </div>

                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", colorStyle.button)}>
                                        <ChevronRight className="w-6 h-6" strokeWidth={3} />
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 pt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ราคาแพ็กเกจ</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-zinc-950 dark:text-white tracking-tighter tabular-nums">
                                                ฿{pkg.price.toLocaleString()}
                                            </span>
                                            <span className="text-[12px] font-black text-zinc-400">/ ครั้งเดียว</span>
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-black text-zinc-400 py-1 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 uppercase tracking-widest">
                                        Payment Secured
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            <div className="p-5 bg-zinc-950 dark:bg-white rounded-[32px] text-center border-2 border-zinc-950 dark:border-white">
                <p className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 leading-relaxed">
                    * แจ้งโอนเงินผ่านแชท <span className="text-white dark:text-zinc-950">LINE @243lercy</span> ได้ทันทีครับ <br />
                    ระบบจะเปิดใช้งานพรีเมียมให้คุณภายใน 1-3 นาที
                </p>
            </div>

            <button
                onClick={() => router.push('/packages')}
                className="w-full mt-2 py-5 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-xs font-black text-zinc-950 dark:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
            >
                <QrCode className="w-5 h-5" /> 
                <span>ดูรายละเอียดและเลือกแพ็กเกจทั้งหมด</span>
            </button>

            {selectedPkg && (
                <UploadSlipModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    pkg={selectedPkg}
                />
            )}

            <Transition show={showLineGuard} as={Fragment}>
                <Dialog as="div" className="relative z-[220]" onClose={() => setShowLineGuard(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-[40px] bg-white dark:bg-zinc-900 p-8 transition-all border-4 border-zinc-100 dark:border-zinc-800">
                                    <div className="flex justify-end -mt-2 -mr-2">
                                        <button onClick={() => setShowLineGuard(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
                                            <X size={24} strokeWidth={3} />
                                        </button>
                                    </div>
                                    
                                    <div className="text-center">
                                        <div className="mx-auto w-20 h-20 bg-[#06C755] rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M24 10.304c0-4.66-4.66-8.43-10.404-8.43-5.744 0-10.4 3.77-10.4 8.43 0 4.155 3.655 7.63 8.708 8.284.34.074.801.225 1.026.516.23.289.15.743.074 1.042l-.367 2.215s-.204 1.258.944.685c1.149-.574 6.204-3.655 8.46-6.255C22.618 15.352 24 13.013 24 10.304zm-14.757 2.375a.333.333 0 0 1-.333.333H6.84a.332.332 0 0 1-.334-.333V8.165a.333.333 0 0 1 .334-.334h.61c.184 0 .333.15.333.334v3.837h1.127c.184 0 .333.15.333.333v.644zm3.058 0a.334.334 0 0 1-.334.333h-.615a.333.333 0 0 1-.333-.333V8.165c0-.184.15-.334.333-.334h.615c.184 0 .334.15.334.334v4.514zm3.903 0a.332.332 0 0 1-.333.333h-.515a.34.34 0 0 1-.267-.13l-1.422-1.95v1.747a.333.333 0 0 1-.333.333h-.611a.333.333 0 0 1-.333-.333V8.165a.333.333 0 0 1 .333-.334h.511c.101 0 .196.046.257.126l1.432 1.956V8.165a.333.333 0 0 1 .333-.334h.612c.184 0 .333.15.333.334v4.514zm3.015-2.071c.184 0 .333.15.333.333v.644a.333.333 0 0 1-.333.333h-1.616a.333.333 0 0 1-.333-.333V8.165a.333.333 0 0 1 .333-.334h1.616c.184 0 .333.15.333.334v.644a.333.333 0 0 1-.333.334H17.47v.754h1.127c.184 0 .333.15.333.333v.644a.333.333 0 0 1-.333.334H17.47v.775h1.119z"/></svg>
                                        </div>
                                        
                                        <Dialog.Title as="h3" className="text-3xl font-black text-zinc-950 dark:text-white mb-3 leading-tight tracking-tight">
                                            เชื่อมต่อ LINE ก่อน!
                                        </Dialog.Title>
                                        
                                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed px-4">
                                            รบกวนเชื่อมต่อบัญชีกับเราก่อนนะครับ <br/>
                                            เพื่อรับแจ้งเตือนสถานะการชำระเงินของคุณ
                                        </p>

                                        <button
                                            onClick={() => {
                                                setShowLineGuard(false);
                                                router.push('/profile?connect=line');
                                            }}
                                            className="w-full py-5 bg-[#06C755] text-white rounded-[32px] font-black text-base transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-green-500/20"
                                        >
                                            <MessageCircle size={24} />
                                            เชื่อมต่อทันที
                                        </button>
                                        
                                        <button 
                                            onClick={() => setShowLineGuard(false)}
                                            className="w-full mt-4 py-3 text-zinc-400 dark:text-zinc-500 font-black text-sm hover:text-zinc-600 transition-colors"
                                        >
                                            เอาไว้ก่อน
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

// Simple icon import for the tutorial button
import { BookOpenIcon } from "@heroicons/react/24/outline";
