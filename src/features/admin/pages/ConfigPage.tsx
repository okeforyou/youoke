import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../layouts/AdminLayout';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { SystemConfigService, DEFAULT_CONFIG } from '../services/systemConfigService';
import ConfigToggle from '../components/ConfigToggle';
import { UpsellConfigPanel } from '../components/UpsellConfigPanel';
import {
    Cog6ToothIcon,
    ComputerDesktopIcon,
    MusicalNoteIcon,
    AdjustmentsHorizontalIcon,
    WrenchScrewdriverIcon,
    BanknotesIcon,
    PuzzlePieceIcon,
    MegaphoneIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    TvIcon,
    PhotoIcon,
    PlusIcon,
    TrashIcon,
    PlayCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../../utils/cn';

const THAI_FONTS = [
    { family: 'Kanit', label: 'Kanit (ทันสมัย)', url: '...' },
    { family: 'Prompt', label: 'Prompt (ไม่มีหัว)', url: '...' },
    { family: 'Sarabun', label: 'Sarabun (ทางการ)', url: '...' },
    { family: 'Mali', label: 'Mali (ลายมือ)', url: '...' },
];

export default function ConfigPage() {
    const { config, loading } = useSystemConfig();
    const [localConfig, setLocalConfig] = useState(config);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('system');
    const router = useRouter();

    useEffect(() => {
        if (!loading && config) {
            setLocalConfig(config);
        }
    }, [config, loading]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await SystemConfigService.updateConfig(localConfig);
            alert("✅ บันทึกการตั้งค่าเรียบร้อย!");
        } catch (error) {
            console.error(error);
            alert("❌ บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    const MENU_ITEMS = [
        { id: 'system', label: 'ระบบ', icon: Cog6ToothIcon, desc: 'โหมดปิดปรับปรุง, ค่าเริ่มต้น' },
        { id: 'features', label: 'ฟีเจอร์', icon: ComputerDesktopIcon, desc: 'เปิด/ปิด ระบบต่างๆ' },
        { id: 'marketing', label: 'การตลาด', icon: MegaphoneIcon, desc: 'Upsells & โฆษณา' },
        { id: 'login', label: 'หน้าล็อกอิน', icon: PuzzlePieceIcon, desc: 'เนื้อหาและข้อความ' },
        { id: 'player', label: 'เครื่องเล่น', icon: MusicalNoteIcon, desc: 'ตั้งค่าเสียง' },
        { id: 'ui', label: 'รูปลักษณ์', icon: AdjustmentsHorizontalIcon, desc: 'ธีมและฟอนต์' },
        { id: 'integrations', label: 'เชื่อมต่อระบบ', icon: WrenchScrewdriverIcon, desc: 'Youtube, Spotify' },
        { id: 'tv', label: 'Smart TV', icon: TvIcon, desc: 'ข้อความประกาศ, พื้นหลัง, โควต้า' },
        { id: 'payment', label: 'การชำระเงิน', icon: BanknotesIcon, desc: 'บัญชีธนาคาร' },
    ];

    if (loading) return <div className="p-12 text-center text-gray-500">กำลังโหลดการตั้งค่า...</div>;

    return (
        <AdminLayout>
            <Head>
                <title>ตั้งค่าระบบ (System Config) - Admin</title>
            </Head>

            <div className="flex flex-col lg:flex-row gap-8 pb-20 relative">
                {/* Sidebar */}
                <div className="w-full lg:w-64 shrink-0 space-y-2 lg:sticky lg:top-24 h-fit">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border",
                                activeTab === item.id
                                    ? "bg-primary text-white border-primary shadow-md"
                                    : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <div>
                                <div className="font-bold text-sm">{item.label}</div>
                                <div className={cn("text-[10px]", activeTab === item.id ? "text-white/80" : "text-gray-400")}>{item.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-xl bg-white/80">
                        <h2 className="text-xl font-bold text-gray-800">
                            {MENU_ITEMS.find(i => i.id === activeTab)?.label}
                        </h2>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary btn-sm gap-2"
                        >
                            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="font-bold">ตั้งค่าทั่วไป</h3>
                                <div>
                                    <label className="label">ชื่อเว็บไซต์</label>
                                    <input
                                        className="input input-bordered w-full"
                                        value={localConfig.general?.siteName || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, general: { ...localConfig.general, siteName: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className="label">คำอธิบายเว็บไซต์</label>
                                    <textarea
                                        className="textarea textarea-bordered w-full"
                                        rows={2}
                                        value={localConfig.general?.siteDescription || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, general: { ...localConfig.general, siteDescription: e.target.value } })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">จำนวนผู้ใช้สูงสุด / ห้อง</label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full"
                                            value={localConfig.general?.maxGuestsPerRoom || 10}
                                            onChange={(e) => setLocalConfig({ ...localConfig, general: { ...localConfig.general, maxGuestsPerRoom: parseInt(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">ภาษาเริ่มต้น</label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={localConfig.general?.defaultLanguage || 'th'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, general: { ...localConfig.general, defaultLanguage: e.target.value } })}
                                        >
                                            <option value="th">ไทย</option>
                                            <option value="en">อังกฤษ (English)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border border-red-100 bg-red-50/50 rounded-2xl">
                                <ConfigToggle
                                    label="โหมดปิดปรับปรุง"
                                    description="จำกัดการเข้าถึงเฉพาะผู้ดูแลระบบเท่านั้น"
                                    color="toggle-error"
                                    checked={localConfig.maintenanceMode || false}
                                    onChange={(val) => setLocalConfig({ ...localConfig, maintenanceMode: val })}
                                />
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold mb-4">แถบประกาศ</h3>
                                <ConfigToggle
                                    label="เปิดใช้งานแถบประกาศ"
                                    checked={localConfig.announcement?.enabled || false}
                                    onChange={(val) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, enabled: val } })}
                                />
                                {localConfig.announcement?.enabled && (
                                    <div className="mt-4 space-y-2">
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            placeholder="ข้อความประกาศ..."
                                            value={localConfig.announcement?.message || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, message: e.target.value } })}
                                        />
                                        <select
                                            className="select select-bordered w-full"
                                            value={localConfig.announcement?.type || 'info'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, type: e.target.value } })}
                                        >
                                            <option value="info">ข้อมูลทั่วไป (Info)</option>
                                            <option value="warning">แจ้งเตือน (Warning)</option>
                                            <option value="error">สำคัญ (Critical)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold mb-2">ฟีเจอร์หลัก (Core Features)</h3>
                            <ConfigToggle
                                label="โหมดผู้เยี่ยมชม (Guest Access)"
                                checked={localConfig.features?.guestMode ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, guestMode: val } })}
                            />
                            <ConfigToggle
                                label="สมัครสมาชิกใหม่"
                                checked={localConfig.features?.registration ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, registration: val } })}
                            />
                            <ConfigToggle
                                label="ค้นหาเพลงทั่วโลก (Global Search)"
                                checked={localConfig.features?.search ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, search: val } })}
                            />

                            <div className="divider">ฟีเจอร์ภายในห้อง</div>

                            <ConfigToggle
                                label="รีโมทคอนโทรล (ผ่านมือถือ)"
                                checked={localConfig.features?.remoteControl ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, remoteControl: val } })}
                            />
                            <ConfigToggle
                                label="แคสต์ขึ้นจอทีวี (Cast)"
                                checked={localConfig.features?.cast ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, cast: val } })}
                            />
                            <ConfigToggle
                                label="จัดการคิวเพลง"
                                checked={localConfig.features?.queue ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, queue: val } })}
                            />
                            <ConfigToggle
                                label="แชร์ลิ้งค์ห้อง"
                                checked={localConfig.features?.shareRoom ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, shareRoom: val } })}
                            />

                            <div className="divider">ทดลองใช้ / กำลังพัฒนา (Labs)</div>

                            <ConfigToggle
                                label="สั่งงานด้วยเสียง (Voice Control)"
                                checked={localConfig.features?.voiceControl ?? false}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, voiceControl: val } })}
                            />
                            <ConfigToggle
                                label="แสดงเนื้อเพลง (Lyrics Display)"
                                checked={localConfig.features?.lyrics ?? false}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, lyrics: val } })}
                            />
                            <ConfigToggle
                                label="MIDI Player"
                                checked={localConfig.features?.midi ?? false}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, midi: val } })}
                            />
                        </div>
                    )}

                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <h3 className="font-bold text-gray-900 pb-2 flex items-center gap-2 border-b">
                                    <MegaphoneIcon className="w-5 h-5 text-primary" />
                                    จัดการโฆษณา (Ad Settings)
                                </h3>
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <ConfigToggle
                                        label="แสดงโฆษณา (พื้นที่ประชาสัมพันธ์)"
                                        description="แสดงแถบสีแดง '📢 พื้นที่โฆษณาประชาสัมพันธ์' ในหน้าเครื่องเล่นสำหรับสมาชิกฟรี"
                                        color="toggle-error"
                                        checked={localConfig.membership?.free?.show_ads ?? true}
                                        onChange={(val) => setLocalConfig({
                                            ...localConfig,
                                            membership: {
                                                ...localConfig.membership,
                                                free: { ...localConfig.membership?.free, show_ads: val }
                                            }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <h3 className="font-bold text-gray-900 pb-2 flex items-center gap-2 border-b">
                                    <MusicalNoteIcon className="w-5 h-5 text-primary" />
                                    จำกัดการใช้งานหน้าเว็บ (Dashboard Limits)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">โควต้าเพลงฟรี (ต่อวัน)</label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full"
                                            value={localConfig.membership?.free?.max_daily_songs ?? 20}
                                            onChange={(e) => setLocalConfig({
                                                ...localConfig,
                                                membership: {
                                                    ...localConfig.membership,
                                                    free: { ...localConfig.membership?.free, max_daily_songs: parseInt(e.target.value) }
                                                }
                                            })}
                                        />
                                        <p className="text-[10px] text-gray-400">ระบุจำนวนเพลงที่สมาชิก Free ร้องได้ต่อวัน</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600">จำกัดความยาววิดีโอ (วินาที)</label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full"
                                            value={localConfig.membership?.free?.max_duration_sec ?? 0}
                                            onChange={(e) => setLocalConfig({
                                                ...localConfig,
                                                membership: {
                                                    ...localConfig.membership,
                                                    free: { ...localConfig.membership?.free, max_duration_sec: parseInt(e.target.value) }
                                                }
                                            })}
                                        />
                                        <p className="text-[10px] text-gray-400">0 = ไม่จำกัดความยาว</p>
                                    </div>
                                </div>
                            </div>

                            <UpsellConfigPanel />
                        </div>
                    )}

                    {activeTab === 'login' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">เนื้อหาหน้าล็อกอิน</h3>
                            <div>
                                <label className="label">หัวข้อ (Title)</label>
                                <input
                                    className="input input-bordered w-full"
                                    value={localConfig.content?.login?.title || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, content: { ...localConfig.content, login: { ...localConfig.content.login, title: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="label">คำอธิบายรอง (Subtitle)</label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    value={localConfig.content?.login?.subtitle || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, content: { ...localConfig.content, login: { ...localConfig.content.login, subtitle: e.target.value } } })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'player' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">ตั้งค่าเครื่องเล่นเริ่มต้น</h3>
                            <div>
                                <label className="label">ความดังเริ่มต้น ({localConfig.player?.defaultVolume}%)</label>
                                <input
                                    type="range" min="0" max="100"
                                    className="range range-xs range-primary"
                                    value={localConfig.player?.defaultVolume || 80}
                                    onChange={(e) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, defaultVolume: parseInt(e.target.value) } })}
                                />
                            </div>
                            <div>
                                <label className="label">Crossfade ({localConfig.player?.crossfade}s)</label>
                                <input
                                    type="range" min="0" max="12"
                                    className="range range-xs range-secondary"
                                    value={localConfig.player?.crossfade || 3}
                                    onChange={(e) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, crossfade: parseInt(e.target.value) } })}
                                />
                            </div>
                            <ConfigToggle
                                label="เล่นอัตโนมัติ (Autoplay)"
                                checked={localConfig.player?.autoplay ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, autoplay: val } })}
                            />
                        </div>
                    )}

                    {activeTab === 'ui' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">รูปลักษณ์ (Appearance)</h3>
                            <ConfigToggle
                                label="แสดงแบนเนอร์ (Hero Banner)"
                                checked={localConfig.ui?.showHero ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showHero: val } })}
                            />
                            <ConfigToggle
                                label="แสดงเพลงฮิต (Trending)"
                                checked={localConfig.ui?.showTrending ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showTrending: val } })}
                            />
                            <ConfigToggle
                                label="แสดงหมวดหมู่ (Genres)"
                                checked={localConfig.ui?.showGenres ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showGenres: val } })}
                            />
                            <h4 className="font-semibold mt-4">รูปแบบตัวอักษร (Font Family)</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {THAI_FONTS.map(f => (
                                    <div
                                        key={f.family}
                                        className={cn(
                                            "border p-3 rounded-lg cursor-pointer hover:bg-gray-50",
                                            localConfig.ui?.font?.family === f.family ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                        )}
                                        onClick={() => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, font: { ...localConfig.ui.font, family: f.family } } })}
                                    >
                                        <div className="font-bold text-sm">{f.label}</div>
                                        <div className="text-xl" style={{ fontFamily: f.family }}>กขคง Thai</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tv' && (
                        <div className="space-y-6">
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
                                    <label className="label">จำนวนเพลงฟรีสำหรับแขก (ต่อ 24 ชม.)</label>
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
                                    {(localConfig.tv?.signageMessages || []).map((msg: string, index: number) => (
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
                                                    const newMsgs = (localConfig.tv?.signageMessages || []).filter((_: string, i: number) => i !== index);
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
                                    <PlayCircleIcon className="w-5 h-5 text-primary" />
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
                                {(localConfig.tv?.signageImages || []).map((img: string, index: number) => (
                                    <div key={index} className="space-y-2">
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100">
                                            {img ? <img src={img} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><PhotoIcon className="w-10 h-10" /></div>}
                                            <button
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                                onClick={() => {
                                                    const newImgs = (localConfig.tv?.signageImages || []).filter((_: string, i: number) => i !== index);
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
                                    <button
                                        className="aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            const newImgs = [...(localConfig.tv?.signageImages || []), ""];
                                            setLocalConfig({ ...localConfig, tv: { ...localConfig.tv, signageImages: newImgs } });
                                        }}
                                    >
                                        <PlusIcon className="w-8 h-8" />
                                        <span className="text-sm font-bold">เพิ่มรูปภาพ</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">เชื่อมต่อระบบภายนอก (Integrations)</h3>
                            <div className="form-control">
                                <label className="label">Spotify Client ID</label>
                                <input
                                    className="input input-bordered input-sm"
                                    value={localConfig.integrations?.spotify?.clientId || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, integrations: { ...localConfig.integrations, spotify: { ...localConfig.integrations.spotify, clientId: e.target.value } } })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">Spotify Client Secret</label>
                                <input
                                    type="password"
                                    className="input input-bordered input-sm"
                                    value={localConfig.integrations?.spotify?.clientSecret || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, integrations: { ...localConfig.integrations, spotify: { ...localConfig.integrations.spotify, clientSecret: e.target.value } } })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-900 pb-2 flex items-center gap-2 border-b mb-4">
                                    <BanknotesIcon className="w-5 h-5 text-primary" />
                                    บัญชีธนาคาร (Bank Transfer)
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label text-xs font-bold text-gray-500 uppercase">ชื่อธนาคาร</label>
                                        <input
                                            className="input input-bordered w-full"
                                            placeholder="ตัวอย่าง: ไทยพาณิชย์ (SCB)"
                                            value={localConfig.payment?.bankAccount?.bankName || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, bankAccount: { ...localConfig.payment.bankAccount, bankName: e.target.value } } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label text-xs font-bold text-gray-500 uppercase">ชื่อบัญชี</label>
                                        <input
                                            className="input input-bordered w-full"
                                            placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
                                            value={localConfig.payment?.bankAccount?.accountName || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, bankAccount: { ...localConfig.payment.bankAccount, accountName: e.target.value } } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label text-xs font-bold text-gray-500 uppercase">เลขที่บัญชี</label>
                                        <input
                                            className="input input-bordered w-full font-mono"
                                            placeholder="000-0-00000-0"
                                            value={localConfig.payment?.bankAccount?.accountNumber || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, bankAccount: { ...localConfig.payment.bankAccount, accountNumber: e.target.value } } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <h3 className="font-bold text-gray-900 pb-2 flex items-center gap-2 border-b mb-4">
                                    <PuzzlePieceIcon className="w-5 h-5 text-primary" />
                                    สแกนจ่าย (PromptPay / QR Code)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="label text-xs font-bold text-gray-500 uppercase">PromptPay ID</label>
                                            <input
                                                className="input input-bordered w-full font-mono"
                                                placeholder="เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน"
                                                value={localConfig.payment?.promptPay?.id || ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, promptPay: { ...(localConfig.payment?.promptPay || { name: '', id: '' }), id: e.target.value } } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label text-xs font-bold text-gray-500 uppercase">รูปภาพ QR Code (URL)</label>
                                            <input
                                                className="input input-bordered w-full font-mono"
                                                placeholder="/img/your-qr.jpg หรือ https://..."
                                                value={localConfig.payment?.promptPay?.qrImageUrl || ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, promptPay: { ...(localConfig.payment?.promptPay || { name: '', id: '' }), qrImageUrl: e.target.value } } })}
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 italic">* สามารถใช้รูปภายในระบบ (/img/...) หรือลิ้งค์ภายนอกได้</p>
                                        </div>
                                    </div>
                                    
                                    <div className="border rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 border-dashed">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mb-3">ตัวอย่างการแสดงผล</span>
                                        {localConfig.payment?.promptPay?.qrImageUrl ? (
                                            <div className="bg-white p-2 rounded-xl shadow-sm border">
                                                <img src={localConfig.payment.promptPay.qrImageUrl} alt="QR Preview" className="w-32 h-32 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
                                                <PhotoIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
