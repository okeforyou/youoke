import React, { useState, useEffect } from 'react';
import { useAIVocalStore } from '@/stores/useAIVocalStore';
import { CpuChipIcon, KeyIcon, ArrowTopRightOnSquareIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function AiSettingsTab() {
    const { rapidapiKey, setRapidapiKey } = useAIVocalStore();
    const [inputValue, setInputValue] = useState(rapidapiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setInputValue(rapidapiKey || '');
    }, [rapidapiKey]);

    const handleSave = () => {
        setRapidapiKey(inputValue);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CpuChipIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                        ตั้งค่าระบบ AI (AI Settings)
                    </h2>
                    <p className="text-sm font-medium text-zinc-500 mt-1">
                        จัดการเชื่อมต่อ API และตั้งค่าขั้นสูงสำหรับการแยกเสียงร้อง
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl space-y-6">
                
                {/* RapidAPI Key Section */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                            <KeyIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">เชื่อมต่อ RapidAPI (Custom API Key)</h3>
                            <p className="text-[12px] text-zinc-500">สำหรับผู้ที่ต้องการใช้งาน API ฟรีด้วยตัวเองเพื่อหลีกเลี่ยงการถูกจำกัดโควต้าส่วนกลาง</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                X-RapidAPI-Key ของคุณ
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type={showKey ? "text" : "password"} 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="ใส่ X-RapidAPI-Key ของคุณที่นี่..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                                    >
                                        {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    className="px-5 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
                                >
                                    {isSaved ? <><CheckIcon className="w-4 h-4" /> บันทึกแล้ว</> : 'บันทึก'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">วิธีการค้นหาและใช้งาน</h4>
                            <ol className="list-decimal list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                <li>
                                    สมัครสมาชิกเว็บไซต์ <a href="https://rapidapi.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">RapidAPI <ArrowTopRightOnSquareIcon className="w-3 h-3" /></a>
                                </li>
                                <li>
                                    ค้นหา API ชื่อ <strong>YouTube MP3 Audio/Video Downloader</strong> หรือ <a href="https://rapidapi.com/search/youtube-mp3-audio-video-downloader" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">คลิกที่นี่ <ArrowTopRightOnSquareIcon className="w-3 h-3" /></a>
                                </li>
                                <li>กดปุ่ม <strong>Subscribe to Test</strong> และเลือกแพ็กเกจ <strong>Basic (Free)</strong></li>
                                <li>กลับมาที่หน้า Endpoints (หรือหน้าทดสอบ API) คัดลอกรหัสตรงช่อง <code>X-RapidAPI-Key</code> มาวางที่ช่องด้านบน</li>
                                <li className="text-rose-500">
                                    <em>หมายเหตุ: คีย์ของ RapidAPI 1 คีย์สามารถใช้ได้กับทุก API แต่คุณต้องกด Subscribe ตัว API ที่เราใช้ก่อนถึงจะใช้งานได้</em>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
