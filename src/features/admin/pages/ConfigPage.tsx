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
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../../utils/cn';

const THAI_FONTS = [
    { family: 'Kanit', label: 'Kanit (Modern)', url: '...' },
    { family: 'Prompt', label: 'Prompt (Loopless)', url: '...' },
    { family: 'Sarabun', label: 'Sarabun (Formal)', url: '...' },
    { family: 'Mali', label: 'Mali (Handwritten)', url: '...' },
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
            alert("✅ Settings saved!");
        } catch (error) {
            console.error(error);
            alert("❌ Save failed");
        } finally {
            setSaving(false);
        }
    };

    const MENU_ITEMS = [
        { id: 'system', label: 'System', icon: Cog6ToothIcon, desc: 'Maintenance, Defaults' },
        { id: 'features', label: 'Features', icon: ComputerDesktopIcon, desc: 'Toggle Modules' },
        { id: 'marketing', label: 'Marketing', icon: MegaphoneIcon, desc: 'Upsells & Ads' },
        { id: 'login', label: 'Login Page', icon: PuzzlePieceIcon, desc: 'Content & texts' },
        { id: 'player', label: 'Player', icon: MusicalNoteIcon, desc: 'Audio settings' },
        { id: 'ui', label: 'Appearance', icon: AdjustmentsHorizontalIcon, desc: 'Theme & Fonts' },
        { id: 'integrations', label: 'Integrations', icon: WrenchScrewdriverIcon, desc: 'Youtube, Spotify' },
        { id: 'payment', label: 'Payments', icon: BanknotesIcon, desc: 'Bank Accounts' },
    ];

    if (loading) return <div className="p-12 text-center">Loading config...</div>;

    return (
        <AdminLayout>
            <Head>
                <title>System Config - Admin</title>
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
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="p-6 border border-red-100 bg-red-50/50 rounded-2xl">
                                <ConfigToggle
                                    label="Maintenance Mode"
                                    description="Restrict access to admins only"
                                    color="toggle-error"
                                    checked={localConfig.maintenanceMode || false}
                                    onChange={(val) => setLocalConfig({ ...localConfig, maintenanceMode: val })}
                                />
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold mb-4">Announcement Bar</h3>
                                <ConfigToggle
                                    label="Enable Announcement"
                                    checked={localConfig.announcement?.enabled || false}
                                    onChange={(val) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, enabled: val } })}
                                />
                                {localConfig.announcement?.enabled && (
                                    <div className="mt-4 space-y-2">
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            placeholder="Message..."
                                            value={localConfig.announcement?.message || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, message: e.target.value } })}
                                        />
                                        <select
                                            className="select select-bordered w-full"
                                            value={localConfig.announcement?.type || 'info'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, announcement: { ...localConfig.announcement, type: e.target.value } })}
                                        >
                                            <option value="info">Info</option>
                                            <option value="warning">Warning</option>
                                            <option value="error">Critical</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <ConfigToggle
                                label="Guest Mode"
                                checked={localConfig.features?.guestMode ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, guestMode: val } })}
                            />
                            <ConfigToggle
                                label="User Registration"
                                checked={localConfig.features?.registration ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, registration: val } })}
                            />
                            <ConfigToggle
                                label="Global Search"
                                checked={localConfig.features?.search ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, search: val } })}
                            />
                            <ConfigToggle
                                label="Remote Control"
                                checked={localConfig.features?.remoteControl ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, remoteControl: val } })}
                            />
                            <ConfigToggle
                                label="Cast to TV"
                                checked={localConfig.features?.cast ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, features: { ...localConfig.features, cast: val } })}
                            />
                        </div>
                    )}

                    {activeTab === 'marketing' && <UpsellConfigPanel />}

                    {activeTab === 'login' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">Login Screen Content</h3>
                            <div>
                                <label className="label">Title</label>
                                <input
                                    className="input input-bordered w-full"
                                    value={localConfig.content?.login?.title || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, content: { ...localConfig.content, login: { ...localConfig.content.login, title: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="label">Subtitle</label>
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
                            <h3 className="font-bold">Player Defaults</h3>
                            <div>
                                <label className="label">Default Volume ({localConfig.player?.defaultVolume}%)</label>
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
                                label="Autoplay"
                                checked={localConfig.player?.autoplay ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, player: { ...localConfig.player, autoplay: val } })}
                            />
                        </div>
                    )}

                    {activeTab === 'ui' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">Appearance</h3>
                            <ConfigToggle
                                label="Show Hero Banner"
                                checked={localConfig.ui?.showHero ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showHero: val } })}
                            />
                            <ConfigToggle
                                label="Show Trending"
                                checked={localConfig.ui?.showTrending ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showTrending: val } })}
                            />
                            <ConfigToggle
                                label="Show Genres"
                                checked={localConfig.ui?.showGenres ?? true}
                                onChange={(val) => setLocalConfig({ ...localConfig, ui: { ...localConfig.ui, showGenres: val } })}
                            />
                            <h4 className="font-semibold mt-4">Font Family</h4>
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

                    {activeTab === 'integrations' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">Integrations</h3>
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
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="font-bold">Bank Account</h3>
                            <input
                                className="input input-bordered w-full"
                                placeholder="Bank Name"
                                value={localConfig.payment?.bankAccount?.bankName || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, bankAccount: { ...localConfig.payment.bankAccount, bankName: e.target.value } } })}
                            />
                            <input
                                className="input input-bordered w-full"
                                placeholder="Account Name"
                                value={localConfig.payment?.bankAccount?.accountName || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, bankAccount: { ...localConfig.payment.bankAccount, accountName: e.target.value } } })}
                            />
                            <input
                                className="input input-bordered w-full font-mono"
                                placeholder="Account Number"
                                value={localConfig.payment?.bankAccount?.accountNumber || ''}
                                onChange={(e) => setLocalConfig({ ...localConfig, payment: { ...localConfig.payment, bankAccount: { ...localConfig.payment.bankAccount, accountNumber: e.target.value } } })}
                            />
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
