import React, { useState, useEffect } from 'react';
import { FolderIcon, CloudArrowUpIcon, DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/useAuthStore';

export default function CloudSyncTab() {
    const [cachePath, setCachePath] = useState('กำลังโหลด...');
    
    // Get state and actions from AuthStore
    const googleDriveAccessToken = useAuthStore(state => state.googleDriveAccessToken);
    const connectGoogleDrive = useAuthStore(state => state.connectGoogleDrive);
    const [isConnecting, setIsConnecting] = useState(false);

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

    const handleSelectFolder = () => {
        alert("กำลังพัฒนา: ฟีเจอร์เชื่อมต่อ Backend เลือกระบุที่เก็บไฟล์ใน Phase 3");
    };

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
        <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl">

            {/* Local Storage Card */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                        <DocumentArrowDownIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">ที่เก็บไฟล์ (Local Cache)</h4>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5">เลือกที่เก็บไฟล์เพลงออฟไลน์</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 w-full flex items-center px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <FolderIcon className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">
                            {cachePath}
                        </span>
                    </div>
                    <button 
                        onClick={handleSelectFolder}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 shrink-0 shadow-sm"
                    >
                        เปลี่ยนโฟลเดอร์
                    </button>
                </div>
            </div>

            {/* Google Drive Card */}
            <div className={`rounded-3xl border p-4 sm:p-5 transition-colors shadow-sm ${isDriveConnected ? 'bg-primary/5 border-primary/20' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0">
                            <CloudArrowUpIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">สำรองข้อมูลขึ้นคลาวด์</h4>
                                {isDriveConnected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] uppercase tracking-wider font-black">
                                        เชื่อมต่อแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">สำรองไฟล์ไปยัง Google Drive ป้องกันข้อมูลสูญหาย</p>
                        </div>
                    </div>
                    
                    {isDriveConnected ? (
                        <button 
                            className="px-5 py-2.5 rounded-xl border border-primary/20 bg-white dark:bg-zinc-950 text-primary hover:bg-primary/5 text-xs font-bold transition-all shrink-0 w-full sm:w-auto shadow-sm"
                        >
                            ยกเลิกเชื่อมต่อ
                        </button>
                    ) : (
                        <button 
                            onClick={handleConnectDrive}
                            disabled={isConnecting}
                            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shrink-0 w-full sm:w-auto disabled:opacity-50 shadow-sm"
                        >
                            {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อตอนนี้'}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}
