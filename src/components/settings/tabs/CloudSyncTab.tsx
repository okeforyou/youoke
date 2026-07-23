import React, { useState } from 'react';
import { 
    CircleStackIcon, 
    ArrowDownTrayIcon, 
    ArrowUpTrayIcon, 
    GlobeAltIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { cn } from '@/lib/utils';

export default function CloudSyncTab() {
    const googleDriveAccessToken = useAuthStore(state => state.googleDriveAccessToken);
    const connectGoogleDrive = useAuthStore(state => state.connectGoogleDrive);
    const [isConnecting, setIsConnecting] = useState(false);
    
    // For demo purposes in this UI iteration, we'll pretend there's a last sync date
    const lastSyncDate = googleDriveAccessToken ? new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : null;

    const handleConnectDrive = async () => {
        setIsConnecting(true);
        try {
            await connectGoogleDrive();
        } catch (error) {
            console.error("Failed to connect to Google Drive:", error);
            alert("ไม่สามารถเชื่อมต่อ Google Drive ได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsConnecting(false);
        }
    };

    const isDriveConnected = !!googleDriveAccessToken;

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
                        <button className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
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
                        <button className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            เลือกไฟล์กู้คืน (.json)
                        </button>
                    </div>

                </div>
            </div>

            {/* Google Drive Sync Card */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <GlobeAltIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">การซิงค์ผ่านคลาวด์ (Google Drive)</h3>
                            <p className="text-sm font-medium text-zinc-500 mt-1">สำรองข้อมูลอัตโนมัติและเชื่อมต่อข้ามอุปกรณ์ได้ง่ายๆ</p>
                        </div>
                    </div>
                    {isDriveConnected && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold shrink-0 self-start sm:self-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            เชื่อมต่อแล้ว
                        </div>
                    )}
                </div>

                {/* Inner Content */}
                <div className="border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">เชื่อมต่อคลาวด์แล้ว (Google Drive)</h4>
                        {isDriveConnected ? (
                            <p className="text-[11px] font-medium text-zinc-500 mt-1">ซิงค์ล่าสุดเมื่อ: {lastSyncDate}</p>
                        ) : (
                            <p className="text-[11px] font-medium text-zinc-500 mt-1">ยังไม่ได้เชื่อมต่อบัญชี Google Drive</p>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {isDriveConnected ? (
                            <>
                                <button className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <ArrowPathIcon className="w-4 h-4" />
                                    ซิงค์ทันที
                                </button>
                                <button className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 border border-rose-100 dark:border-rose-500/20 text-xs font-bold transition-all flex items-center justify-center shadow-sm">
                                    ตัดการเชื่อมต่อ
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={handleConnectDrive}
                                disabled={isConnecting}
                                className={cn("w-full md:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center shadow-sm", isConnecting && "opacity-50 cursor-not-allowed")}
                            >
                                {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อบัญชี Google Drive'}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
