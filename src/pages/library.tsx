import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { Sidebar } from '../components/navigation/Sidebar';
import { getActiveBridgeBaseUrl } from '../stores/useAIVocalStore';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { Music, Upload, Trash2, Play } from 'lucide-react';
import StudioEditor from '../components/studio/StudioEditor';

interface LocalSong {
    id: string;
    title: string;
    artist: string;
    filename: string;
    createdAt: number;
}

export default function LocalLibraryPage() {
    const [songs, setSongs] = useState<LocalSong[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeStudioSong, setActiveStudioSong] = useState<LocalSong | null>(null);

    const fetchSongs = async () => {
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) {
                setError("ไม่สามารถเชื่อมต่อ Local Bridge ได้ กรุณาเปิดโปรแกรม Local Bridge ก่อน");
                setIsLoading(false);
                return;
            }
            
            const res = await fetch(`${baseUrl}/library`);
            if (res.ok) {
                const data = await res.json();
                setSongs(data);
                setError('');
            } else {
                setError("เกิดข้อผิดพลาดในการโหลดคลังเพลง");
            }
        } catch (e) {
            setError("ไม่สามารถเชื่อมต่อ Local Bridge ได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSongs();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) throw new Error("Local Bridge is not running");

            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
            formData.append('artist', 'Unknown Artist');

            const res = await fetch(`${baseUrl}/library/upload`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchSongs();
            } else {
                throw new Error("อัปโหลดไม่สำเร็จ");
            }
        } catch (e: any) {
            setError(e.message || "เกิดข้อผิดพลาดในการอัปโหลด");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (songId: string) => {
        if (!confirm("แน่ใจหรือไม่ว่าต้องการลบเพลงนี้?")) return;
        
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) return;
            
            const res = await fetch(`${baseUrl}/library/${songId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                setSongs(prev => prev.filter(s => s.id !== songId));
            }
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const handlePlay = (song: LocalSong) => {
        setActiveStudioSong(song);
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <Head>
                <title>คลังเพลงส่วนตัว - YouOke</title>
            </Head>

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-24 md:pb-0">
                <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                                คลังเพลงส่วนตัว
                            </h1>
                            <p className="text-gray-400 mt-2">เพิ่มไฟล์เพลงของคุณเอง และแยกเสียงร้องด้วย AI ในเครื่อง</p>
                        </div>
                        
                        <div>
                            <input 
                                type="file" 
                                accept="audio/*,video/mp4" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || !!error}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                <Upload className="w-5 h-5" />
                                {isUploading ? 'กำลังอัปโหลด...' : 'เพิ่มไฟล์เพลง'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : songs.length === 0 && !error ? (
                        <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                            <Music size={64} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-xl font-medium text-gray-300">ยังไม่มีเพลงในคลังส่วนตัว</h3>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                กดปุ่ม "เพิ่มไฟล์เพลง" ด้านบนเพื่อนำเข้าเพลง (MP3, M4A, MP4) แล้วใช้ AI แยกเสียงร้องและดนตรีได้ทันที
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {songs.map((song) => (
                                <div key={song.id} className="flex items-center gap-4 bg-gray-800/40 hover:bg-gray-800/80 p-3 rounded-xl border border-gray-700/30 transition-colors group">
                                    <div 
                                        className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center cursor-pointer flex-shrink-0 group-hover:bg-blue-600/20"
                                        onClick={() => handlePlay(song)}
                                    >
                                        <Play size={24} className="text-gray-400 group-hover:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-200 truncate">{song.title}</h4>
                                        <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(song.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="ลบเพลงนี้"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
            
            <div className="md:hidden">
                <MobileBottomNav />
            </div>

            {activeStudioSong && (
                <StudioEditor 
                    songId={activeStudioSong.id}
                    title={activeStudioSong.title}
                    artist={activeStudioSong.artist}
                    onClose={() => setActiveStudioSong(null)}
                />
            )}
        </div>
    );
}
