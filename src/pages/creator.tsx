import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { Sidebar } from '../components/navigation/Sidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { getActiveBridgeBaseUrl } from '../stores/useAIVocalStore';
import { Mic, Key, Play, Pause, Save, Download, Video, Music } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface CachedSong {
    video_id: string;
    title: string;
    mode: string;
    size_mb: number;
    created_at: number;
}

interface LyricWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

export default function CreatorStudioPage() {
    const [apiKey, setApiKey] = useState('');
    const [songs, setSongs] = useState<CachedSong[]>([]);
    const [selectedSong, setSelectedSong] = useState<CachedSong | null>(null);
    const [lyrics, setLyrics] = useState<LyricWord[]>([]);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState('');
    
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const wsRegions = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Load deepgram API key from local storage
        const saved = localStorage.getItem('deepgram_api_key');
        if (saved) setApiKey(saved);
        
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) return;
            const res = await fetch(`${baseUrl}/cache/list`);
            if (res.ok) {
                const data = await res.json();
                setSongs(data.results || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveApiKey = () => {
        localStorage.setItem('deepgram_api_key', apiKey);
        alert('API Key saved!');
    };

    const handleSelectSong = async (song: CachedSong) => {
        setSelectedSong(song);
        setLyrics([]);
        setError('');
        
        if (wavesurfer.current) {
            wavesurfer.current.destroy();
        }

        const baseUrl = await getActiveBridgeBaseUrl();
        if (!baseUrl) return;

        // Initialize WaveSurfer
        if (containerRef.current) {
            const ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: '#4F46E5',
                progressColor: '#818CF8',
                cursorColor: '#10B981',
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
                height: 120,
                url: `${baseUrl}/files/${song.video_id}/vocals.m4a`
            });
            
            const wsReg = ws.registerPlugin(RegionsPlugin.create());
            
            ws.on('play', () => setIsPlaying(true));
            ws.on('pause', () => setIsPlaying(false));
            
            wsReg.on('region-updated', (region: any) => {
                // Update lyrics state when user drags/resizes a region
                setLyrics(prev => {
                    const newLyrics = [...prev];
                    const idx = newLyrics.findIndex(l => l.word === region.content.innerText);
                    if (idx !== -1) {
                        newLyrics[idx].start = region.start;
                        newLyrics[idx].end = region.end;
                    }
                    return newLyrics;
                });
            });

            wavesurfer.current = ws;
            wsRegions.current = wsReg;
        }
    };

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const handleTranscribe = async () => {
        if (!selectedSong) return;
        if (!apiKey) {
            setError('Please enter your Deepgram API Key first.');
            return;
        }

        setIsTranscribing(true);
        setError('');
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            const res = await fetch(`${baseUrl}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: selectedSong.video_id,
                    api_key: apiKey,
                    provider: 'deepgram'
                })
            });

            if (res.ok) {
                const data = await res.json();
                setLyrics(data.words);
                
                // Add regions to wavesurfer
                if (wsRegions.current) {
                    wsRegions.current.clearRegions();
                    data.words.forEach((word: LyricWord) => {
                        wsRegions.current.addRegion({
                            start: word.start,
                            end: word.end,
                            content: word.word,
                            color: 'rgba(59, 130, 246, 0.4)', // bg-blue-500 with opacity
                            drag: true,
                            resize: true
                        });
                    });
                }
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Transcription failed');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleExport = async () => {
        alert("Exporting MP4 (FFmpeg process will run on Local Bridge) - Coming in next step!");
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <Head><title>Creator Studio - YouOke</title></Head>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-24 md:pb-0">
                <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                YouOke Creator Studio
                            </h1>
                            <p className="text-gray-400 mt-2">สร้างไฟล์คาราโอเกะพร้อมเนื้อร้อง และ Export เป็นไฟล์วิดีโอ (MP4)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: API & Song Selection */}
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Key size={20} className="text-yellow-400" />
                                    1. Deepgram API Key
                                </h3>
                                <input 
                                    type="password" 
                                    value={apiKey} 
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="Enter Deepgram API Key"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 mb-3"
                                />
                                <button onClick={handleSaveApiKey} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm font-medium transition-colors">
                                    บันทึก Key (ในเบราว์เซอร์)
                                </button>
                                <p className="text-xs text-gray-500 mt-3">
                                    เราใช้ API จากผู้ใช้งานเองเพื่อความรวดเร็วและเป็นส่วนตัว (ได้เครดิตฟรี $200 จาก Deepgram)
                                </p>
                            </div>

                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Music size={20} className="text-blue-400" />
                                    2. เลือกเพลงที่ต้องการทำ
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {songs.map(song => (
                                        <div 
                                            key={song.video_id}
                                            onClick={() => handleSelectSong(song)}
                                            className={`p-3 rounded-xl cursor-pointer border transition-colors ${
                                                selectedSong?.video_id === song.video_id 
                                                ? 'bg-purple-600/20 border-purple-500' 
                                                : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                                            }`}
                                        >
                                            <p className="font-medium text-sm truncate">{song.title}</p>
                                        </div>
                                    ))}
                                    {songs.length === 0 && <p className="text-gray-500 text-sm">ไม่มีเพลงในคลัง (แยกเสียงเพลงก่อนที่เมนูคลังเพลง)</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Editor & Timeline */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 min-h-[400px] flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium flex items-center gap-2">
                                        <Mic size={20} className="text-emerald-400" />
                                        3. ไทม์ไลน์เนื้อเพลง (MIDI-like Editor)
                                    </h3>
                                    <button 
                                        onClick={handleTranscribe}
                                        disabled={isTranscribing || !selectedSong}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        {isTranscribing ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : <Mic size={16} />}
                                        {isTranscribing ? 'กำลังถอดเสียงร้อง...' : 'สร้างเนื้อเพลงอัตโนมัติ (AI)'}
                                    </button>
                                </div>

                                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4 text-sm border border-red-500/30">{error}</div>}

                                <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-700 relative overflow-hidden flex flex-col">
                                    {!selectedSong && (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10 bg-gray-900/80">
                                            กรุณาเลือกเพลงจากเมนูด้านซ้าย
                                        </div>
                                    )}
                                    
                                    {/* WaveSurfer Container */}
                                    <div ref={containerRef} className="w-full mb-4"></div>
                                    
                                    <div className="flex justify-center mb-4">
                                        <button 
                                            onClick={togglePlay}
                                            disabled={!selectedSong}
                                            className="w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                                        >
                                            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                                        </button>
                                    </div>

                                    {/* Lyrics List */}
                                    <div className="mt-4 max-h-[250px] overflow-y-auto">
                                        <h4 className="text-gray-400 text-sm mb-2">เนื้อเพลง (ลากยืดหดบนคลื่นเสียงด้านบนเพื่อปรับแก้จังหวะ)</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {lyrics.map((l, i) => (
                                                <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-sm border border-gray-700 hover:border-purple-500 cursor-pointer">
                                                    {l.word}
                                                </span>
                                            ))}
                                            {lyrics.length === 0 && selectedSong && !isTranscribing && (
                                                <p className="text-gray-500 text-sm italic">กดปุ่ม "สร้างเนื้อเพลงอัตโนมัติ" เพื่อเริ่มต้น</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Export Section */}
                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Video size={20} className="text-pink-400" />
                                    4. ส่งออกวิดีโอ (Export)
                                </h3>
                                
                                <div className="bg-amber-900/30 border border-amber-500/30 p-4 rounded-xl mb-4 text-sm text-amber-200">
                                    <strong>⚠️ คำเตือนเรื่องลิขสิทธิ์:</strong> 
                                    คุณเป็นผู้รับผิดชอบต่อไฟล์สื่อและเนื้อหาที่ถูกส่งออกทั้งหมด หากนำไฟล์วิดีโอนี้ไปอัปโหลดลงในแพลตฟอร์มสาธารณะ (เช่น YouTube) อาจมีการตรวจสอบลิขสิทธิ์ด้วยระบบ Content ID โปรแกรมนี้เป็นเพียงเครื่องมือสร้างสื่อส่วนบุคคลเท่านั้น
                                </div>

                                <button 
                                    onClick={handleExport}
                                    disabled={lyrics.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-900/20 transition-all"
                                >
                                    <Download size={24} />
                                    ส่งออกวิดีโอคาราโอเกะ (.mp4)
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <div className="md:hidden"><MobileBottomNav /></div>
        </div>
    );
}
