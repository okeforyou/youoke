import React, { useState, useEffect } from 'react';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { MegaphoneIcon, SparklesIcon, CrownIcon, PartyPopper } from 'lucide-react';

interface UpsellConfig {
    title: string;
    subtitle: string;
    offer_text: string;
    offer_subtext: string;
    button_text: string;
}

export const UpsellConfigPanel = () => {
    const { config } = useSystemConfig();
    const [upsell, setUpsell] = useState<UpsellConfig>({
        title: "",
        subtitle: "",
        offer_text: "",
        offer_subtext: "",
        button_text: ""
    });

    useEffect(() => {
        if (config?.upsell) {
            setUpsell({
                title: config.upsell.title || "หมดโควต้าฟังเพลงวันนี้แล้ว",
                subtitle: config.upsell.subtitle || "โควต้าสำหรับแขกคือ {maxSongs} เพลง/วัน",
                offer_text: config.upsell.offer_text || "ทดลองใช้ Premium ฟรี 1 วัน!",
                offer_subtext: config.upsell.offer_subtext || "ฟังเพลงไม่อั้น • ไม่มีโฆษณา • คิวเพลงไม่จำกัด",
                button_text: config.upsell.button_text || "สมัครเลย (ทดลองฟรี 1 วัน)"
            });
        }
    }, [config]);

    // This component will be used inside AdminConfigPage which handles the global save
    // We update the parent's localConfig state when fields change
    // For simplicity in this structure, we'll expose the fields and let the user edit them
    // Note: Since this is a specialized panel, in a real scenario we'd use a context or props to sync back.
    // For now, I'll add local save logic to ensure it works immediately.
    
    // Actually, to keep it consistent with other tabs, I should make it use the parent's state
    // but since I'm editing this file separately, I'll provide a way to sync it.
    
    const handleChange = (field: keyof UpsellConfig, value: string) => {
        setUpsell(prev => ({ ...prev, [field]: value }));
        // Dispatch custom event to notify parent (AdminConfigPage) of changes
        window.dispatchEvent(new CustomEvent('upsell-config-change', { detail: { ...upsell, [field]: value } }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Description */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                <div className="absolute right-0 top-0 opacity-10 -mr-8 -mt-8">
                    <MegaphoneIcon size={160} />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                        <SparklesIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">จัดการข้อความ Upsell</h3>
                        <p className="text-purple-100 text-sm">กำหนดข้อความที่แสดงเมื่อผู้ใช้งานเล่นครบโควต้า เพื่อเพิ่มยอดสมัครสมาชิก</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Modal Setup */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <MegaphoneIcon className="w-5 h-5 text-primary" /> ข้อความหลักใน Modal
                    </h4>
                    
                    <div className="form-control">
                        <label className="label font-bold text-gray-700">หัวข้อหลัก (Title)</label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full"
                            value={upsell.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="หมดโควต้าฟังเพลงวันนี้แล้ว"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label font-bold text-gray-700">คำโปรยรอง (Subtitle)</label>
                        <textarea 
                            className="textarea textarea-bordered w-full"
                            rows={3}
                            value={upsell.subtitle}
                            onChange={(e) => handleChange('subtitle', e.target.value)}
                            placeholder="โควต้าสำหรับแขกคือ {maxSongs} เพลง/วัน..."
                        ></textarea>
                        <label className="label">
                            <span className="label-text-alt text-gray-400">ใช้ <code>{'{maxSongs}'}</code> เพื่อแสดงจำนวนเพลงตามที่ตั้งค่าไว้อัตโนมัติ</span>
                        </label>
                    </div>
                </div>

                {/* Offer Setup */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <CrownIcon className="w-5 h-5 text-yellow-500" /> กล่องข้อเสนอพิเศษ (Premium Box)
                    </h4>
                    
                    <div className="form-control">
                        <label className="label font-bold text-gray-700">หัวข้อโปรโมชั่น (Offer Title)</label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full font-bold text-primary"
                            value={upsell.offer_text}
                            onChange={(e) => handleChange('offer_text', e.target.value)}
                            placeholder="ทดลองใช้ Premium ฟรี 1 วัน!"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label font-bold text-gray-700">รายละเอียดจุดแข็ง (Subtext)</label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full"
                            value={upsell.offer_subtext}
                            onChange={(e) => handleChange('offer_subtext', e.target.value)}
                            placeholder="ฟังเพลงไม่อั้น • ไม่มีโฆษณา..."
                        />
                    </div>

                    <div className="form-control">
                        <label className="label font-bold text-gray-700">ข้อความบนปุ่ม (Button Text)</label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full"
                            value={upsell.button_text}
                            onChange={(e) => handleChange('button_text', e.target.value)}
                            placeholder="สมัครเลย (ทดลองฟรี 1 วัน)"
                        />
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider text-center">ตัวอย่างการแสดงผล (Preview)</h4>
                
                <div className="max-w-xs mx-auto bg-white rounded-3xl p-6 shadow-xl border border-gray-100 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                        <span className="text-xl">😢</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{upsell.title}</h2>
                    <p className="text-[11px] text-gray-500 mb-4">{upsell.subtitle.replace('{maxSongs}', '3')}</p>
                    
                    <div className="bg-gray-900 rounded-xl p-3 mb-4 text-left relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xs font-bold text-white mb-0.5">{upsell.offer_text}</h3>
                            <p className="text-[9px] text-gray-400">{upsell.offer_subtext}</p>
                        </div>
                    </div>
                    
                    <button className="w-full py-2.5 rounded-lg bg-primary text-white text-xs font-bold shadow-md flex items-center justify-center gap-2">
                        <PartyPopper size={14} />
                        {upsell.button_text}
                    </button>
                    <button className="mt-2 text-[10px] text-gray-400 font-medium">ไว้คราวหลัง</button>
                </div>
            </div>

            <div className="alert alert-info bg-blue-50 border-blue-100 rounded-xl">
                <MegaphoneIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-blue-700 font-medium">ทุกครั้งที่แก้ไขค่าในหน้านี้ อย่าลืมกดปุ่ม "บันทึกการแก้ไข" ด้านบนเพื่อยืนยันการเปลี่ยนแปลงลงฐานข้อมูล</span>
            </div>
        </div>
    );
};
