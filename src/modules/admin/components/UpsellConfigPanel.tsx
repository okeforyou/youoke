import { useState, useEffect } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { updateSystemConfig } from '@/services/systemConfigService';
import { useToast } from '@/context/ToastContext';
import { Sparkles, Save, Loader2 } from 'lucide-react';

export const UpsellConfigPanel = () => {
    const { config, loading: configLoading } = useSystemConfig();
    const { addToast } = useToast() || { addToast: (msg: string) => alert(msg) };

    const [saving, setSaving] = useState(false);
    const [upsell, setUpsell] = useState({
        title: '',
        subtitle: '',
        offer_text: '',
        offer_subtext: '',
        button_text: ''
    });

    useEffect(() => {
        if (config) {
            setUpsell({
                title: config.upsell?.title || "หมดโควต้าฟังเพลงวันนี้แล้ว",
                subtitle: config.upsell?.subtitle || "โควต้าสำหรับแพ็กเกจฟรีคือ 20 เพลง/วัน",
                offer_text: config.upsell?.offer_text || "ทดลองใช้ Premium ฟรี 1 เดือน!",
                offer_subtext: config.upsell?.offer_subtext || "ฟังเพลงไม่อั้น • ไม่มีโฆษณา • คิวเพลงไม่จำกัด",
                button_text: config.upsell?.button_text || "สมัครเลย (ทดลองฟรี 1 เดือน)"
            });
        }
    }, [config]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSystemConfig({
                upsell: upsell
            });
            addToast("บันทึกการตั้งค่าเรียบร้อยแล้ว");
        } catch (error) {
            console.error(error);
            addToast("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    if (configLoading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Upsell & Popup Configuration</h3>
                    <p className="text-xs text-gray-500">จัดการข้อความแจ้งเตือนเมื่อผู้ใช้หมดโควต้า</p>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-gray-100">
                {/* Form Section */}
                <div className="p-6 space-y-6 flex-1">
                    {/* Title Section */}
                    <div className="grid gap-2">
                        <label className="text-sm font-bold text-gray-700">หัวข้อหลัก (Title)</label>
                        <input
                            className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors text-gray-900"
                            value={upsell.title}
                            onChange={e => setUpsell({ ...upsell, title: e.target.value })}
                            placeholder="เช่น: หมดโควต้าฟังเพลงวันนี้แล้ว"
                        />
                    </div>

                    {/* Subtitle Section */}
                    <div className="grid gap-2">
                        <label className="text-sm font-bold text-gray-700">คำอธิบาย (Subtitle)</label>
                        <textarea
                            className="textarea textarea-bordered w-full bg-gray-50 focus:bg-white transition-colors h-20 text-base text-gray-900"
                            value={upsell.subtitle}
                            onChange={e => setUpsell({ ...upsell, subtitle: e.target.value })}
                            placeholder="เช่น: โควต้าสำหรับแพ็กเกจฟรีคือ..."
                        />
                    </div>

                    <div className="divider my-0"></div>

                    {/* Offer Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-yellow-600">โปรโมชั่นหลัก</label>
                            <input
                                className="input input-bordered w-full border-yellow-200 bg-yellow-50 focus:bg-white text-gray-900"
                                value={upsell.offer_text}
                                onChange={e => setUpsell({ ...upsell, offer_text: e.target.value })}
                                placeholder="เช่น: ทดลองใช้ Premium ฟรี 1 เดือน!"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-gray-700">รายละเอียดรอง</label>
                            <input
                                className="input input-bordered w-full bg-gray-50 focus:bg-white text-gray-900"
                                value={upsell.offer_subtext}
                                onChange={e => setUpsell({ ...upsell, offer_subtext: e.target.value })}
                                placeholder="เช่น: ฟังเพลงไม่อั้น • ไม่มีโฆษณา"
                            />
                        </div>
                    </div>

                    {/* Button Section */}
                    <div className="grid gap-2">
                        <label className="text-sm font-bold text-primary">ปุ่มกด (Button Text)</label>
                        <input
                            className="input input-bordered w-full border-primary/20 bg-primary/5 focus:bg-white font-bold text-primary"
                            value={upsell.button_text}
                            onChange={e => setUpsell({ ...upsell, button_text: e.target.value })}
                            placeholder="เช่น: สมัครเลย (ทดลองฟรี 1 เดือน)"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary gap-2 w-full sm:w-auto"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                        </button>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="p-8 bg-gray-50/50 flex-1 flex flex-col items-center justify-center min-h-[500px]">
                    <div className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live Preview (Mobile View)
                    </div>

                    {/* Mock Device / Modal Container */}
                    <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/20 overflow-hidden transform transition-all hover:scale-[1.02] duration-300">
                        {/* Decorative Background Glows */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 text-center">
                            {/* Icon Header */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6 shrink-0 ring-4 ring-red-50">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <span className="text-3xl">😢</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                                {upsell.title || "หัวข้อตัวอย่าง"}
                            </h2>

                            <p className="text-gray-500 mb-8 px-2 leading-relaxed text-sm">
                                {upsell.subtitle || "รายละเอียดตัวอย่างจะแสดงตรงนี้..."}
                            </p>

                            {/* Premium Offer Box */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 mb-8 text-left relative overflow-hidden group border border-gray-700 shadow-xl">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <div className="w-24 h-24 rotate-12 -mt-4 -mr-4 bg-white/20 rounded-full" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-400 text-yellow-900 uppercase tracking-wider">
                                            Special Offer
                                        </span>
                                        <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                                            ✨ สำหรับสมาชิกใหม่
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {upsell.offer_text || "โปรโมชั่นพิเศษ"}
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-0">
                                        {upsell.offer_subtext || "รายละเอียดโปรโมชั่น"}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2 cursor-default">
                                    <Sparkles className="w-5 h-5" />
                                    <span>{upsell.button_text || "ปุ่มดำเนินการ"}</span>
                                </button>

                                <button className="w-full py-3 rounded-xl text-gray-400 font-medium text-sm cursor-default">
                                    ไว้คราวหลัง
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="mt-6 text-xs text-gray-400 text-center max-w-xs">
                        * นี่คือตัวอย่างการแสดงผลบนหน้าจอผู้ใช้งานจริง การจัดวางอาจแตกต่างกันเล็กน้อยตามขนาดหน้าจอ
                    </p>
                </div>
            </div>
        </div>
    );
};
