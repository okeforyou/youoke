import React, { useState, useEffect } from 'react';
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { updateSystemConfig, DEFAULT_CONFIG } from '../../services/systemConfigService';
import ConfigToggle from '@/features/admin/components/ConfigToggle';
import {
    Cog6ToothIcon,
    ComputerDesktopIcon,
    MusicalNoteIcon,
    AdjustmentsHorizontalIcon,
    WrenchScrewdriverIcon,
    BanknotesIcon,
    PuzzlePieceIcon,
    TvIcon,
    PhotoIcon,
    PlusIcon,
    TrashIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import { Save, AlertCircle, PartyPopper, Trash2, Plus, CheckCircle, Smartphone, Youtube, Disc, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { THAI_FONTS, FONT_SIZES } from '../../data/fonts';
import { UpsellConfigPanel } from '@/features/admin/components/UpsellConfigPanel';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default function AdminConfigPage() {
    const { config, loading } = useSystemConfig();
    const [localConfig, setLocalConfig] = useState(config);
    const [saving, setSaving] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [activeTab, setActiveTab] = useState<'system' | 'features' | 'player' | 'ui' | 'login' | 'integrations' | 'payment' | 'marketing' | 'tv'>('system');
    const [toast, setToast] = useState('');
    const router = useRouter();

    // Login Content State (Local)
    const [loginTitle, setLoginTitle] = useState("");
    const [loginSubtitle, setLoginSubtitle] = useState("");
    const [loginFeatures, setLoginFeatures] = useState<{ title: string; desc: string; link?: string }[]>([]);
    const [loginTermsLink, setLoginTermsLink] = useState("");
    const [loginPrivacyLink, setLoginPrivacyLink] = useState("");

    useEffect(() => {
        if (!loading && config) {
            setLocalConfig(config);
            // Sync Login Content State
            if (config.content?.login) {
                setLoginTitle(config.content.login.title);
                setLoginSubtitle(config.content.login.subtitle);
                setLoginFeatures(config.content.login.features || []);
                setLoginTermsLink(config.content.login.termsLink || "");
                setLoginPrivacyLink(config.content.login.privacyLink || "");
            }
        }
    }, [config, loading]);

    // Handle Tab via Query Param to ... (omitted unused lines if contiguous edit but here we are in same block)
    // ...
    // Update URL when tab changes
    const handleTabChange = (tab: string) => {
        setActiveTab(tab as any);
        router.push({
            pathname: router.pathname,
            query: { ...router.query, tab }
        }, undefined, { shallow: true });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Merge login content back into config before saving
            const configToSave = {
                ...localConfig,
                content: {
                    ...localConfig.content,
                    login: {
                        title: loginTitle,
                        subtitle: loginSubtitle,
                        features: loginFeatures,
                        termsLink: loginTermsLink,
                        privacyLink: loginPrivacyLink
                    }
                }
            };

            await updateSystemConfig(configToSave);
            setToast('บันทึกการตั้งค่าแล้ว!');
            setTimeout(() => setToast(''), 3000);
        } catch (error) {
            console.error(error);
            setToast('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    // Login Content Helpers
    const addFeature = () => setLoginFeatures([...loginFeatures, { title: "ฟีเจอร์ใหม่", desc: "รายละเอียดฟีเจอร์", link: "" }]);
    const updateFeature = (index: number, field: 'title' | 'desc' | 'link', value: string) => {
        const newFeatures = [...loginFeatures];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setLoginFeatures(newFeatures);
    };
    const removeFeature = (index: number) => setLoginFeatures(loginFeatures.filter((_, i) => i !== index));

    const handleReset = async () => {
        if (!db) return;
        if (!confirm('ยืนยันที่จะรีเซ็ตการตั้งค่าทั้งหมดใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
        setInitializing(true);
        try {
            await setDoc(doc(db, 'settings', 'default'), DEFAULT_CONFIG);
            setLocalConfig(DEFAULT_CONFIG);
            setToast('รีเซ็ตระบบเรียบร้อย!');
            setTimeout(() => setToast(''), 3000);
        } catch (error) {
            console.error(error);
            setToast('เกิดข้อผิดพลาดในการรีเซ็ต');
        } finally {
            setInitializing(false);
        }
    };

    if (loading || !localConfig) return (
        <AdminLayout>
            <div className="flex items-center justify-center min-h-[50vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        </AdminLayout>
    );

    const MENU_ITEMS = [
        { id: 'system', label: 'ภาพรวม & ระบบ', icon: Cog6ToothIcon, desc: 'ตั้งค่าพื้นฐาน, ปิดปรับปรุง' },
        { id: 'features', label: 'ฟีเจอร์การใช้งาน', icon: ComputerDesktopIcon, desc: 'เปิด/ปิด ระบบต่างๆ' },
        { id: 'marketing', label: 'การตลาด & Upsell', icon: PartyPopper, desc: 'ข้อความเชิญชวน Premium' },
        { id: 'login', label: 'หน้า Login (เนื้อหา)', icon: PuzzlePieceIcon, desc: 'แก้ไขข้อความหน้าแรก' },
        { id: 'player', label: 'เครื่องเล่นเพลง', icon: MusicalNoteIcon, desc: 'ระดับเสียง, Crossfade' },
        { id: 'ui', label: 'หน้าตา & ธีม', icon: AdjustmentsHorizontalIcon, desc: 'ฟอนต์, แบนเนอร์' },
        { id: 'integrations', label: 'เชื่อมต่อ API', icon: WrenchScrewdriverIcon, desc: 'YouTube, Spotify' },
        { id: 'payment', label: 'การชำระเงิน', icon: BanknotesIcon, desc: 'เลขบัญชี, PromptPay' },
        { id: 'tv', label: 'Smart TV', icon: TvIcon, desc: 'ข้อความประกาศ, พื้นหลัง, โควต้า' },
    ];

    return (
        <AdminLayout headerTitle="ตั้งค่าระบบ (System Config)">
            <div className="flex flex-col lg:flex-row gap-8 pb-20 relative">

                {/* Left Sidebar Menu */}
                <div className="w-full lg:w-64 shrink-0 space-y-2 lg:sticky lg:top-24 h-fit max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar pr-2">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border",
                                activeTab === item.id
                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                    : "bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg", activeTab === item.id ? "bg-white/20" : "bg-gray-100")}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm">{item.label}</div>
                                <div className={cn("text-[10px]", activeTab === item.id ? "text-white/80" : "text-gray-400")}>{item.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Header Action */}
                    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-xl bg-white/80">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {MENU_ITEMS.find(i => i.id === activeTab)?.label}
                            </h2>
                            <p className="text-sm text-gray-500">จัดการการตั้งค่าในส่วนนี้</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary gap-2 shadow-lg shadow-primary/25 rounded-xl text-white px-6"
                        >
                            {saving ? <span className="loading loading-spinner"></span> : <Save className="w-5 h-5" />}
                            บันทึกการแก้ไข
                        </button>
                    </div>

                    <div className="space-y-6">

                        {/* ==================== SYSTEM TAB ==================== */}
                        {activeTab === 'system' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="p-6 border border-red-100 bg-red-50/50 rounded-2xl">
                                    <ConfigToggle
                                        label="โหมดปิดปรับปรุง (Maintenance Mode)"
                                        description="ปิดการเข้าถึงสำหรับผู้ใช้ทั่วไป (ยกเว้น Admin)"
                                        color="toggle-error"
                                        checked={localConfig.maintenanceMode}
                                        onChange={(val) => setLocalConfig({ ...localConfig, maintenanceMode: val })}
                                    />
                                </div>

                                <div className="bg-white border border-gray-100 p-6 rounded-2xl space-y-4 shadow-sm">
                                    <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">ประกาศแจ้งเตือน (Top Toolbar)</h3>
                                    <ConfigToggle
                                        label="เปิดใช้งานประกาศ"
                                        description="แสดงแถบข้อความด้านบนสุดของเว็บ"
                                        checked={localConfig.announcement?.enabled ?? false}
                                        onChange={(val) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, enabled: val } })}
                                    />

                                    {localConfig.announcement?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                            <div className="form-control md:col-span-2">
                                                <label className="label"><span className="label-text font-bold">ข้อความประกาศ</span></label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered w-full"
                                                    placeholder="เช่น ปิดปรับปรุงระบบ 10 นาที..."
                                                    value={localConfig.announcement?.message ?? ''}
                                                    onChange={(e) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, message: e.target.value } })}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label"><span className="label-text font-bold">ประเภท</span></label>
                                                <select
                                                    className="select select-bordered w-full"
                                                    value={localConfig.announcement?.type ?? 'info'}
                                                    onChange={(e) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, type: e.target.value as any } })}
                                                >
                                                    <option value="info">ทั่วไป (สีฟ้า)</option>
                                                    <option value="warning">เตือน (สีเหลือง)</option>
                                                    <option value="error">สำคัญ (สีแดง)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-red-200 bg-red-50 rounded-2xl p-6">
                                    <h3 className="text-red-700 font-bold mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" /> Danger Zone
                                    </h3>
                                    <p className="text-sm text-red-600 mb-4">
                                        รีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้น (API Keys และเลขบัญชีจะหายไปทั้งหมด)
                                    </p>
                                    <button onClick={handleReset} disabled={initializing} className="btn btn-error btn-sm text-white">
                                        {initializing ? "กำลังรีเซ็ต..." : "รีเซ็ตระบบเป็นค่าเริ่มต้น"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ==================== FEATURES TAB ==================== */}
                        {activeTab === 'features' && (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">การเข้าถึงและระบบหลัก</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <ConfigToggle
                                            label="Guest Mode"
                                            description="อนุญาตให้ใช้งานโดยไม่ต้อง Login"
                                            checked={localConfig.features?.guestMode ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, guestMode: val } })}
                                        />
                                        <ConfigToggle
                                            label="เปิดรับสมัครสมาชิก"
                                            description="อนุญาตให้ user ใหม่สมัครได้"
                                            checked={localConfig.features?.registration ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, registration: val } })}
                                        />
                                        <ConfigToggle
                                            label="ระบบค้นหา (Global Search)"
                                            description="เปิดใช้งานช่องค้นหาเพลง"
                                            checked={localConfig.features?.search ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, search: val } })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">ฟีเจอร์เสริม</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <ConfigToggle
                                            label="Remote Control"
                                            description="ใช้มือถือควบคุมจอหลัก"
                                            checked={localConfig.features?.remoteControl ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, remoteControl: val } })}
                                        />
                                        <ConfigToggle
                                            label="Chromecast / Airplay"
                                            description="ปุ่ม Cast ขึ้นจอทีวี"
                                            checked={localConfig.features?.cast ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, cast: val } })}
                                        />
                                        <ConfigToggle
                                            label="Engine เนื้อร้องคาราโอเกะ"
                                            description="แสดงเนื้อร้องแบบ Karaoke Mode"
                                            checked={localConfig.features?.karaokeMode ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, karaokeMode: val } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== LOGIN CONTENT TAB (NEW) ==================== */}
                        {activeTab === 'login' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2">ส่วนหัวและคำโปรย (Header Section)</h2>
                                    <div>
                                        <label className="label font-bold text-gray-700">หัวข้อหลัก (Title)</label>
                                        <textarea
                                            className="textarea textarea-bordered w-full text-lg font-bold"
                                            rows={2}
                                            value={loginTitle}
                                            onChange={(e) => setLoginTitle(e.target.value)}
                                            placeholder="เช่น ปลดปล่อยพลังเสียง..."
                                        ></textarea>
                                        <p className="text-xs text-gray-400 mt-1">Tip: ใช้ Enter เพื่อขึ้นบรรทัดใหม่</p>
                                    </div>
                                    <div>
                                        <label className="label font-bold text-gray-700">คำโปรยรอง (Subtitle)</label>
                                        <textarea
                                            className="textarea textarea-bordered w-full"
                                            rows={3}
                                            value={loginSubtitle}
                                            onChange={(e) => setLoginSubtitle(e.target.value)}
                                            placeholder="รายละเอียดเชิญชวน..."
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="label font-bold text-gray-700">Link เงื่อนไขการใช้งาน (Terms)</label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={loginTermsLink}
                                                onChange={(e) => setLoginTermsLink(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="label font-bold text-gray-700">Link นโยบายความเป็นส่วนตัว (Privacy)</label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={loginPrivacyLink}
                                                onChange={(e) => setLoginPrivacyLink(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h2 className="text-lg font-bold text-gray-900">รายการจุดเด่น (Features List)</h2>
                                        <button onClick={addFeature} className="btn btn-sm btn-ghost gap-2 text-primary">
                                            <Plus size={16} /> เพิ่มรายการ
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {loginFeatures.map((feature, idx) => (
                                            <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100 group">
                                                <span className="font-mono text-gray-300 text-sm mt-3">#{idx + 1}</span>
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            className="input input-sm input-bordered w-full font-bold"
                                                            value={feature.title}
                                                            onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                                                            placeholder="หัวข้อฟีเจอร์"
                                                        />
                                                        <input
                                                            type="text"
                                                            className="input input-sm input-bordered w-full"
                                                            value={feature.link}
                                                            onChange={(e) => updateFeature(idx, 'link', e.target.value)}
                                                            placeholder="Link ต.ย. https://..."
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="input input-sm input-bordered w-full"
                                                        value={feature.desc}
                                                        onChange={(e) => updateFeature(idx, 'desc', e.target.value)}
                                                        placeholder="รายละเอียด"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeFeature(idx)}
                                                    className="btn btn-sm btn-square btn-ghost text-red-400 hover:bg-red-50 mt-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {loginFeatures.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-sm italic">ยังไม่มีรายการฟีเจอร์</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== MARKETING TAB ==================== */}
                        {activeTab === 'marketing' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <UpsellConfigPanel />
                            </div>
                        )}

                        {/* ==================== PLAYER TAB ==================== */}
                        {activeTab === 'player' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">ตั้งค่าการเล่น</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="form-control w-full">
                                            <label className="label pt-0"><span className="label-text font-bold">ความดังเริ่มต้น ({localConfig.player?.defaultVolume}%)</span></label>
                                            <input
                                                type="range" min="0" max="100"
                                                value={localConfig.player?.defaultVolume ?? 80}
                                                onChange={(e) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, defaultVolume: parseInt(e.target.value) } })}
                                                className="range range-primary"
                                            />
                                        </div>
                                        <div className="form-control w-full">
                                            <label className="label pt-0"><span className="label-text font-bold">Crossfade ({localConfig.player?.crossfade} วินาที)</span></label>
                                            <input
                                                type="range" min="0" max="12" step="1"
                                                value={localConfig.player?.crossfade ?? 3}
                                                onChange={(e) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, crossfade: parseInt(e.target.value) } })}
                                                className="range range-secondary"
                                            />
                                            <div className="w-full flex justify-between text-xs px-2 mt-2 text-gray-400"><span>0s</span><span>6s</span><span>12s</span></div>
                                        </div>
                                    </div>
                                    <ConfigToggle
                                        label="เล่นเพลงอัตโนมัติ (Autoplay)"
                                        description="เมื่อเพลงหมด ให้เล่นเพลงแนะนำต่อทันที"
                                        checked={localConfig.player?.autoplay ?? true}
                                        onChange={(val) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, autoplay: val } })}
                                    />

                                    <div className="form-control w-full">
                                        <label className="label pt-0"><span className="label-text font-bold">แหล่งข้อมูลเพลงเริ่มต้น (Default Provider)</span></label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={localConfig.player?.defaultProvider ?? 'spotify'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, defaultProvider: e.target.value as 'spotify' | 'youtube' } })}
                                        >
                                            <option value="spotify">Spotify (Official - แนะนำ)</option>
                                            <option value="youtube">YouTube (Community / Custom)</option>
                                        </select>
                                        <label className="label"><span className="label-text-alt text-gray-500">เลือก Dashboard เริ่มต้นที่จะแสดงให้ผู้ใช้เมื่อเข้ามาครั้งแรก</span></label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== UI TAB ==================== */}
                        {activeTab === 'ui' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">องค์ประกอบหน้าเว็บ</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <ConfigToggle
                                            label="แสดง Hero Banner"
                                            description="แบนเนอร์ใหญ่ด้านบนสุด"
                                            checked={localConfig.ui?.showHero ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showHero: val } })}
                                        />
                                        <ConfigToggle
                                            label="แสดงหมวดหมู่ (Trending)"
                                            description="รายการเพลงฮิต"
                                            checked={localConfig.ui?.showTrending ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showTrending: val } })}
                                        />
                                        <ConfigToggle
                                            label="แสดงประเภทเพลง (Genres)"
                                            description="ตารางเลือกแนวเพลง"
                                            checked={localConfig.ui?.showGenres ?? true}
                                            onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showGenres: val } })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">เลือกฟอนต์ (Font Family)</h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {THAI_FONTS.map((font) => (
                                            <div
                                                key={font.family}
                                                className={`
                                                    relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                                                    ${localConfig.ui?.font?.family === font.family
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                        : 'border-gray-200 bg-white hover:border-primary/50'}
                                                `}
                                                onClick={() => setLocalConfig({
                                                    ...localConfig,
                                                    ui: {
                                                        ...localConfig.ui,
                                                        font: {
                                                            baseFontSize: 16, sidebarFontSize: 14, // Defaults
                                                            ...(localConfig.ui?.font || {}),
                                                            family: font.family, // Override family
                                                            googleFontsUrl: font.url
                                                        }
                                                    }
                                                })}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-sm truncate pr-2">{font.label}</span>
                                                    {localConfig.ui?.font?.family === font.family && (
                                                        <CheckCircle className="w-4 h-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className="text-2xl" style={{ fontFamily: font.family }}>กขคง Thai</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== INTEGRATIONS TAB ==================== */}
                        {activeTab === 'integrations' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><Youtube className="w-5 h-5 text-red-600" /> YouTube Integration</h3>
                                    <ConfigToggle
                                        label="ใช้ YouTube Data API"
                                        description="ใช้ API ทางการ (ต้องมี API Key) ดีกว่าแต่มีโควต้าจำกัด"
                                        checked={localConfig.integrations?.youtube?.useApi ?? false}
                                        onChange={(val) => setLocalConfig({
                                            ...localConfig,
                                            integrations: {
                                                ...localConfig.integrations!,
                                                youtube: { ...localConfig.integrations!.youtube, useApi: val }
                                            }
                                        })}
                                    />
                                    <div className="form-control">
                                        <label className="label"><span className="label-text font-bold">API Keys (คั่นด้วยคอมม่า ,)</span></label>
                                        <textarea
                                            className="textarea textarea-bordered h-24 font-mono text-xs"
                                            placeholder="AIzaSy..., AIzaSy..."
                                            value={localConfig.integrations?.youtube?.apiKeys?.join(', ') ?? ''}
                                            onChange={(e) => setLocalConfig({
                                                ...localConfig,
                                                integrations: {
                                                    ...localConfig.integrations!,
                                                    youtube: {
                                                        ...localConfig.integrations!.youtube,
                                                        apiKeys: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                                    }
                                                }
                                            })}
                                        ></textarea>
                                        <p className="text-xs text-gray-400 mt-1">ใสหลายคีย์ได้ ระบบจะวนใช้ให้อัตโนมัติ</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><Disc className="w-5 h-5 text-green-600" /> Spotify Integration</h3>
                                    <ConfigToggle
                                        label="เปิดใช้งาน Spotify"
                                        description="แสดงชาร์ตและเพลงฮิตจาก Spotify"
                                        checked={localConfig.integrations?.spotify?.enabled ?? true}
                                        onChange={(val) => setLocalConfig({
                                            ...localConfig,
                                            integrations: {
                                                ...localConfig.integrations!,
                                                spotify: { ...localConfig.integrations!.spotify, enabled: val }
                                            }
                                        })}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">Client ID</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={localConfig.integrations?.spotify?.clientId ?? ''}
                                                onChange={(e) => setLocalConfig({
                                                    ...localConfig,
                                                    integrations: {
                                                        ...localConfig.integrations!,
                                                        spotify: { ...localConfig.integrations!.spotify, clientId: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">Client Secret</span></label>
                                            <input
                                                type="password"
                                                className="input input-bordered w-full"
                                                value={localConfig.integrations?.spotify?.clientSecret ?? ''}
                                                onChange={(e) => setLocalConfig({
                                                    ...localConfig,
                                                    integrations: {
                                                        ...localConfig.integrations!,
                                                        spotify: { ...localConfig.integrations!.spotify, clientSecret: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div className="form-control md:col-span-2">
                                            <label className="label"><span className="label-text font-bold">Refresh Token</span></label>
                                            <input
                                                type="password"
                                                className="input input-bordered w-full"
                                                value={localConfig.integrations?.spotify?.refreshToken ?? ''}
                                                onChange={(e) => setLocalConfig({
                                                    ...localConfig,
                                                    integrations: {
                                                        ...localConfig.integrations!,
                                                        spotify: { ...localConfig.integrations!.spotify, refreshToken: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== PAYMENT TAB ==================== */}
                        {activeTab === 'payment' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">ข้อมูลบัญชีธนาคาร (โอนเงิน)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">ชื่อธนาคาร</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                placeholder="เช่น กสิกรไทย"
                                                value={localConfig.payment?.bankAccount?.bankName ?? ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment!, bankAccount: { ...localConfig.payment?.bankAccount!, bankName: e.target.value } } })}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">ชื่อบัญชี</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={localConfig.payment?.bankAccount?.accountName ?? ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment!, bankAccount: { ...localConfig.payment?.bankAccount!, accountName: e.target.value } } })}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">เลขที่บัญชี</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full font-mono"
                                                value={localConfig.payment?.bankAccount?.accountNumber ?? ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment!, bankAccount: { ...localConfig.payment?.bankAccount!, accountNumber: e.target.value } } })}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">สาขา (ถ้ามี)</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={localConfig.payment?.bankAccount?.branch ?? ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment!, bankAccount: { ...localConfig.payment?.bankAccount!, branch: e.target.value } } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 border-b pb-2">PromptPay (ทางเลือก)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">เบอร์โทร / เลขบัตร</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full font-mono"
                                                value={localConfig.payment?.promptPay?.id ?? ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment!, promptPay: { ...localConfig.payment?.promptPay!, id: e.target.value, name: localConfig.payment?.promptPay?.name || '' } } })}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-bold">ชื่อที่ลงทะเบียน</span></label>
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={localConfig.payment?.promptPay?.name ?? ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment!, promptPay: { ...localConfig.payment?.promptPay!, name: e.target.value, id: localConfig.payment?.promptPay?.id || '' } } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== TV TAB ==================== */}
                        {activeTab === 'tv' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* TV Template Selection */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <ComputerDesktopIcon className="w-5 h-5 text-primary" />
                                        รูปแบบหน้าจอ (TV Template)
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'classic', label: 'Classic (เน้นใช้งาน)', desc: 'เน้น QR Code และวิธีเชื่อมต่อ' },
                                            { id: 'ads', label: 'Advertising (เน้นโฆษณา)', desc: 'แสดงรูป Ads เต็มจอ หมุนเวียนไป' },
                                            { id: 'split', label: 'Split Screen', desc: 'แบ่งหน้าจอ โฆษณา + วิธีเชื่อมต่อ' },
                                            { id: 'video', label: 'Full Video', desc: 'เล่นวิดีโอโฆษณาเต็มหน้าจอ' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, template: t.id as any } })}
                                                className={cn(
                                                    "p-4 rounded-xl border text-left transition-all",
                                                    localConfig.tv?.template === t.id
                                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                        : "border-gray-100 hover:border-gray-200"
                                                )}
                                            >
                                                <div className={cn("font-bold text-sm mb-1", localConfig.tv?.template === t.id ? "text-primary" : "text-gray-700")}>{t.label}</div>
                                                <div className="text-[10px] text-gray-400 leading-tight">{t.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Guest Limits */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <MusicalNoteIcon className="w-5 h-5 text-primary" />
                                        จำกัดจำนวนเพลง (Guest Limits)
                                    </h3>
                                    <div>
                                        <label className="label"><span className="label-text font-bold">จำนวนเพลงฟรีสำหรับแขก (ต่อ 24 ชม.)</span></label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full"
                                            value={localConfig.tv?.guestSongLimit || 5}
                                            onChange={(e) => setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, guestSongLimit: parseInt(e.target.value) } })}
                                        />
                                        <p className="text-xs text-gray-400 mt-2 italic">* สำหรับผู้ใช้ที่ไม่ได้เข้าสู่ระบบ (Anonymous Users)</p>
                                    </div>
                                </div>

                                {/* Signage Messages */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <MegaphoneIcon className="w-5 h-5 text-primary" />
                                        ข้อความประกาศ (Signage Marquee)
                                    </h3>
                                    <div className="space-y-3">
                                        {(localConfig.tv?.signageMessages || []).map((msg, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="input input-bordered flex-1"
                                                    value={msg}
                                                    onChange={(e) => {
                                                        const newMsgs = [...(localConfig.tv?.signageMessages || [])];
                                                        newMsgs[index] = e.target.value;
                                                        setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageMessages: newMsgs } });
                                                    }}
                                                />
                                                <button
                                                    className="btn btn-ghost text-red-500 p-2"
                                                    onClick={() => {
                                                        const newMsgs = (localConfig.tv?.signageMessages || []).filter((_, i) => i !== index);
                                                        setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageMessages: newMsgs } });
                                                    }}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            className="btn btn-ghost btn-outline btn-sm w-full gap-2 border-dashed"
                                            onClick={() => {
                                                const newMsgs = [...(localConfig.tv?.signageMessages || []), ""];
                                                setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageMessages: newMsgs } });
                                            }}
                                        >
                                            <PlusIcon className="w-4 h-4" /> เพิ่มข้อความ
                                        </button>
                                    </div>
                                </div>

                                {/* ADS Management */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <PlayCircle className="w-5 h-5 text-primary" />
                                        จัดการตารางโฆษณา (Manage Ads)
                                    </h3>
                                    <div className="space-y-4">
                                        {(localConfig.tv?.ads || []).map((ad: any, index: number) => (
                                            <div key={index} className="p-4 border border-gray-100 rounded-xl space-y-3 bg-gray-50/50">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-400">ลำดับที่ {index + 1}</span>
                                                    <button
                                                        className="btn btn-ghost btn-xs text-red-500"
                                                        onClick={() => {
                                                            const newAds = (localConfig.tv?.ads || []).filter((_: any, i: number) => i !== index);
                                                            setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, ads: newAds } });
                                                        }}
                                                    >
                                                        <TrashIcon className="w-4 h-4" /> ลบออก
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label text-[10px] uppercase font-bold text-gray-400">ประเภทเนื้อหา</label>
                                                        <select
                                                            className="select select-bordered select-sm w-full"
                                                            value={ad.type}
                                                            onChange={(e) => {
                                                                const newAds = [...(localConfig.tv?.ads || [])];
                                                                newAds[index] = { ...ad, type: e.target.value as any };
                                                                setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, ads: newAds } });
                                                            }}
                                                        >
                                                            <option value="image">รูปภาพ (Image)</option>
                                                            <option value="video">วิดีโอ (Video)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="label text-[10px] uppercase font-bold text-gray-400">หัวข้อ (Title)</label>
                                                        <input
                                                            className="input input-bordered input-sm w-full"
                                                            value={ad.title || ''}
                                                            placeholder="โปรโมชั่น..."
                                                            onChange={(e) => {
                                                                const newAds = [...(localConfig.tv?.ads || [])];
                                                                newAds[index] = { ...ad, title: e.target.value };
                                                                setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, ads: newAds } });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="label text-[10px] uppercase font-bold text-gray-400">ลิงก์ไฟล์ (URL)</label>
                                                    <input
                                                        className="input input-bordered input-sm w-full font-mono"
                                                        value={ad.url}
                                                        placeholder="https://..."
                                                        onChange={(e) => {
                                                            const newAds = [...(localConfig.tv?.ads || [])];
                                                            newAds[index] = { ...ad, url: e.target.value };
                                                            setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, ads: newAds } });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            className="btn btn-primary btn-outline btn-sm w-full gap-2 border-dashed"
                                            onClick={() => {
                                                const newAds = [...(localConfig.tv?.ads || []), { type: 'image', url: '', title: '' }];
                                                setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, ads: newAds } });
                                            }}
                                        >
                                            <PlusIcon className="w-4 h-4" /> เพิ่มโฆษณาใหม่
                                        </button>
                                    </div>
                                </div>

                                {/* Signage Images */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <PhotoIcon className="w-5 h-5 text-primary" />
                                        รูปภาพพื้นหลัง (Signage Backgrounds)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(localConfig.tv?.signageImages || []).map((img, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100">
                                                    {img ? <img src={img} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><PhotoIcon className="w-10 h-10" /></div>}
                                                    <button
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                                        onClick={() => {
                                                            const newImgs = (localConfig.tv?.signageImages || []).filter((_, i) => i !== index);
                                                            setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageImages: newImgs } });
                                                        }}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Image URL..."
                                                    className="input input-bordered input-xs w-full"
                                                    value={img}
                                                    onChange={(e) => {
                                                        const newImgs = [...(localConfig.tv?.signageImages || [])];
                                                        newImgs[index] = e.target.value;
                                                        setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageImages: newImgs } });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        <div className="space-y-2">
                                            <button
                                                className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors"
                                                onClick={() => {
                                                    const newImgs = [...(localConfig.tv?.signageImages || []), ""];
                                                    setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageImages: newImgs } });
                                                }}
                                            >
                                                <PlusIcon className="w-8 h-8" />
                                                <span className="text-sm font-bold">เพิ่มรูปภาพ</span>
                                            </button>
                                            {/* Spacer to align with input fields in other cards */}
                                            <div className="h-[1.5rem]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="toast toast-end toast-bottom z-50">
                    <div className="alert alert-success shadow-lg text-white">
                        <span>{toast}</span>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
