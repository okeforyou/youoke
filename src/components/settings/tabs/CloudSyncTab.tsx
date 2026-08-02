import React, { useState, useEffect } from 'react';
import { 
    FolderIcon,
    GlobeAltIcon,
    ArrowPathIcon,
    FolderOpenIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { cn } from '@/lib/utils';
import { useToast } from "@/context/ToastContext";

export default function CloudSyncTab() {
    const { addToast } = useToast() || { addToast: (msg: string) => window.alert(msg) };
    const googleDriveAccessToken = useAuthStore(state => state.googleDriveAccessToken);
    const connectGoogleDrive = useAuthStore(state => state.connectGoogleDrive);
    const [isConnecting, setIsConnecting] = useState(false);
    const [storagePath, setStoragePath] = useState<string | null>(null);
    
    // For demo purposes in this UI iteration, we'll pretend there's a last sync date
    const lastSyncDate = googleDriveAccessToken ? new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : null;

    const handleConnectDrive = async () => {
        setIsConnecting(true);
        try {
            await connectGoogleDrive();
        } catch (error) {
            console.error("Failed to connect to Google Drive:", error);
            addToast("ไม่สามารถเชื่อมต่อ Google Drive ได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        // Fetch current storage config from local bridge
        const fetchConfig = async () => {
            try {
                let res = await fetch("http://127.0.0.1:5050/config").catch(() => null);
                if (!res || !res.ok) {
                    res = await fetch("http://127.0.0.1:8055/config").catch(() => null);
                }
                if (res && res.ok) {
                    const data = await res.json();
                    if (data.custom_storage_path) {
                        setStoragePath(data.custom_storage_path);
                    }
                }
            } catch(e) {
                console.log("Could not fetch bridge config", e);
            }
        };
        fetchConfig();
    }, []);

    const handleSelectFolder = async () => {
        try {
            // Use native bridge to open folder picker
            let res = await fetch("http://127.0.0.1:5050/select_folder").catch(() => null);
            if (!res || !res.ok) {
                res = await fetch("http://127.0.0.1:8055/select_folder").catch(() => null);
            }
            if (res && res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.path) {
                    setStoragePath(data.path);
                    addToast(`ตั้งค่าที่เก็บไฟล์เป็นโฟลเดอร์ "${data.path}" สำเร็จ\nเพลงที่แยกเสียงหลังจากนี้จะถูกบันทึกที่นี่โดยอัตโนมัติ`);
                } else if (data.status === 'error') {
                    addToast(`ไม่สามารถเปิดหน้าต่างเลือกโฟลเดอร์ได้: ${data.message || 'Unknown error'}`);
                }
            } else {
                addToast('ไม่สามารถเชื่อมต่อ YouOke Server ได้ กรุณาตรวจสอบว่าโปรแกรมทำงานอยู่');
            }
        } catch (err) {
            console.error('Error selecting folder:', err);
        }
    };

    const isDriveConnected = !!googleDriveAccessToken;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* Storage Location Card */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FolderIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">ที่เก็บไฟล์เพลง (AI Vocal)</h3>
                        <p className="text-sm font-medium text-zinc-500 mt-1">เลือกโฟลเดอร์ในเครื่องของคุณสำหรับเก็บไฟล์ที่ผ่านการแยกเสียงแล้ว</p>
                    </div>
                </div>

                {/* Inner Content */}
                <div className="border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">โฟลเดอร์ปัจจุบัน</h4>
                        <p className="text-[11px] font-medium text-zinc-500 mt-1">
                            {storagePath ? `โฟลเดอร์: ${storagePath}` : 'ยังไม่ได้ตั้งค่า (จะใช้พื้นที่ชั่วคราวของเบราว์เซอร์)'}
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleSelectFolder}
                        className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <FolderOpenIcon className="w-4 h-4" />
                        เลือกที่เก็บไฟล์
                    </button>
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
                            <p className="text-sm font-medium text-zinc-500 mt-1">สำรองไฟล์เพลงและการตั้งค่าเพื่อใช้งานข้ามอุปกรณ์</p>
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
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">บัญชีคลาวด์</h4>
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
