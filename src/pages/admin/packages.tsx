import React, { useEffect, useState } from 'react';
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { db } from '@/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
    AlertCircle,
    Clock,
    Search,
    Smartphone,
    Tv,
    Mic2,
    Music,
    Ban,
    Library,
    Zap,
    Heart,
    Sparkles,
    Volume2,
    Play,
    Bookmark,
    ListMusic
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface PackageData {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    features: any;
    isActive: boolean;
    isPopular?: boolean;
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
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState<PackageData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [jsonError, setJsonError] = useState('');

    // Form State
    const [formData, setFormData] = useState<PackageData>({
        id: '',
        name: '',
        description: '',
        price: 0,
        durationDays: 30,
        features: {},
        isActive: true
    });
    const [featuresJson, setFeaturesJson] = useState('{}');

    useEffect(() => {
        if (!db) {
            console.log("📊 PackagesPage: db is null, waiting...");
            return;
        }
        console.log("🔥 Connected to Firebase Project:", db.app.options.projectId);
        const unsubscribe = onSnapshot(collection(db, 'packages'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageData));
            data.sort((a, b) => (a.isActive === b.isActive ? a.price - b.price : a.isActive ? -1 : 1));
            setPackages(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const toggleFeature = (feature: string) => {
        try {
            let currentFeatures: Record<string, boolean> = {};
            try { currentFeatures = JSON.parse(featuresJson); } catch (e) { currentFeatures = {}; }

            // Toggle
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
        setFeaturesJson(JSON.stringify(pkg.features, null, 4));
    };

    const handleCreate = () => {
        setEditMode(null);
        setIsCreating(true);
        setFormData({
            id: '',
            name: '',
            description: '',
            price: 0,
            durationDays: 30,
            features: { "HD Audio": true, "Unlimited Songs": true },
            isActive: true
        });
        setFeaturesJson(JSON.stringify({ "HD Audio": true, "Unlimited Songs": true }, null, 4));
    };

    const handleSave = async () => {
        // DEBUG: Step 1
        console.log("handleSave started");

        setJsonError('');
        let parsedFeatures = {};

        // 1. Validate JSON
        try {
            parsedFeatures = JSON.parse(featuresJson);
        } catch (e: any) {
            setJsonError('รูปแบบ JSON ไม่ถูกต้อง: ' + e.message);
            alert("JSON Syntax Error: " + e.message);
            return;
        }

        setLoading(true);

        try {
            // DEBUG: Step 2 - Import
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../../firebase');
            if (!db) throw new Error("Database not initialized");

            // Generate ID if not provided or clean it
            let finalId = formData.id.trim();
            if (!finalId) {
                finalId = 'pkg_' + Date.now();
            }

            const price = Number(formData.price) || 0;
            const durationDays = Number(formData.durationDays) || 0;

            // DEBUG: Step 3 - Prepare Payload
            const dataToSave = {
                name: formData.name || "Untitled Package",
                description: formData.description || "",
                price: price,
                durationDays: durationDays,
                features: parsedFeatures || {},
                isActive: formData.isActive || false,
                isPopular: formData.isPopular || false,
                updatedAt: serverTimestamp() // Use server timestamp to be safe
            };

            const payload = {
                ...dataToSave,
                ...(editMode ? {} : { createdAt: serverTimestamp() })
            };

            console.log("Saving payload to", finalId, payload);

            // DEBUG: Step 4 - Execute Write
            await setDoc(doc(db, 'packages', finalId), payload, { merge: true });

            alert("✅ บันทึกข้อมูลสำเร็จ! (Saved to " + finalId + ")");
            setEditMode(null);
            setIsCreating(false);

            if (!editMode) {
                setFormData({ ...formData, id: '', name: '', description: '', price: 0, durationDays: 30 });
            }

        } catch (e: any) {
            console.error("Save Error:", e);
            alert(`❌ Application Error:\n${e.message}\n(Check Console for details)`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(`คุณต้องการลบแพ็กเกจ ${id} ใช่ไหม?`)) {
            const { PackageService } = await import('../../services/packageService');
            await PackageService.deletePackage(id);
        }
    };

    // Calculate Stats
    const stats = {
        total: packages.length,
        active: packages.filter(p => p.isActive).length,
        popular: packages.filter(p => p.isPopular).length
    };

    // Helper to extract feature list from JSON object for display
    const getFeaturesList = (features: any): string[] => {
        if (!features || typeof features !== 'object') return [];
        return Object.entries(features)
            .filter(([_, value]) => value === true) // Only show boolean true features
            .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim()); // UncamelCase
    };

    return (
        <AdminLayout headerTitle="Package Manager">

            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">จัดการแพ็กเกจ</h1>
                    <p className="mt-1 text-muted-foreground">จัดการแผนราคาแบบขายสิทธิ์สมาชิกแบบต่างๆ</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCreate} className="btn bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-lg border-none shadow-sm">
                        <Plus className="w-4 h-4" /> สร้างแพ็กเกจ
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                        <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">แพ็กเกจทั้งหมด</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                        <Check className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                        <p className="text-sm text-muted-foreground">เปิดขาย</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                        <Star className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.popular}</p>
                        <p className="text-sm text-muted-foreground">ยอดนิยม</p>
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {packages.map((pkg) => {
                    const featureList = getFeaturesList(pkg.features);
                    return (
                        <div key={pkg.id} className={cn(
                            "glass-card p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col",
                            pkg.isPopular && "border-primary ring-1 ring-primary/20",
                            !pkg.isActive && "opacity-60 grayscale-[0.5]"
                        )}>
                            {/* Popular badge */}
                            {pkg.isPopular && (
                                <div className="absolute -right-8 top-4 rotate-45 bg-primary px-8 py-1 text-xs font-semibold text-primary-foreground shadow-lg z-10">
                                    Popular
                                </div>
                            )}

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                                        pkg.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">{pkg.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">ID: {pkg.id}</p>
                                    </div>
                                </div>
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost btn-xs h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </label>
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-card rounded-xl w-48 z-20 border border-border/50">
                                        <li>
                                            <a onClick={() => handleEdit(pkg)} className="gap-2 text-sm">
                                                <Edit2 className="h-4 w-4" /> แก้ไข
                                            </a>
                                        </li>
                                        <li>
                                            <a onClick={() => handleDelete(pkg.id)} className="gap-2 text-sm text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" /> ลบ
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-foreground">฿{pkg.price.toLocaleString()}</span>
                                    <span className="text-muted-foreground text-sm">
                                        / {pkg.durationDays === 0 ? "ตลอดชีพ" : `${pkg.durationDays}วัน`}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 h-10">{pkg.description}</p>
                            </div>

                            {/* Features List */}
                            <div className="mb-6 flex-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">ฟีเจอร์</p>
                                <ul className="space-y-2">
                                    {featureList.slice(0, 4).map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                                            <span className="text-foreground leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                    {featureList.length === 0 && (
                                        <li className="text-xs text-muted-foreground italic">No specific features listed</li>
                                    )}
                                    {featureList.length > 4 && (
                                        <li className="text-xs text-muted-foreground pl-6">
                                            +{featureList.length - 4} more
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Status Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-auto">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted",
                                    pkg.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                                )}>
                                    {pkg.isActive ? "เปิดขาย" : "ปิด"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controlled Custom Modal */}
            {(editMode || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => { setEditMode(null); setIsCreating(false); }}
                    />

                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-card shadow-2xl transition-all max-h-[85vh] flex flex-col">
                        <div className="bg-muted/30 p-6 border-b border-border flex justify-between items-center shrink-0">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-bold text-lg text-foreground">
                                    {editMode ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}
                                </h3>
                                <p className="text-xs text-muted-foreground">ตั้งค่ารายละเอียดราคาและสิทธิประโยชน์</p>
                            </div>
                            <button
                                onClick={() => { setEditMode(null); setIsCreating(false); }}
                                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto scrollbar-hide">
                            <style jsx>{`
                                .scrollbar-hide::-webkit-scrollbar { display: none; }
                             `}</style>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label pt-0"><span className="label-text font-medium text-foreground">รหัส (ID)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. basic_monthly"
                                        className="input input-sm input-bordered bg-muted/30 border-border/50 focus:border-primary"
                                        value={formData.id}
                                        disabled={!!editMode}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label pt-0"><span className="label-text font-medium text-foreground">ชื่อแพ็กเกจ</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Basic Plan"
                                        className="input input-sm input-bordered bg-muted/30 border-border/50 focus:border-primary"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-medium text-foreground">ราคา (บาท)</span></label>
                                    <input
                                        type="number"
                                        className="input input-sm input-bordered bg-muted/30 border-border/50 focus:border-primary"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-medium text-foreground">จำนวนวัน</span></label>
                                    <input
                                        type="number"
                                        className="input input-sm input-bordered bg-muted/30 border-border/50 focus:border-primary"
                                        value={formData.durationDays}
                                        onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium text-foreground">รายละเอียด</span></label>
                                <textarea
                                    className="textarea textarea-bordered h-20 bg-muted/30 border-border/50 focus:border-primary resize-none text-sm"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium text-foreground">ฟีเจอร์ด่วน (Quick Select)</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PREDEFINED_FEATURES.map((feature) => {
                                        const isEnabled = isFeatureEnabled(feature.label);
                                        const Icon = feature.icon;
                                        return (
                                            <div
                                                key={feature.id}
                                                onClick={() => toggleFeature(feature.label)}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition-all select-none active:scale-95 group",
                                                    isEnabled
                                                        ? "bg-primary/10 border-primary shadow-sm"
                                                        : "bg-muted/20 border-border hover:bg-muted/40"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                                    isEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                                                )}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-xs font-bold leading-tight truncate", isEnabled ? "text-primary" : "text-foreground")}>
                                                        {feature.label}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                                {isEnabled && (
                                                    <div className="bg-primary rounded-full p-0.5">
                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label flex justify-between">
                                    <span className="label-text font-medium text-foreground">ฟีเจอร์ (JSON Config)</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">ขั้นสูง</span>
                                </label>
                                <textarea
                                    className={cn(
                                        "textarea textarea-bordered h-24 font-mono text-xs bg-muted/30 border-border/50 focus:border-primary",
                                        jsonError ? "border-destructive focus:border-destructive" : ""
                                    )}
                                    value={featuresJson}
                                    onChange={e => setFeaturesJson(e.target.value)}
                                    placeholder='{ "feature": true }'
                                ></textarea>
                                {jsonError && <span className="text-xs text-destructive mt-1">{jsonError}</span>}
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-sm"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">เปิดใช้งาน</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-warning toggle-sm"
                                        checked={formData.isPopular || false}
                                        onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">ป้ายยอดนิยม</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 m-0 border-t border-border/50 flex justify-end gap-3 shrink-0">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setEditMode(null); setIsCreating(false); }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleSave}
                                className="btn btn-primary btn-sm text-primary-foreground min-w-[100px]"
                            >
                                {loading ? <span className="loading loading-spinner loading-xs"></span> : (
                                    <>
                                        <Save className="w-4 h-4 mr-1" /> บันทึก
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}

