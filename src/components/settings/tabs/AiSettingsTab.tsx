import React, { useState, useEffect } from 'react';
import { useAIVocalStore } from '@/stores/useAIVocalStore';
import { CpuChipIcon, KeyIcon, ArrowTopRightOnSquareIcon, EyeIcon, EyeSlashIcon, CheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useSystem } from '@/core/container/SystemContext';
import { getUserProfile, updateUserProfile } from '@/services/userService';

export default function AiSettingsTab() {
    const { user } = useSystem().auth();
    const { rapidapiKey, setRapidapiKey, deepgramKey, setDeepgramKey, groqKey, setGroqKey, rapidapiQuota } = useAIVocalStore();
    const [inputValue, setInputValue] = useState(rapidapiKey || '');
    const [deepgramInputValue, setDeepgramInputValue] = useState(deepgramKey || '');
    const [groqInputValue, setGroqInputValue] = useState(groqKey || '');
    const [showKey, setShowKey] = useState(false);
    const [showDeepgramKey, setShowDeepgramKey] = useState(false);
    const [showGroqKey, setShowGroqKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (user?.uid) {
            getUserProfile(user.uid, false).then(res => {
                if (res.success && res.data?.settings) {
                    if (res.data.settings.rapidapiKey) setRapidapiKey(res.data.settings.rapidapiKey);
                    if (res.data.settings.deepgramKey) setDeepgramKey(res.data.settings.deepgramKey);
                    if (res.data.settings.groqKey) setGroqKey(res.data.settings.groqKey);
                }
            });
        }
    }, [user?.uid, setRapidapiKey, setDeepgramKey, setGroqKey]);

    useEffect(() => {
        setInputValue(rapidapiKey || '');
    }, [rapidapiKey]);

    useEffect(() => {
        setDeepgramInputValue(deepgramKey || '');
    }, [deepgramKey]);

    useEffect(() => {
        setGroqInputValue(groqKey || '');
    }, [groqKey]);

    const handleSave = async () => {
        setRapidapiKey(inputValue);
        setDeepgramKey(deepgramInputValue);
        setGroqKey(groqInputValue);
        
        // Save to Firebase
        if (user?.uid) {
            try {
                const res = await getUserProfile(user.uid, false);
                const currentSettings = res.data?.settings || {};
                await updateUserProfile(user.uid, {
                    settings: { 
                        ...currentSettings, 
                        rapidapiKey: inputValue,
                        deepgramKey: deepgramInputValue,
                        groqKey: groqInputValue 
                    } as any
                });
            } catch (e) {
                console.error("Failed to save API keys to Firebase", e);
            }
        }
        
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
                        ตั้งค่าระบบ AI Vocal (AI Vocal Settings)
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
                            <p className="text-[12px] text-zinc-500">เปิดใช้งานระบบ AI แยกเสียงร้องและดนตรี (Vocal Separation) ให้ทำงานได้อย่างสมบูรณ์</p>
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
                                        name="rapidapi-key"
                                        autoComplete="new-password" 
                                        value={isMounted ? inputValue : ""}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            setRapidapiKey(e.target.value);
                                        }}
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
                                    <a href="https://rapidapi.com/search?term=YouTube%20MP3%20Audio%20Video%20Downloader" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform">
                                        👉 ค้นหา API "YouTube MP3 Audio Video Downloader"
                                    </a>
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

                {/* Deepgram Key Section */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                            <KeyIcon className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">เชื่อมต่อ Deepgram API (ถอดเนื้อเพลง)</h3>
                            <p className="text-[12px] text-zinc-500">ใช้สำหรับสร้างเนื้อเพลง (Lyrics) คาราโอเกะแบบแม่นยำรายคำ</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Deepgram API Key ของคุณ
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type={showDeepgramKey ? "text" : "password"} 
                                        name="deepgram-key"
                                        autoComplete="new-password" 
                                        value={isMounted ? deepgramInputValue : ""}
                                        onChange={(e) => {
                                            setDeepgramInputValue(e.target.value);
                                            setDeepgramKey(e.target.value);
                                        }}
                                        placeholder="ใส่ Deepgram API Key ของคุณที่นี่..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowDeepgramKey(!showDeepgramKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                                    >
                                        {showDeepgramKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">วิธีรับ Deepgram API Key</h4>
                            <ol className="list-decimal list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                <li>
                                    เข้าสู่ระบบที่ <a href="https://console.deepgram.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Deepgram Console <ArrowTopRightOnSquareIcon className="w-3 h-3" /></a> (สมัครใหม่ได้เครดิตฟรี $200)
                                </li>
                                <li>หากพบหน้าต่างสอบถามข้อมูล (Personalize your experience) <strong>สามารถกดปุ่ม Skip (ข้าม) ด้านล่างได้เลย</strong></li>
                                <li>หากระบบถามว่าต้องการใช้งานแบบไหน ให้เลือก <strong>Speech to Text</strong></li>
                                <li>ไปที่เมนู <strong>API Keys</strong> แถบด้านซ้าย</li>
                                <li>กดปุ่ม <strong>Create a New API Key</strong> สร้างคีย์ใหม่และคัดลอกมาใส่ที่ช่องด้านบน</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Groq Key Section */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                            <KeyIcon className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">เชื่อมต่อ Groq API (แก้ไขคำผิด)</h3>
                            <p className="text-[12px] text-zinc-500">สำหรับ AI ช่วยเกลาเนื้อเพลงและปรับคำให้ถูกต้อง (ฟรีและเร็วกว่า OpenAI)</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                Groq API Key ของคุณ
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type={showGroqKey ? "text" : "password"} 
                                        name="groq-key"
                                        autoComplete="new-password" 
                                        value={isMounted ? groqInputValue : ""}
                                        onChange={(e) => {
                                            setGroqInputValue(e.target.value);
                                            setGroqKey(e.target.value);
                                        }}
                                        placeholder="ใส่ Groq API Key ของคุณที่นี่..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowGroqKey(!showGroqKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                                    >
                                        {showGroqKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">วิธีรับ Groq API Key</h4>
                            <ol className="list-decimal list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                <li>
                                    เข้าสู่ระบบที่ <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Groq Console <ArrowTopRightOnSquareIcon className="w-3 h-3" /></a>
                                </li>
                                <li>กดปุ่ม <strong>Create API Key</strong> สร้างคีย์ใหม่และคัดลอกมาใส่ที่ช่องด้านบน</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Quota Section */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <ChartBarIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">ข้อมูลโควต้า (API Quota)</h3>
                            <p className="text-[12px] text-zinc-500">จำนวนครั้งที่เหลือในการแยกเสียงร้องสำหรับเดือนนี้</p>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
                        {rapidapiQuota ? (
                            <>
                                <div className="text-4xl font-black text-emerald-500 mb-2">
                                    {rapidapiQuota.remaining} <span className="text-xl text-zinc-400 font-medium">/ {rapidapiQuota.limit}</span>
                                </div>
                                <p className="text-sm text-zinc-500 font-medium">สิทธิ์คงเหลือในเดือนนี้</p>
                                
                                {/* Progress Bar */}
                                <div className="w-full max-w-xs h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-4 overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(0, Math.min(100, (rapidapiQuota.remaining / rapidapiQuota.limit) * 100))}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <div className="py-4">
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                                    ยังไม่มีข้อมูลการใช้งาน
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                    (ข้อมูลจะแสดงเมื่อคุณแยกเสียงเพลงแรกหลังจากใส่ Key)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
