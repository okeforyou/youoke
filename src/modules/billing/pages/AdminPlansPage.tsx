import { useEffect, useState } from "react";
import Head from "next/head";
import AdminLayout from "../../../layouts/AdminLayout";
import { useSystemConfig } from "../../../hooks/useSystemConfig";
import { updateSystemConfig, SystemConfig } from "../../../services/systemConfigService";
import { Shield, Zap, Radio, Globe, Tv, Check, Save, DollarSign, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function AdminPlansPage() {
    const { addToast } = useToast() || { addToast: (msg: string) => window.alert(msg) };
    const { config, loading } = useSystemConfig();
    const [formConfig, setFormConfig] = useState<SystemConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (!loading && config) {
            setFormConfig(config);
        }
    }, [config, loading]);

    const handleSave = async () => {
        if (!formConfig) return;
        setSaving(true);
        try {
            await updateSystemConfig(formConfig);
            setSuccessMsg("บันทึกการตั้งค่าเรียบร้อยแล้ว!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            console.error("Failed to save config:", error);
            addToast("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    const handleFreeChange = (field: keyof SystemConfig['membership']['free'], value: any) => {
        if (!formConfig) return;
        setFormConfig({
            ...formConfig,
            membership: {
                ...formConfig.membership,
                free: {
                    ...formConfig.membership.free,
                    [field]: value
                }
            }
        });
    };

    const handlePremiumChange = (field: keyof SystemConfig['membership']['premium'], value: any) => {
        if (!formConfig) return;
        setFormConfig({
            ...formConfig,
            membership: {
                ...formConfig.membership,
                premium: {
                    ...formConfig.membership.premium,
                    [field]: value
                }
            }
        });
    };

    const toggleMaintenance = () => {
        if (!formConfig) return;
        setFormConfig({ ...formConfig, maintenanceMode: !formConfig.maintenanceMode });
    };

    // Skeleton Loader
    if (loading || !formConfig) {
        return (
            <AdminLayout headerTitle="Plan Configuration">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout headerTitle="จัดการสิทธิ์การใช้งาน">
            <Head>
                <title>Plans - YouOke Admin</title>
            </Head>

            {/* Header / Success Toast */}
            {successMsg && (
                <div className="fixed top-24 right-8 z-50 bg-success text-success-foreground px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right border border-success/20">
                    <Check size={20} />
                    {successMsg}
                </div>
            )}

            {/* Toolbar */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">เงื่อนไขระดับสมาชิก</h1>
                    <p className="mt-1 text-muted-foreground">ตั้งค่าขีดจำกัดและสิทธิ์ของแต่ละระดับ</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary gap-2 shadow-lg shadow-primary/25 rounded-xl text-primary-foreground px-6"
                >
                    {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={18} />}
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
            </div>

            {/* Maintenance Mode Warning */}
            <div className={cn(
                "mb-8 p-6 rounded-xl border flex items-center justify-between transition-all",
                formConfig.maintenanceMode
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-card border-border shadow-sm"
            )}>
                <div className="flex items-center gap-5">
                    <div className={cn(
                        "p-4 rounded-full",
                        formConfig.maintenanceMode ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                    )}>
                        <Radio size={28} />
                    </div>
                    <div>
                        <h3 className={cn("font-bold text-xl", formConfig.maintenanceMode ? "text-destructive" : "text-foreground")}>
                            โหมดปิดปรับปรุง (Maintenance Mode)
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {formConfig.maintenanceMode ? 'ระบบกำลังถูกปิดปรับปรุง (เฉพาะแอดมินที่เข้าใช้งานได้)' : 'ระบบเปิดใช้งานตามปกติ'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className={cn("text-sm font-medium", formConfig.maintenanceMode ? "text-destructive" : "text-muted-foreground")}>
                        {formConfig.maintenanceMode ? 'เปิด' : 'ปิด'}
                    </span>
                    <input
                        type="checkbox"
                        className="toggle toggle-error"
                        checked={formConfig.maintenanceMode}
                        onChange={toggleMaintenance}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Free Tier Editor */}
                <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
                    <div className="border-b border-border py-5 px-7">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                <Zap size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">ระดับทั่วไป (Free)</h3>
                                <p className="text-xs text-muted-foreground">สิทธิ์เริ่มต้นสำหรับทุกคน</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-7 space-y-8 flex-1">
                        {/* Limits Group */}
                        <div>
                            <label className="mb-4 block text-foreground font-bold text-sm uppercase tracking-wider">ขีดจำกัดการใช้งาน</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <span className="mb-2 block text-sm font-medium text-muted-foreground">จำนวนเพลงสูงสุด / วัน</span>
                                    <input
                                        type="number"
                                        value={formConfig.membership.free.max_daily_songs}
                                        onChange={(e) => handleFreeChange('max_daily_songs', parseInt(e.target.value))}
                                        className="input input-bordered w-full bg-background border-border focus:border-primary"
                                        placeholder="0 = ไม่จำกัด"
                                    />
                                    <span className="text-xs text-muted-foreground mt-1 block">0 = ไม่จำกัด</span>
                                </div>
                                <div>
                                    <span className="mb-2 block text-sm font-medium text-muted-foreground">ความยาวสูงสุด</span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formConfig.membership.free.max_duration_sec}
                                            onChange={(e) => handleFreeChange('max_duration_sec', parseInt(e.target.value))}
                                            className="input input-bordered w-full bg-background border-border focus:border-primary pr-12"
                                        />
                                        <span className="absolute right-4 top-3 text-xs font-bold text-muted-foreground/50 pt-0.5">SEC</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toggles Group */}
                        <div>
                            <label className="mb-4 block text-foreground font-bold text-sm uppercase tracking-wider pt-6 border-t border-border">สิทธิ์การใช้งานฟีเจอร์</label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Tv size={18} className="text-muted-foreground" />
                                        <span className="font-medium text-foreground text-sm">ใช้งาน Chromecast</span>
                                    </div>
                                    <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={formConfig.membership.free.allow_cast} onChange={(e) => handleFreeChange('allow_cast', e.target.checked)} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-muted-foreground" />
                                        <span className="font-medium text-foreground text-sm">ใช้งาน Remote Control</span>
                                    </div>
                                    <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={formConfig.membership.free.allow_remote} onChange={(e) => handleFreeChange('allow_remote', e.target.checked)} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={18} className="text-muted-foreground" />
                                        <span className="font-medium text-foreground text-sm">แสดงโฆษณา</span>
                                    </div>
                                    <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={formConfig.membership.free.show_ads} onChange={(e) => handleFreeChange('show_ads', e.target.checked)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Tier Editor */}
                <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="border-b border-border py-5 px-7">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-600 dark:text-yellow-500">
                                <Crown size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">ระดับ VIP</h3>
                                <p className="text-xs text-muted-foreground">สำหรับสมาชิกที่ชำระเงิน</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-7 space-y-8 flex-1">
                        {/* Limits Group */}
                        <div>
                            <label className="mb-4 block text-foreground font-bold text-sm uppercase tracking-wider">Usage Limits</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <span className="mb-2 block text-sm font-medium text-muted-foreground">Max Songs / Day</span>
                                    <input
                                        type="number"
                                        value={formConfig.membership.premium.max_daily_songs}
                                        onChange={(e) => handlePremiumChange('max_daily_songs', parseInt(e.target.value))}
                                        className="input input-bordered w-full bg-background border-border focus:border-yellow-500/50"
                                        placeholder="0 = Unlimited"
                                    />
                                    <span className="text-xs text-muted-foreground mt-1 block">0 = ไม่จำกัด</span>
                                </div>
                                <div>
                                    <span className="mb-2 block text-sm font-medium text-muted-foreground">Max Duration</span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formConfig.membership.premium.max_duration_sec}
                                            onChange={(e) => handlePremiumChange('max_duration_sec', parseInt(e.target.value))}
                                            className="input input-bordered w-full bg-background border-border focus:border-yellow-500/50 pr-12"
                                        />
                                        <span className="absolute right-4 top-3 text-xs font-bold text-muted-foreground/50 pt-0.5">SEC</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toggles Group */}
                        <div>
                            <label className="mb-4 block text-foreground font-bold text-sm uppercase tracking-wider pt-6 border-t border-border">สิทธิ์การใช้งานฟีเจอร์</label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:border-yellow-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Tv size={18} className="text-muted-foreground" />
                                        <span className="font-medium text-foreground text-sm">ใช้งาน Chromecast</span>
                                    </div>
                                    <input type="checkbox" className="toggle toggle-warning toggle-sm" checked={formConfig.membership.premium.allow_cast} onChange={(e) => handlePremiumChange('allow_cast', e.target.checked)} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:border-yellow-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-muted-foreground" />
                                        <span className="font-medium text-foreground text-sm">ใช้งาน Remote Control</span>
                                    </div>
                                    <input type="checkbox" className="toggle toggle-warning toggle-sm" checked={formConfig.membership.premium.allow_remote} onChange={(e) => handlePremiumChange('allow_remote', e.target.checked)} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:border-yellow-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={18} className="text-muted-foreground" />
                                        <span className="font-medium text-foreground text-sm">แสดงโฆษณา</span>
                                    </div>
                                    <input type="checkbox" className="toggle toggle-warning toggle-sm" checked={formConfig.membership.premium.show_ads} onChange={(e) => handlePremiumChange('show_ads', e.target.checked)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
