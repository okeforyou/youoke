import React, { useState, useEffect } from 'react';
import { FolderIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export default function AIVocalSettingsTab() {
    const [cachePath, setCachePath] = useState('กำลังโหลด...');

    useEffect(() => {
        fetch('http://127.0.0.1:5050/config')
            .then(res => res.json())
            .then(data => {
                if (data.cache_dir) {
                    setCachePath(data.cache_dir);
                }
            })
            .catch(err => {
                setCachePath('ไม่สามารถเชื่อมต่อ YouOke Plugin ได้');
            });
    }, []);

    // This will be implemented in Phase 3
    const handleSelectFolder = () => {
        alert("กำลังพัฒนา: ฟีเจอร์เชื่อมต่อ Backend เลือกระบุที่เก็บไฟล์ใน Phase 3");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">AI Vocal</h2>
                <p className="text-sm font-bold text-zinc-500 mt-2">ตั้งค่าระบบแยกเสียงร้องอัจฉริยะ</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-5 h-5" /> ที่เก็บไฟล์เพลง (Cache Directory)
                </h3>
                
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                        เลือกโฟลเดอร์สำหรับเก็บไฟล์เพลงที่แยกเสียงแล้ว (.m4a) <br/>
                        <span className="text-xs text-zinc-400 font-medium">ปัจจุบันเพลงนึงจะใช้พื้นที่ประมาณ 5-10 MB</span>
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex items-center px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                            <FolderIcon className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300 truncate font-mono">
                                {cachePath}
                            </span>
                        </div>
                        <button 
                            onClick={handleSelectFolder}
                            className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-black transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        >
                            เลือกโฟลเดอร์...
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
