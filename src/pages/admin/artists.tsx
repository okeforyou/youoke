import React, { useState, useEffect } from "react";
import AdminLayout from "@/features/admin/layouts/AdminLayout";
import { ARTIST_CATEGORIES, Artist } from "@/data/artist-categories";
import { Image as ImageIcon, Search, Save, Globe, CheckCircle2, AlertCircle, Trash2, Activity, TrendingUp, TrendingDown, Minus, BadgeCheck } from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { cn } from "@/utils/cn";
import { db } from "@/firebase";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import Image from "next/image";

const ArtistManagementPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [view, setView] = useState<'artists' | 'settings'>('artists');
    
    // JOOX API Config State
    const [wmid, setWmid] = useState("344612298");
    const [sessionKey, setSessionKey] = useState("bdfca21030ea3f78b4ccaec564de53cc");
    const [configSaving, setConfigSaving] = useState(false);

    // Get all unique artists from categories
    const allArtists: Artist[] = Array.from(
        new Set(
            ARTIST_CATEGORIES.flatMap(cat => cat.artists.map(a => a.name))
        )
    ).map(name => ({ name }));

    const filteredArtists = allArtists.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const fetchOverrides = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db as any, "artist_images"));
                const data: Record<string, string> = {};
                snapshot.forEach(doc => {
                    data[doc.id] = doc.data().imageUrl;
                });
                setOverrides(data);
                
                // Fetch JOOX Config
                const configDoc = await getDoc(doc(db as any, "system_config", "joox_api"));
                if (configDoc.exists()) {
                    setWmid(configDoc.data().wmid || "");
                    setSessionKey(configDoc.data().session_key || "");
                }
            } catch (error) {
                console.error("Error fetching overrides:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOverrides();
    }, []);

    const handleSelectArtist = (artist: Artist) => {
        setSelectedArtist(artist);
        setImageUrl(overrides[artist.name] || "");
        setMessage(null);
    };

    const handleSave = async () => {
        if (!selectedArtist) return;
        setSaving(true);
        setMessage(null);
        try {
            const cleanName = selectedArtist.name.split(' (')[0].trim();
            await setDoc(doc(db as any, "artist_images", cleanName), {
                imageUrl: imageUrl.trim(),
                updatedAt: new Date().toISOString()
            });
            setOverrides(prev => ({ ...prev, [cleanName]: imageUrl.trim() }));
            setMessage({ text: "บันทึกข้อมูลสำเร็จแล้ว", type: 'success' });
        } catch (error) {
            console.error("Error saving override:", error);
            setMessage({ text: "เกิดข้อผิดพลาดในการบันทึก", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedArtist) return;
        setSaving(true);
        try {
            const cleanName = selectedArtist.name.split(' (')[0].trim();
            await deleteDoc(doc(db as any, "artist_images", cleanName));
            const newOverrides = { ...overrides };
            delete newOverrides[cleanName];
            setOverrides(newOverrides);
            setImageUrl("");
            setMessage({ text: "ลบข้อมูลสำเร็จแล้ว", type: 'success' });
        } catch (error) {
            setMessage({ text: "เกิดข้อผิดพลาดในการลบ", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveConfig = async () => {
        setConfigSaving(true);
        setMessage(null);
        try {
            await setDoc(doc(db as any, "system_config", "joox_api"), {
                wmid: wmid.trim(),
                session_key: sessionKey.trim(),
                updatedAt: new Date().toISOString(),
                account: "youoke.okeforyous@gmail.com"
            });
            setMessage({ text: "บันทึกการตั้งค่าระบบสำเร็จแล้ว", type: 'success' });
        } catch (error) {
            console.error("Error saving config:", error);
            setMessage({ text: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", type: 'error' });
        } finally {
            setConfigSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Header Section */}
                <div className="p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-gray-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการข้อมูลศิลปิน</h1>
                            <p className="text-sm text-gray-500 mt-1 font-medium">จัดการรูปภาพและข้อมูลพื้นฐานของศิลปินในระบบ YouOke</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard 
                        title="ศิลปินทั้งหมด"
                        value={allArtists.length}
                        icon={Globe}
                        iconColor="primary"
                        className="border-primary/20 bg-gradient-to-br from-white to-primary/5"
                    />
                    <StatCard 
                        title="แก้ไขรูปภาพแล้ว"
                        value={Object.keys(overrides).length}
                        icon={ImageIcon}
                        iconColor="success"
                    />
                    <StatCard 
                        title="หมวดหมู่หลัก"
                        value={8}
                        icon={Globe}
                        iconColor="info"
                    />
                    <StatCard 
                        title="สถานะระบบ"
                        value="ปกติ"
                        icon={BadgeCheck}
                        iconColor="warning"
                    />
                </div>

                <div className="flex gap-2 mb-8 p-1 bg-gray-100 w-fit rounded-2xl border border-gray-200/50 shadow-inner">
                    <button 
                        onClick={() => setView('artists')}
                        className={`px-6 py-2.5 rounded-[14px] font-black text-sm transition-all ${view === 'artists' ? "bg-white shadow-md text-primary translate-y-[-1px]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        รายชื่อศิลปิน
                    </button>
                    <button 
                        onClick={() => setView('settings')}
                        className={`px-6 py-2.5 rounded-[14px] font-black text-sm transition-all ${view === 'settings' ? "bg-white shadow-md text-primary translate-y-[-1px]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        ตั้งค่าระบบ JOOX API
                    </button>
                </div>

                {view === 'artists' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Panel: Search & List */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="ค้นหาชื่อศิลปิน..."
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm h-[600px] flex flex-col">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">รายชื่อศิลปิน ({filteredArtists.length})</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {filteredArtists.map((artist) => {
                                        const hasOverride = !!overrides[artist.name.split(' (')[0].trim()];
                                        return (
                                            <div 
                                                key={artist.name}
                                                onClick={() => handleSelectArtist(artist)}
                                                className={`p-4 flex items-center gap-3 cursor-pointer transition-all border-l-4 ${
                                                    selectedArtist?.name === artist.name 
                                                        ? "bg-primary/5 border-primary" 
                                                        : "hover:bg-gray-50 border-transparent"
                                                }`}
                                            >
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                                                    <Image 
                                                        src={`/api/spotify/artists/image?name=${encodeURIComponent(artist.name)}`}
                                                        alt="" fill className="object-cover" unoptimized
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">
                                                        {artist.name.split(' (')[0]}
                                                    </p>
                                                    {artist.name.includes(' (') && (
                                                        <p className="text-[10px] text-gray-400 truncate">
                                                            {artist.name.match(/\((.*?)\)/)?.[1]}
                                                        </p>
                                                    )}
                                                    {hasOverride && <p className="text-[9px] text-green-500 font-bold uppercase mt-0.5">Custom Image</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Editor */}
                        <div className="lg:col-span-2">
                            {selectedArtist ? (
                                <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                                                <Image 
                                                    src={imageUrl || `/api/spotify/artists/image?name=${encodeURIComponent(selectedArtist.name)}`}
                                                    alt={selectedArtist.name} fill className="object-cover" unoptimized
                                                />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {selectedArtist.name.split(' (')[0]}
                                                </h2>
                                                {selectedArtist.name.includes(' (') && (
                                                    <p className="text-gray-400 text-sm font-medium">
                                                        {selectedArtist.name.match(/\((.*?)\)/)?.[1]}
                                                    </p>
                                                )}
                                                <p className="text-gray-400 text-[11px] mt-1">จัดการรูปภาพหน้าปกเฉพาะของศิลปินคนนี้</p>
                                            </div>
                                        </div>
                                        {overrides[selectedArtist.name.split(' (')[0].trim()] && (
                                            <button 
                                                onClick={handleDelete}
                                                disabled={saving}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                title="ลบข้อมูลการตั้งค่าเดิม"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (Override)</label>
                                            <div className="relative">
                                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input 
                                                    type="text"
                                                    placeholder="https://... หรือปล่อยว่างเพื่อใช้จากระบบอัตโนมัติ"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                                                    value={imageUrl}
                                                    onChange={(e) => setImageUrl(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-2 px-1 italic">หารูปจาก JOOX, Sanook หรือ Pinterest แล้วนำ Link มาวางที่นี่เพื่อคุณภาพงานที่พรีเมียมที่สุด</p>
                                        </div>

                                        {message && (
                                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${
                                                message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                            }`}>
                                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                                <span className="text-sm font-bold">{message.text}</span>
                                            </div>
                                        )}

                                        <div className="pt-4 mt-auto">
                                            <button 
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <Save className="w-5 h-5" />
                                                {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-12 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <h4 className="font-bold text-blue-800 text-sm mb-2">💡 เคล็ดลับความยั่งยืน</h4>
                                        <p className="text-blue-700/70 text-xs leading-relaxed">
                                            ชื่อศิลปินที่แสดงด้านซ้ายมาจากระบบอัตโนมัติ การตั้งค่าที่นี่จะถูกเก็บไว้เป็นลำดับความสำคัญสูงสุด (Priority 1) 
                                            แม้ในอนาคต API จาก JOOX จะเปลี่ยนโครงร่าง แต่รูปที่พี่ตั้งไว้ตรงนี้จะไม่หายไปครับ
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[500px] border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <Search className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-400">เลือกศิลปินเพื่อเริ่มจัดการ</h3>
                                    <p className="text-gray-400 text-sm max-w-xs mt-2">คุณสามารถค้นหาศิลปินได้จากช่องค้นหาด้านซ้ายเพื่อแก้ไขรูปภาพหน้าปกรายบุคคล</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">ตั้งค่าการเชื่อมต่อ JOOX</h2>
                            <p className="text-gray-400 text-sm mb-8">ใส่ค่า WMID และ Session Key จาก Account JOOX เพื่อให้ระบบดึงรูปได้เสถียร 100%</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">WMID</label>
                                    <input 
                                        type="text"
                                        placeholder="เช่น 344612298"
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                                        value={wmid}
                                        onChange={(e) => setWmid(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Session Key</label>
                                    <input 
                                        type="text"
                                        placeholder="เช่น bdfca210..."
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                                        value={sessionKey}
                                        onChange={(e) => setSessionKey(e.target.value)}
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                                        message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                    }`}>
                                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                        <span className="text-sm font-bold">{message.text}</span>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button 
                                        onClick={handleSaveConfig}
                                        disabled={configSaving}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {configSaving ? "กำลังบันทึก..." : "อัปเดตการตั้งค่าระบบ"}
                                    </button>
                                </div>

                                <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                                    <h4 className="font-bold text-amber-800 text-sm mb-2">⚠️ วิธีหาค่า WMID & Session Key</h4>
                                    <ul className="text-amber-700/80 text-xs space-y-2 list-disc pl-4">
                                        <li>เข้าระบบ JOOX.com ใน Browser</li>
                                        <li>เปิดเครื่องมือ Inspect (F12) และไปที่ Application -{">"} Cookies</li>
                                        <li>หาคุกกี้ชื่อ <code className="bg-amber-100 px-1 rounded">wmid</code> และ <code className="bg-amber-100 px-1 rounded">session_key</code></li>
                                        <li>นำมาวางที่นี่แล้วกดบันทึก ระบบจะเริ่มใช้ทันทีครับ</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ArtistManagementPage;
