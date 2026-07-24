import React, { useRef, useState } from 'react';
import { 
    CircleStackIcon, 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon, 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function CloudSyncTab() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = () => {
        try {
            const playerState = localStorage.getItem('youoke-player-storage-v3');
            const mixerState = localStorage.getItem('youoke-mixer-storage');
            const aiVocalState = localStorage.getItem('youoke-ai-vocal');

            const backupData = {
                version: 1,
                timestamp: new Date().toISOString(),
                data: {
                    player: playerState ? JSON.parse(playerState) : null,
                    mixer: mixerState ? JSON.parse(mixerState) : null,
                    aiVocal: aiVocalState ? JSON.parse(aiVocalState) : null,
                }
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `youoke-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export error:', error);
            alert('เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูล');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);

            if (!backupData.data || (!backupData.data.player && !backupData.data.mixer)) {
                throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');
            }

            if (window.confirm('ข้อมูลเดิมของคุณจะถูกแทนที่ด้วยข้อมูลจากไฟล์นี้ คุณแน่ใจหรือไม่?')) {
                if (backupData.data.player) {
                    localStorage.setItem('youoke-player-storage-v3', JSON.stringify(backupData.data.player));
                }
                if (backupData.data.mixer) {
                    localStorage.setItem('youoke-mixer-storage', JSON.stringify(backupData.data.mixer));
                }
                if (backupData.data.aiVocal) {
                    localStorage.setItem('youoke-ai-vocal', JSON.stringify(backupData.data.aiVocal));
                }
                
                alert('นำเข้าข้อมูลสำเร็จ ระบบจะทำการรีโหลดเพื่อใช้งานข้อมูลใหม่');
                window.location.reload();
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล โปรดตรวจสอบไฟล์ .json');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Local Backup Card */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <CircleStackIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">สำรองและกู้คืนข้อมูล (ออฟไลน์)</h3>
                        <p className="text-sm font-medium text-zinc-500 mt-1">เก็บข้อมูลทั้งหมดของคุณไว้อย่างปลอดภัยในเครื่อง</p>
                    </div>
                </div>

                {/* Inner Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Export */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <ArrowDownTrayIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-4" />
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">ดาวน์โหลดข้อมูล</h4>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-6">
                                รวบรวมการตั้งค่า คิวเพลง และข้อมูลเพลย์ลิสต์ทั้งหมด บีบอัดเป็นไฟล์ .json
                            </p>
                        </div>
                        <button 
                            onClick={handleExport}
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            เริ่มดาวน์โหลด
                        </button>
                    </div>

                    {/* Import */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <ArrowUpTrayIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-4" />
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">นำเข้าข้อมูล</h4>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-6">
                                คำเตือน: ข้อมูลที่มีอยู่ในระบบปัจจุบันจะถูกเขียนทับด้วยข้อมูลจากไฟล์ทั้งหมด
                            </p>
                        </div>
                        <input 
                            type="file" 
                            accept=".json"
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button 
                            onClick={handleImportClick}
                            disabled={isImporting}
                            className={cn(
                                "w-full py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                isImporting && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            {isImporting ? 'กำลังนำเข้า...' : 'เลือกไฟล์กู้คืน (.json)'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
