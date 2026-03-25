import React, { useEffect, useState } from 'react';
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { db } from '@/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import {
    Package,
    Plus,
    Edit2,
    MoreHorizontal,
    Star,
    Check,
    X,
    Trash2,
    Save,
    Search,
    Smartphone,
    Tv,
    Mic2,
    Library,
    Zap,
    Play,
    Bookmark,
    Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from "@/features/admin/components/StatCard";
import { Activity, TrendingUp, TrendingDown, Minus, BadgeCheck } from "lucide-react";
import { useUIStore } from '@/stores/useUIStore';
import { useToast } from '@/context/ToastContext';

interface PackageData {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    planId?: string; // Link to /plans/{id}
    features: any;
    isActive: boolean;
    isPopular?: boolean;
    createdAt?: any;
    updatedAt?: any;
}

// Real System Features for YouOke (Short Version for Packages)
const PREDEFINED_FEATURES = [
    { id: 'no_ads', label: "ไร้โฆษณาคั่น", description: "100% Ad-Free", icon: Ban },
    { id: 'unlimited_queue', label: "คิวไม่จำกัด", description: "Unlimited Song Queue", icon: Zap },
    { id: 'mobile_remote', label: "รีโมทมือถือ", description: "Smartphone Remote", icon: Smartphone },
    { id: 'dual_screen', label: "ระบบ 2 หน้าจอ", description: "Dual Screen System", icon: Tv },
    { id: 'universal_cast', label: "ส่งขึ้นจอ TV", description: "Universal Casting", icon: Play },
    { id: 'voice_search', label: "ค้นหาด้วยเสียง", description: "Voice Search Control", icon: Mic2 },
    { id: 'search_filter', label: "แยกคาราโอเกะ", description: "Song / Karaoke Filter", icon: Search },
    { id: 'personal_playlists', label: "บันทึกเพลงโปรด", description: "Personal Songbook", icon: Bookmark },
    { id: 'global_library', label: "คลังเพลงทั่วโลก", description: "Global YouTube Music", icon: Library }
];

export default function PackagesPage() {
    const [packages, setPackages] = useState<PackageData[]>([]);
    const [plans, setPlans] = useState<{ id: string, displayName: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState<PackageData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [jsonError, setJsonError] = useState('');
    const showConfirm = useUIStore(state => state.showConfirm);
    const { addToast } = useToast()!;

    // Form State
    const [formData, setFormData] = useState<PackageData>({
        id: '',
        name: '',
        description: '',
        price: 0,
        durationDays: 30,
        planId: 'premium',
        features: {},
        isActive: true
    });
    const [featuresJson, setFeaturesJson] = useState('{}');

    useEffect(() => {
        // Essential: Check if Firebase is ready
        if (!db) {
            console.log("📊 PackagesPage: Waiting for Firestore instance...");
            return;
        }

        // Diagnostic: Verify DB type to prevent "invalid-argument" error
        const dbAsAny = db as any;
        const isValidFirestore = dbAsAny && (dbAsAny.type === 'firestore' || dbAsAny.app || dbAsAny._databaseId);
        
        if (!isValidFirestore) {
            console.error("❌ PackagesPage: db instance is invalid for collection() call", db);
            return;
        }

        console.log("🔥 PackagesPage: Connected to project", dbAsAny.app?.options?.projectId);

        let isMounted = true;

        // 1. Fetch Plans for dropdown
        const fetchPlans = async () => {
            try {
                const plansCol = collection(db as any, 'plans');
                const snap = await getDocs(plansCol);
                if (isMounted) {
                    const planList = snap.docs.map(doc => ({
                        id: doc.id,
                        displayName: doc.data().displayName || doc.id
                    }));
                    setPlans(planList);
                }
            } catch (err) {
                console.error("❌ PackagesPage: Error fetching plans:", err);
            }
        };

        // 2. Subscribe to Packages
        let unsubscribe = () => {};
        try {
            const pkgsCol = collection(db as any, 'packages');
            unsubscribe = onSnapshot(pkgsCol, (snapshot) => {
                if (isMounted) {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageData));
                    data.sort((a, b) => (a.isActive === b.isActive ? a.price - b.price : a.isActive ? -1 : 1));
                    setPackages(data);
                    setLoading(false);
                }
            }, (err) => {
                console.error("❌ PackagesPage: onSnapshot error:", err);
                if (isMounted) setLoading(false);
            });
        } catch (err) {
            console.error("❌ PackagesPage: Error setting up listener:", err);
            if (isMounted) setLoading(false);
        }

        fetchPlans();

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [db]);

    const toggleFeature = (feature: string) => {
        try {
            let currentFeatures: Record<string, boolean> = {};
            try { currentFeatures = JSON.parse(featuresJson); } catch (e) { currentFeatures = {}; }
            if (currentFeatures[feature]) {
                delete currentFeatures[feature];
            } else {
                currentFeatures[feature] = true;
            }
            setFeaturesJson(JSON.stringify(currentFeatures, null, 4));
        } catch (e) {
            console.error("Error toggling feature", e);
        }
    };

    const isFeatureEnabled = (feature: string) => {
        try {
            const currentFeatures: Record<string, boolean> = JSON.parse(featuresJson);
            return !!currentFeatures[feature];
        } catch {
            return false;
        }
    };

    const handleEdit = (pkg: PackageData) => {
        setEditMode(pkg);
        setIsCreating(false);
        setFormData(pkg);
        setFeaturesJson(JSON.stringify(pkg.features || {}, null, 4));
    };

    const handleCreate = () => {
        setEditMode(null);
        setIsCreating(true);
        const defaultFeatures = { "HD Audio": true, "Unlimited Songs": true };
        setFormData({
            id: '',
            name: '',
            description: '',
            price: 0,
            durationDays: 30,
            features: defaultFeatures,
            isActive: true
        });
        setFeaturesJson(JSON.stringify(defaultFeatures, null, 4));
    };

    const handleSave = async () => {
        setJsonError('');
        let parsedFeatures = {};
        try {
            parsedFeatures = JSON.parse(featuresJson);
        } catch (e: any) {
            setJsonError('รูปแบบ JSON ไม่ถูกต้อง: ' + e.message);
            return;
        }

        if (!db) return;
        setLoading(true);

        try {
            let finalId = formData.id.trim();
            if (!finalId) {
                finalId = 'pkg_' + Date.now();
            }

            const payload = {
                name: formData.name || "Untitled Package",
                description: formData.description || "",
                price: Number(formData.price) || 0,
                durationDays: Number(formData.durationDays) || 0,
                planId: formData.planId || "",
                features: parsedFeatures,
                isActive: formData.isActive,
                isPopular: formData.isPopular || false,
                updatedAt: serverTimestamp(),
                createdAt: editMode ? formData.createdAt : serverTimestamp()
            };

            await setDoc(doc(db, 'packages', finalId), payload);
            addToast("บันทึกข้อมูลสำเร็จ!", "success");
            setEditMode(null);
            setIsCreating(false);
        } catch (e: any) {
            console.error("❌ Save Error:", e);
            addToast(`ไม่สามารถบันทึกได้: ${e.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        showConfirm({
            title: "ยืนยันการลบ",
            message: `คุณต้องการลบแพ็กเกจ ${id} ใช่ไหม? การดำเนินการนี้ไม่สามารถเรียกคืนได้`,
            confirmText: "ลบแพ็กเกจ",
            type: "danger",
            onConfirm: async () => {
                try {
                    if (!db) return;
                    setLoading(true);
                    await deleteDoc(doc(db, 'packages', id));
                    addToast("ลบแพ็กเกจเรียบร้อยแล้ว", "success");
                } catch (e: any) {
                    console.error("Delete Error:", e);
                    addToast("เกิดข้อผิดพลาดในการลบ: " + e.message, "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const stats = {
        total: packages.length,
        active: packages.filter(p => p.isActive).length,
        popular: packages.filter(p => p.isPopular).length
    };

    const getFeaturesList = (features: any): string[] => {
        if (!features || typeof features !== 'object') return [];
        const orderedFeatures: string[] = [];
        const predefinedLabels = PREDEFINED_FEATURES.map(pf => pf.label);
        
        PREDEFINED_FEATURES.forEach(pf => {
            if (features[pf.label] === true) orderedFeatures.push(pf.label);
        });
        
        Object.entries(features).forEach(([key, value]) => {
            if (value === true && !predefinedLabels.includes(key)) {
                const label = key.includes(' ') ? key : key.replace(/([A-Z])/g, ' $1').trim();
                orderedFeatures.push(label);
            }
        });
        
        return orderedFeatures;
    };

    if (loading && packages.length === 0) {
        return (
            <AdminLayout headerTitle="Package Manager">
                <div className="flex h-64 items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-gray-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการแพ็กเกจ</h1>
                            <p className="text-sm text-gray-500 mt-1 font-medium">จัดการแผนราคาและสิทธิ์การใช้งานของสมาชิก YouOke</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleCreate} 
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-2xl font-bold text-sm text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Plus className="w-4 h-4" /> สร้างแพ็กเกจ
                    </button>
                </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    title="แพ็กเกจทั้งหมด"
                    value={stats.total}
                    icon={Package}
                    iconColor="primary"
                    className="border-primary/20 bg-gradient-to-br from-white to-primary/5"
                />
                <StatCard 
                    title="เปิดขายอยู่"
                    value={stats.active}
                    icon={Check}
                    iconColor="success"
                />
                <StatCard 
                    title="ยอดนิยม"
                    value={stats.popular}
                    icon={Star}
                    iconColor="warning"
                />
                <StatCard 
                    title="สถานะระบบ"
                    value="ปกติ"
                    icon={BadgeCheck}
                    iconColor="info"
                />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {packages.map((pkg) => {
                    const featureList = getFeaturesList(pkg.features);
                    return (
                        <div key={pkg.id} className={cn(
                            "glass-card p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col",
                            pkg.isPopular && "border-primary ring-1 ring-primary/20",
                            !pkg.isActive && "opacity-60 grayscale-[0.5]"
                        )}>
                            {pkg.isPopular && (
                                <div className="absolute -right-8 top-4 rotate-45 bg-primary px-8 py-1 text-xs font-bold text-white shadow-lg z-10">
                                    Popular
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                                        pkg.isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-foreground truncate">{pkg.name}</h3>
                                        <p className="text-[10px] text-muted-foreground truncate uppercase font-bold">ID: {pkg.id}</p>
                                    </div>
                                </div>
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost btn-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </label>
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-card rounded-2xl w-48 z-20 border border-border/50">
                                        <li><a onClick={() => handleEdit(pkg)} className="gap-2 text-sm"><Edit2 className="h-4 w-4" /> แก้ไข</a></li>
                                        <li><a onClick={() => handleDelete(pkg.id)} className="gap-2 text-sm text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /> ลบ</a></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black tracking-tight">฿{pkg.price.toLocaleString()}</span>
                                    <span className="text-muted-foreground text-xs font-bold">
                                        / {pkg.durationDays === 0 ? "LIFE" : `${pkg.durationDays}D`}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 h-8 font-medium">{pkg.description}</p>
                            </div>

                            <div className="mb-6 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">Top Features</p>
                                <ul className="space-y-3">
                                    {featureList.slice(0, 4).map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-xs font-bold">
                                            <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-foreground/80 leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                    {featureList.length > 4 && (
                                        <li className="text-[10px] text-muted-foreground pl-6 font-bold">
                                            +{featureList.length - 4} MORE BENEFITS
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border/10 mt-auto">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                    pkg.isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                                )}>
                                    {pkg.isActive ? "Live" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {(editMode || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setEditMode(null); setIsCreating(false); }} />
                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-[2rem] bg-card shadow-[0_32px_120px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-border/50 flex justify-between items-center bg-muted/20 shrink-0">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{editMode ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Package Configuration</p>
                            </div>
                            <button onClick={() => { setEditMode(null); setIsCreating(false); }} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-all"><X /></button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide flex-1">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">รหัส (ID)</label>
                                    <input type="text" className="w-full bg-muted/40 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all disabled:opacity-50" value={formData.id} disabled={!!editMode} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="basic_monthly" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ชื่อแพ็กเกจ</label>
                                    <input type="text" className="w-full bg-muted/40 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Pro Monthly" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ราคา (฿)</label>
                                    <input type="number" className="w-full bg-muted/40 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">จำนวนวัน</label>
                                    <input type="number" className="w-full bg-muted/40 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all" value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">แผนสมาชิก</label>
                                    <select className="w-full bg-muted/40 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all appearance-none" value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })}>
                                        <option value="">เลือกแผน</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.displayName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">รายละเอียด</label>
                                <textarea className="w-full bg-muted/40 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary transition-all h-24 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="รายละเอียดแพ็กเกจ..."></textarea>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">ฟีเจอร์ด่วน</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PREDEFINED_FEATURES.map((feature) => {
                                        const isEnabled = isFeatureEnabled(feature.label);
                                        const Icon = feature.icon;
                                        return (
                                            <div key={feature.id} onClick={() => toggleFeature(feature.label)} className={cn("cursor-pointer rounded-2xl border-2 p-3 flex items-center gap-3 transition-all", isEnabled ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/10 border-transparent hover:bg-muted/30")}>
                                                <Icon className="w-4 h-4 shrink-0" />
                                                <span className="text-xs font-black truncate">{feature.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Custom Config (JSON)</label>
                                <textarea className={cn("w-full bg-muted/40 border-none rounded-2xl px-4 py-3 font-mono text-[10px] h-20 resize-none", jsonError && "ring-2 ring-red-500")} value={featuresJson} onChange={e => setFeaturesJson(e.target.value)}></textarea>
                                {jsonError && <p className="text-[10px] text-red-500 font-bold uppercase">{jsonError}</p>}
                            </div>

                            <div className="flex gap-8 py-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                    <span className="text-[10px] font-black uppercase group-hover:text-primary transition-colors">เปิดขายสาธารณะ</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" className="toggle toggle-warning toggle-sm" checked={formData.isPopular || false} onChange={e => setFormData({ ...formData, isPopular: e.target.checked })} />
                                    <span className="text-[10px] font-black uppercase group-hover:text-amber-500 transition-colors">แนะนำ/ยอดนิยม</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border/50 bg-muted/20 flex justify-end gap-3 shrink-0">
                            <button className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all" onClick={() => { setEditMode(null); setIsCreating(false); }}>ยกเลิก</button>
                            <button disabled={loading} onClick={handleSave} className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50">
                                {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AdminLayout>
    );
}
