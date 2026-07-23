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
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                
                {/* Local Storage Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                            <DocumentArrowDownIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">ที่เก็บไฟล์ (Local Cache)</h4>
                            <p className="text-xs font-medium text-zinc-500 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">ปัจจุบันเลือกที่: <span className="font-mono text-zinc-400">{cachePath}</span></p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSelectFolder}
                        className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-all shrink-0 self-start sm:self-center"
                    >
                        เปลี่ยนที่เก็บ
                    </button>
                </div>

                {/* Google Drive Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0">
                            <CloudArrowUpIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">เชื่อมต่อ Google Drive</h4>
                                {isDriveConnected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 text-[10px] uppercase tracking-wider font-black">
                                        เชื่อมต่อแล้ว
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-zinc-500 mt-0.5">สำรองไฟล์เพลงอัตโนมัติป้องกันข้อมูลสูญหาย</p>
                        </div>
                    </div>
                    
                    {isDriveConnected ? (
                        <button 
                            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold transition-all shrink-0 self-start sm:self-center"
                        >
                            ยกเลิก
                        </button>
                    ) : (
                        <button 
                            onClick={handleConnectDrive}
                            disabled={isConnecting}
                            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shrink-0 self-start sm:self-center disabled:opacity-50"
                        >
                            {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อคลาวด์'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
