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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">พื้นที่จัดเก็บและคลาวด์</h2>
                <p className="text-sm font-bold text-zinc-500 mt-2">จัดการไฟล์เพลงและการสำรองข้อมูล (Backup)</p>
            </div>

            {/* Local Storage Card */}
            <div className="space-y-4">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-5 h-5" /> ที่เก็บไฟล์ในเครื่อง (Local Cache)
                </h3>
                
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border-2 border-zinc-900 dark:border-zinc-800 space-y-4">
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                        เลือกโฟลเดอร์สำหรับเก็บไฟล์เพลงที่แยกเสียงแล้ว (.m4a) <br/>
                        <span className="text-xs text-zinc-400 font-medium">ปัจจุบันเพลงนึงจะใช้พื้นที่ประมาณ 5-10 MB</span>
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex items-center px-4 py-3 bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl overflow-hidden">
                            <FolderIcon className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300 truncate font-mono">
                                {cachePath}
                            </span>
                        </div>
                        <button 
                            onClick={handleSelectFolder}
                            className="px-6 py-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm font-black transition-all active:scale-95 whitespace-nowrap hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        >
                            เปลี่ยนโฟลเดอร์
                        </button>
                    </div>
                </div>
            </div>

            {/* Google Drive Card */}
            <div className="space-y-4">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <CloudArrowUpIcon className="w-5 h-5" /> สำรองข้อมูลขึ้นคลาวด์ (Google Drive)
                </h3>
                
                <div className={`p-6 rounded-3xl border-2 space-y-4 transition-colors ${isDriveConnected ? 'bg-primary/5 border-primary' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-800'}`}>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                เชื่อมต่อบัญชี Google Drive
                                {isDriveConnected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-wider font-black">
                                        <CheckCircleIcon className="w-3 h-3" /> เชื่อมต่อแล้ว
                                    </span>
                                )}
                            </p>
                            <p className="text-xs font-bold text-zinc-500 mt-2">
                                สำรองไฟล์เพลงที่แยกเสียงแล้วไปยัง Google Drive อัตโนมัติ เพื่อป้องกันข้อมูลสูญหายและประหยัดพื้นที่เครื่อง
                            </p>
                        </div>
                        <div className="shrink-0">
                            {isDriveConnected ? (
                                <button 
                                    className="px-4 py-2 rounded-xl border-2 border-primary bg-white dark:bg-zinc-950 text-primary text-sm font-black transition-all hover:bg-primary/10 whitespace-nowrap"
                                >
                                    ตัดการเชื่อมต่อ
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConnectDrive}
                                    disabled={isConnecting}
                                    className="px-4 py-2 rounded-xl border-2 border-primary bg-primary text-white text-sm font-black transition-all hover:bg-primary/90 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อตอนนี้'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
