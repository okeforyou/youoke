import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../layouts/AdminLayout';
import { db } from '../../../../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
    ArchiveBoxIcon,
    PlusIcon,
    PencilIcon,
    EllipsisHorizontalIcon,
    StarIcon,
    CheckIcon,
    XMarkIcon,
    TrashIcon,
    FolderArrowDownIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../../utils/cn';

interface PackageData {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    features: any;
    isActive: boolean;
    isPopular?: boolean;
    createdAt?: any;
    updatedAt?: any;
}

// Analyzed Features for YouOke Karaoke Platform
const PREDEFINED_FEATURES = [
    "🎧 เสียงชัดระดับ HD (High Quality Audio)",
    "🚫 ไม่มีโฆษณาคั่น (Ad-Free Experience)",
    "🎤 ร้องเพลงได้ทุกเพลง (Unlimited Songs)",
    "📑 สร้างเพลย์ลิสต์ส่วนตัว (Personal Playlists)",
    "📱 ควบคุมผ่านมือถือ (Mobile Remote)",
    "🎼 ปรับคีย์เพลงได้ (Key Changer)",
    "🎵 ระบบตัดเสียงร้อง (Vocal Cut)",
    "⚡ คิวเพลงไม่จำกัด (Unlimited Queue)",
    "🌟 เข้าถึงเพลงใหม่ก่อนใคร (Early Access)",
    "💎 สนับสนุนผู้พัฒนา (Support Creator)"
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
        if (!db) return;
        const unsubscribe = onSnapshot(collection(db, 'packages'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageData));
            data.sort((a, b) => (a.isActive === b.isActive ? a.price - b.price : a.isActive ? -1 : 1));
            setPackages(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
        setJsonError('');
        let parsedFeatures = {};

        try {
            parsedFeatures = JSON.parse(featuresJson);
        } catch (e: any) {
            setJsonError('Invalid JSON: ' + e.message);
            alert("JSON Syntax Error: " + e.message);
            return;
        }

        setLoading(true);

        try {
            if (!db) throw new Error("Database not initialized");

            let finalId = formData.id.trim();
            if (!finalId) {
                finalId = 'pkg_' + Date.now();
            }

            const price = Number(formData.price) || 0;
            const durationDays = Number(formData.durationDays) || 0;

            const dataToSave = {
                name: formData.name || "Untitled Package",
                description: formData.description || "",
                price: price,
                durationDays: durationDays,
                features: parsedFeatures || {},
                isActive: formData.isActive || false,
                isPopular: formData.isPopular || false,
                updatedAt: serverTimestamp()
            };

            const payload = {
                ...dataToSave,
                ...(editMode ? {} : { createdAt: serverTimestamp() })
            };

            await setDoc(doc(db, 'packages', finalId), payload, { merge: true });

            alert("✅ Saved successfully!");
            setEditMode(null);
            setIsCreating(false);

            if (!editMode) {
                setFormData({ ...formData, id: '', name: '', description: '', price: 0, durationDays: 30 });
            }

        } catch (e: any) {
            console.error("Save Error:", e);
            alert(`❌ Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        if (confirm(`Are you sure you want to delete package ${id}?`)) {
            await deleteDoc(doc(db, 'packages', id));
        }
    };

    const stats = {
        total: packages.length,
        active: packages.filter(p => p.isActive).length,
        popular: packages.filter(p => p.isPopular).length
    };

    const getFeaturesList = (features: any): string[] => {
        if (!features || typeof features !== 'object') return [];
        return Object.entries(features)
            .filter(([_, value]) => value === true)
            .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    };

    return (
        <AdminLayout>
            <Head>
                <title>YouOke Admin | Packages</title>
            </Head>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการแพ็กเกจ</h1>
                    <p className="mt-1 text-gray-500">จัดการแผนราคาแบบขายสิทธิ์สมาชิกแบบต่างๆ</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCreate} className="btn btn-primary gap-2">
                        <PlusIcon className="w-4 h-4" /> สร้างแพ็กเกจ
                    </button>
                </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <ArchiveBoxIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500">แพ็กเกจทั้งหมด</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                        <CheckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                        <p className="text-sm text-gray-500">เปิดขาย</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                        <StarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.popular}</p>
                        <p className="text-sm text-gray-500">ยอดนิยม</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
                {packages.map((pkg) => {
                    const featureList = getFeaturesList(pkg.features);
                    return (
                        <div key={pkg.id} className={cn(
                            "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col",
                            pkg.isPopular && "ring-2 ring-primary/20",
                            !pkg.isActive && "opacity-60 grayscale-[0.5]"
                        )}>
                            {pkg.isPopular && (
                                <div className="absolute -right-8 top-4 rotate-45 bg-primary px-8 py-1 text-xs font-semibold text-white shadow-lg z-10">
                                    Popular
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                                        pkg.isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                                    )}>
                                        <ArchiveBoxIcon className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{pkg.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">ID: {pkg.id}</p>
                                    </div>
                                </div>
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost btn-xs h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                                        <EllipsisHorizontalIcon className="h-5 w-5" />
                                    </label>
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-xl w-40 z-20 border border-gray-100">
                                        <li>
                                            <a onClick={() => handleEdit(pkg)} className="gap-2 text-sm">
                                                <PencilIcon className="h-4 w-4" /> แก้ไข
                                            </a>
                                        </li>
                                        <li>
                                            <a onClick={() => handleDelete(pkg.id)} className="gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <TrashIcon className="h-4 w-4" /> ลบ
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">฿{pkg.price.toLocaleString()}</span>
                                    <span className="text-gray-500 text-sm">
                                        / {pkg.durationDays === 0 ? "ตลอดชีพ" : `${pkg.durationDays}วัน`}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2 h-10">{pkg.description}</p>
                            </div>

                            <div className="mb-6 flex-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">ฟีเจอร์</p>
                                <ul className="space-y-2">
                                    {featureList.slice(0, 4).map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <CheckIcon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-gray-700 leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                    {featureList.length === 0 && (
                                        <li className="text-xs text-gray-400 italic">No specific features listed</li>
                                    )}
                                    {featureList.length > 4 && (
                                        <li className="text-xs text-gray-400 pl-6">
                                            +{featureList.length - 4} more
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                    pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                )}>
                                    {pkg.isActive ? "เปิดขาย" : "ปิด"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {(editMode || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => { setEditMode(null); setIsCreating(false); }}
                    />

                    <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[85vh] flex flex-col">
                        <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {editMode ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}
                                </h3>
                                <p className="text-xs text-gray-500">ตั้งค่ารายละเอียดราคาและสิทธิประโยชน์</p>
                            </div>
                            <button
                                onClick={() => { setEditMode(null); setIsCreating(false); }}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label pt-0"><span className="label-text font-medium text-gray-700">รหัส (ID)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. basic_monthly"
                                        className="input input-sm input-bordered w-full"
                                        value={formData.id}
                                        disabled={!!editMode}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label pt-0"><span className="label-text font-medium text-gray-700">ชื่อแพ็กเกจ</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Basic Plan"
                                        className="input input-sm input-bordered w-full"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-medium text-gray-700">ราคา (บาท)</span></label>
                                    <input
                                        type="number"
                                        className="input input-sm input-bordered w-full"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-medium text-gray-700">จำนวนวัน</span></label>
                                    <input
                                        type="number"
                                        className="input input-sm input-bordered w-full"
                                        value={formData.durationDays}
                                        onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium text-gray-700">รายละเอียด</span></label>
                                <textarea
                                    className="textarea textarea-bordered h-20 resize-none text-sm"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-medium text-gray-700">ฟีเจอร์ด่วน (Quick Select)</span></label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PREDEFINED_FEATURES.map((feature) => {
                                        const isEnabled = isFeatureEnabled(feature);
                                        return (
                                            <div
                                                key={feature}
                                                onClick={() => toggleFeature(feature)}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border p-3 flex items-center justify-between transition-all select-none active:scale-95",
                                                    isEnabled
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                <span className="text-xs font-medium">{feature.split('(')[0]}</span>
                                                {isEnabled && <CheckIcon className="w-4 h-4" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label flex justify-between">
                                    <span className="label-text font-medium text-gray-700">ฟีเจอร์ (JSON Config)</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">ขั้นสูง</span>
                                </label>
                                <textarea
                                    className={cn(
                                        "textarea textarea-bordered h-24 font-mono text-xs",
                                        jsonError ? "border-red-500 focus:border-red-500" : ""
                                    )}
                                    value={featuresJson}
                                    onChange={e => setFeaturesJson(e.target.value)}
                                    placeholder='{ "feature": true }'
                                ></textarea>
                                {jsonError && <span className="text-xs text-red-500 mt-1">{jsonError}</span>}
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

                        <div className="bg-gray-50 p-4 m-0 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setEditMode(null); setIsCreating(false); }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleSave}
                                className="btn btn-primary btn-sm text-white min-w-[100px]"
                            >
                                {loading ? <span className="loading loading-spinner loading-xs"></span> : (
                                    <>
                                        <FolderArrowDownIcon className="w-4 h-4 mr-1" /> บันทึก
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
