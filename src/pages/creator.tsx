import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getActiveBridgeBaseUrl, useAIVocalStore } from '../stores/useAIVocalStore';
import { 
    Mic, Play, Pause, Save, Download, Video, Music, 
    ArrowLeft, Settings, Maximize, Type, UploadCloud, FileAudio,
    Sparkles, FileText, Plus, X, ZoomIn, ZoomOut, Link, RefreshCw, GripVertical, Square, Target
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { clsx } from 'clsx';
import { useUIStore } from '@/stores/useUIStore';
import { useToast } from "@/context/ToastContext";
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useWikiLyricsStore } from '@/modules/player/stores/useWikiLyricsStore';
import { useLyricsStore } from '@/modules/player/stores/useLyricsStore';

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
    confidence?: number;
}

export default function CreatorStudioPage() {
    const { addToast } = useToast() || { addToast: (msg: string) => window.alert(msg) };
    const router = useRouter();
    const { deepgramKey } = useAIVocalStore();
    const { user } = useAuthStore();
    
    // States
    const [songs, setSongs] = useState<CachedSong[]>([]);
    const [selectedSong, setSelectedSong] = useState<CachedSong | null>(null);
    const [lyrics, setLyrics] = useState<LyricWord[]>([]);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState('');
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [ytUrl, setYtUrl] = useState('');
    const [rawText, setRawText] = useState('');
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [lyricPos, setLyricPos] = useState({ x: 50, y: 85 });
    const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
    const overlayDragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const backingAudioRef = useRef<HTMLAudioElement | null>(null);

    // Timeline Drag & Block States (from Studio)
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [dragAction, setDragAction] = useState<'move' | 'resize-right' | 'resize-left' | null>(null);
    const [startX, setStartX] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [startEndTime, setStartEndTime] = useState(0);
    const [initialDragLyrics, setInitialDragLyrics] = useState<LyricWord[]>([]);
    const [isRippleEdit, setIsRippleEdit] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(0);

    const extractYoutubeVideoId = (url: string) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url.trim();
    };

    const handleGoToWikiStudio = () => {
        const videoId = extractYoutubeVideoId(ytUrl);
        if (!videoId) {
            addToast("กรุณากรอกลิงก์ YouTube หรือ Video ID ที่ถูกต้อง");
            return;
        }
        // Instead of redirecting to /studio, load it in Creator!
        const mockSong: CachedSong = {
            video_id: videoId,
            title: `YouTube Video: ${videoId}`,
            mode: 'youtube',
            size_mb: 0,
            created_at: Date.now()
        };
        setSelectedSong(mockSong);
        // Automatically import lyrics if available
        useLyricsStore.getState().fetchLyrics(videoId, mockSong.title).then(() => {
            const cloudLyrics = useLyricsStore.getState().lyrics;
            if (cloudLyrics && cloudLyrics.length > 0) {
                const converted = cloudLyrics.map((line: any) => {
                    const duration = line.endTime ? (line.endTime - line.time) : 3.0;
                    return { word: line.text, start: line.time, end: line.endTime || (line.time + duration), confidence: 1.0 };
                });
                setLyrics(converted);
            }
        });
    };
    
    // Font settings
    const [fontSize, setFontSize] = useState(48);
    const [fontOutline, setFontOutline] = useState(3);
    const [fontFamily, setFontFamily] = useState('Sukhumvit Set');
    const [fillColor, setFillColor] = useState('#ffffff');
    const [activeColor, setActiveColor] = useState('#E50914');
    const [activeTab, setActiveTab] = useState<'properties' | 'lyrics'>('properties');
    const [audioTrack, setAudioTrack] = useState<'original' | 'vocals' | 'instrumental'>('original');
    const [zoom, setZoom] = useState(80); // px per second
    
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const wsRegions = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingIndex, setRecordingIndex] = useState(0);

    useEffect(() => {
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

    // Auto-select song if '?edit=videoId' is passed
    useEffect(() => {
        if (router.isReady && router.query.edit && songs.length > 0 && !selectedSong) {
            const editId = router.query.edit as string;
            const match = songs.find(s => s.video_id === editId);
            if (match) {
                handleSelectSong(match);
                // Remove the query param so refreshing doesn't force re-select
                router.replace('/creator', undefined, { shallow: true });
            } else {
                addToast(`ไม่พบเพลง (ID: ${editId}) ใน Local Bridge`);
            }
        }
    }, [router.isReady, router.query.edit, songs, selectedSong, router]);

    const handleSelectSong = async (song: CachedSong) => {
        // Clone the object so React sees it as a new state and forces re-render if it's the same song
        setSelectedSong({...song});
        
        // Auto-load previously extracted/edited AI lyrics from localStorage
        let initialLyrics: LyricWord[] = [];
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(`ai_lyrics_${song.video_id}`);
            if (cached) {
                try {
                    initialLyrics = JSON.parse(cached);
                } catch(e) {}
            }
        }
        setLyrics(initialLyrics);
        setError('');
        setShowLibraryModal(false);
        
        if (wavesurfer.current) {
            wavesurfer.current.destroy();
            wavesurfer.current = null;
        }
        if (wsRegions.current) {
            wsRegions.current = null;
        }

        const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) return;

        // Initialize WaveSurfer after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.innerHTML = ''; // Force clear container just in case
                
                // WaveSurfer always visualizes and plays vocals stem
                const url = `${baseUrl}/files/${song.video_id}/vocals.m4a`;
                
                // Backing audio element always loads instrumental stem in the background
                if (backingAudioRef.current) {
                    backingAudioRef.current.src = `${baseUrl}/files/${song.video_id}/no_vocals.m4a`;
                    backingAudioRef.current.load();
                }

                const ws = WaveSurfer.create({
                    container: containerRef.current,
                    waveColor: '#6366f1', // Indigo
                    progressColor: '#a855f7', // Purple
                    cursorColor: '#f43f5e', // Rose
                    barWidth: 2,
                    barGap: 2,
                    barRadius: 2,
                    height: 100,
                    url,
                    normalize: true,
                    minPxPerSec: zoom,
                });
                
                const wsReg = ws.registerPlugin(RegionsPlugin.create());
                
                ws.on('play', () => {
                    setIsPlaying(true);
                    if (backingAudioRef.current) {
                        backingAudioRef.current.currentTime = ws.getCurrentTime();
                        // Set volumes based on current audioTrack state
                        if (audioTrack === 'vocals') {
                            ws.setVolume(1.0);
                            backingAudioRef.current.volume = 0.0;
                        } else if (audioTrack === 'instrumental') {
                            ws.setVolume(0.0);
                            backingAudioRef.current.volume = 1.0;
                        } else {
                            ws.setVolume(1.0);
                            backingAudioRef.current.volume = 1.0;
                        }
                        backingAudioRef.current.play().catch(e => console.error(e));
                    }
                });
                ws.on('pause', () => {
                    setIsPlaying(false);
                    if (backingAudioRef.current) {
                        backingAudioRef.current.pause();
                    }
                });
                ws.on('timeupdate', (time) => {
                    setCurrentTime(time);
                    if (backingAudioRef.current) {
                        const drift = Math.abs(backingAudioRef.current.currentTime - time);
                        if (drift > 0.025) {
                            backingAudioRef.current.currentTime = time;
                        }
                    }
                });
                ws.on('ready', () => {
                    setDuration(ws.getDuration());
                });
                ws.on('error', (err: any) => {
                    console.error("WaveSurfer error:", err);
                    setError("ไม่สามารถโหลดไฟล์เสียงได้: " + (err.message || err));
                });
                
                wsReg.on('region-updated', (region: any) => {
                    setLyrics(prev => {
                        const newLyrics = [...prev];
                        if (region.id && region.id.startsWith('lyric-')) {
                            const idx = parseInt(region.id.split('-')[1]);
                            if (!isNaN(idx) && newLyrics[idx]) {
                                newLyrics[idx].start = region.start;
                                newLyrics[idx].end = region.end;
                            }
                        }
                        return newLyrics;
                    });
                });

                wavesurfer.current = ws;
                wsRegions.current = wsReg;
            }
        }, 100);
    };

    // Adjust volumes instantly without reloading WaveSurfer when audioTrack changes
    useEffect(() => {
        if (wavesurfer.current) {
            if (audioTrack === 'vocals') {
                wavesurfer.current.setVolume(1.0);
                if (backingAudioRef.current) backingAudioRef.current.volume = 0.0;
            } else if (audioTrack === 'instrumental') {
                wavesurfer.current.setVolume(0.0);
                if (backingAudioRef.current) backingAudioRef.current.volume = 1.0;
            } else { // original/mix
                wavesurfer.current.setVolume(1.0);
                if (backingAudioRef.current) backingAudioRef.current.volume = 1.0;
            }
        }
    }, [audioTrack]);

    // Drag position event listener for preview lyrics
    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!isDraggingOverlay || !videoContainerRef.current) return;
            const rect = videoContainerRef.current.getBoundingClientRect();
            const pointerPctX = ((e.clientX - rect.left) / rect.width) * 100;
            const pointerPctY = ((e.clientY - rect.top) / rect.height) * 100;
            
            const targetX = pointerPctX - overlayDragRef.current.startX;
            const targetY = pointerPctY - overlayDragRef.current.startY;
            
            setLyricPos({
                x: Math.max(5, Math.min(95, targetX)),
                y: Math.max(5, Math.min(95, targetY))
            });
        };
        
        const handleUp = () => {
            setIsDraggingOverlay(false);
        };

        if (isDraggingOverlay) {
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        }

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, [isDraggingOverlay]);

    // Auto-save lyrics to localStorage when they change
    useEffect(() => {
        if (selectedSong && lyrics.length > 0) {
            localStorage.setItem(`ai_lyrics_${selectedSong.video_id}`, JSON.stringify(lyrics));
        }
    }, [lyrics, selectedSong]);

    const rebuildRegions = (newLyrics: LyricWord[]) => {
        if (wsRegions.current) {
            wsRegions.current.clearRegions();
            newLyrics.forEach((word, i) => {
                wsRegions.current.addRegion({
                    id: `lyric-${i}`,
                    start: word.start,
                    end: word.end,
                    // No content label — React draggable blocks render the text instead
                    color: 'rgba(0, 0, 0, 0)', // Transparent: WS regions used only for sync data, not display
                    drag: false,
                    resize: false
                });
            });
        }
    };

    const handleWordChange = (idx: number, newText: string) => {
        setLyrics(prev => {
            const next = [...prev];
            next[idx].word = newText;
            return next;
        });
    };

    const handleWordBlur = () => {
        rebuildRegions(lyrics);
    };

    const handleMergeNext = (idx: number) => {
        if (idx >= lyrics.length - 1) return;
        setLyrics(prev => {
            const next = [...prev];
            next[idx].word = next[idx].word + next[idx+1].word;
            next[idx].end = next[idx+1].end;
            next.splice(idx + 1, 1);
            setTimeout(() => rebuildRegions(next), 0);
            return next;
        });
    };

    const handleDeleteWord = (idx: number) => {
        setLyrics(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            setTimeout(() => rebuildRegions(next), 0);
            return next;
        });
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setZoom(val);
        if (wavesurfer.current) {
            wavesurfer.current.zoom(val);
        }
    };

    const handleToggleTapSync = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setRecordingIndex(0);
        }
    };

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    
    // Timeline Drag System
    const handlePointerDown = (e: React.PointerEvent, idx: number, action: 'move' | 'resize-right' | 'resize-left') => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingIdx(idx);
        setDragAction(action);
        setStartX(e.clientX);
        setStartTime(lyrics[idx].start);
        setStartEndTime(lyrics[idx].end);
        setInitialDragLyrics(lyrics.map(l => ({...l})));
    };

    // Timeline Pointer Drag Move & Resize Event Listeners
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (draggingIdx === null || !dragAction || initialDragLyrics.length === 0) return;
            const deltaX = e.clientX - startX;
            const deltaTime = deltaX / zoom;
            
            setLyrics(() => {
                const next = initialDragLyrics.map(l => ({...l}));
                const item = next[draggingIdx];
                
                if (dragAction === 'move') {
                    const blockDuration = startEndTime - startTime;
                    let newTime = Math.max(0, startTime + deltaTime);
                    const actualDelta = newTime - startTime;
                    
                    item.start = newTime;
                    item.end = newTime + blockDuration;
                    
                    // Ripple Edit
                    if (isRippleEdit || e.shiftKey) {
                        for (let i = draggingIdx + 1; i < next.length; i++) {
                            const dur = next[i].end - next[i].start;
                            next[i].start = Math.max(0, next[i].start + actualDelta);
                            next[i].end = next[i].start + dur;
                        }
                    }
                } else if (dragAction === 'resize-left') {
                    let newTime = Math.max(0, startTime + deltaTime);
                    newTime = Math.min(newTime, startEndTime - 0.2);
                    item.start = newTime;
                } else if (dragAction === 'resize-right') {
                    let newEnd = Math.max(startTime + 0.2, startEndTime + deltaTime);
                    item.end = newEnd;
                }
                
                return next;
            });
        };

        const handlePointerUp = () => {
            setDraggingIdx(null);
            setDragAction(null);
            setInitialDragLyrics([]);
            setLyrics(prev => [...prev]); // Trigger update to regions if necessary
            setTimeout(() => {
                const currentLyrics = useLyricsStore.getState().lyrics;
                // Optionally rebuild regions if you use them, but we might not even need regions anymore!
            }, 50);
        };

        if (draggingIdx !== null) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingIdx, dragAction, startX, startTime, startEndTime, zoom, isRippleEdit, initialDragLyrics]);

    // Tap-to-Sync Handlers (port from studio)
    const handleTap = () => {
        if (!isRecording) return;
        if (recordingIndex >= lyrics.length) {
            setIsRecording(false);
            return;
        }

        const newLyrics = [...lyrics];
        const oldTime = newLyrics[recordingIndex].start;
        const oldEndTime = newLyrics[recordingIndex].end || (oldTime + 3);
        const blockDuration = oldEndTime - oldTime;

        newLyrics[recordingIndex] = {
            ...newLyrics[recordingIndex],
            start: currentTime,
            end: currentTime + blockDuration
        };

        if (recordingIndex > 0) {
            const prev = newLyrics[recordingIndex - 1];
            if (prev.end && prev.end > currentTime) {
                newLyrics[recordingIndex - 1].end = currentTime;
            }
        }

        setLyrics(newLyrics);
        rebuildRegions(newLyrics);
        setRecordingIndex(prev => prev + 1);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && isRecording) {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            handleTap();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRecording, recordingIndex, currentTime, lyrics]);

    const handleToggleRecording = () => {
        const nextState = !isRecording;
        setIsRecording(nextState);
        if (nextState) {
            setRecordingIndex(0);
            if (!isPlaying && wavesurfer.current) {
                wavesurfer.current.play();
            }
        }
    };

    const handleAddWord = () => {
        if (!selectedSong) return;
        const newBlock: LyricWord = {
            word: "เนื้อร้องท่อนใหม่",
            start: Math.round(currentTime * 100) / 100,
            end: Math.round((currentTime + 2.0) * 100) / 100
        };
        
        setLyrics(prev => {
            const next = [...prev];
            const insertIdx = next.findIndex(l => l.start > newBlock.start);
            if (insertIdx === -1) {
                next.push(newBlock);
            } else {
                next.splice(insertIdx, 0, newBlock);
            }
            setTimeout(() => rebuildRegions(next), 0);
            return next;
        });
    };

    // Auto-scroll timeline to keep playhead centered during playback
    useEffect(() => {
        if (isPlaying && wavesurfer.current && timelineRef.current) {
            const time = currentTime;
            const px = time * zoom;
            const container = timelineRef.current;
            const rect = container.getBoundingClientRect();
            container.scrollLeft = px - rect.width / 2;
        }
    }, [currentTime, isPlaying, zoom]);

    const handleTranscribe = async () => {
        if (!selectedSong) return;
        if (!deepgramKey) {
            useUIStore.getState().showConfirm({
                title: "ไม่พบ Deepgram API Key",
                message: "กรุณาไปที่เมนู 'ตั้งค่า > แท็บ AI' เพื่อกรอก Deepgram API Key ก่อนสร้างเนื้อเพลง",
                type: "warning",
                confirmText: "ไปหน้าตั้งค่า",
                cancelText: "ยกเลิก",
                onConfirm: () => {
                    useUIStore.getState().hideConfirm();
                    addToast("กรุณากดกลับไปหน้าแรก แล้วเปิดเมนูตั้งค่า -> แท็บ AI ครับ");
                }
            });
            return;
        }

        setIsTranscribing(true);
        setError('');
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) throw new Error("Local Bridge offline");

            // 1. Fetch audio from bridge (vocals preferred, then original/cached audio)
            let audioRes = await fetch(`${baseUrl}/files/${selectedSong.video_id}/vocals.m4a`);
            if (!audioRes.ok) {
                audioRes = await fetch(`${baseUrl}/files/${selectedSong.video_id}/original.audio`);
            }
            if (!audioRes.ok) {
                audioRes = await fetch(`${baseUrl}/files/${selectedSong.video_id}/no_vocals.m4a`);
            }
            if (!audioRes.ok) {
                throw new Error("ไม่พบไฟล์เสียงร้อง (vocals.m4a) หรือไฟล์เสียงต้นฉบับ กรุณาลองกดแยกเสียงเพลงนี้ก่อน");
            }
            const audioBlob = await audioRes.blob();

            // 2. Call Deepgram directly from browser
            const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=th&smart_format=true', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${deepgramKey}`,
                    'Content-Type': 'audio/m4a'
                },
                body: audioBlob
            });

            if (res.ok) {
                const dgData = await res.json();
                const rawWords = dgData.results?.channels[0]?.alternatives[0]?.words || [];
                
                if (rawWords.length === 0) {
                    throw new Error("AI ไม่สามารถแกะเนื้อเพลงจากไฟล์เสียงร้องได้");
                }
                
                // Group words into line-level sentence blocks (split on gap > 1.5s or length >= 8 words)
                const groupedWords: LyricWord[] = [];
                let currentGroup: { word: string; start: number; end: number }[] = [];
                
                for (let idx = 0; idx < rawWords.length; idx++) {
                    const w = rawWords[idx];
                    const prevW = idx > 0 ? rawWords[idx - 1] : null;
                    const isGap = prevW && (w.start - prevW.end > 1.5);
                    const isTooLong = currentGroup.length >= 8;
                    
                    if ((isGap || isTooLong) && currentGroup.length > 0) {
                        const sentence = currentGroup.map(item => item.word).join(' ');
                        groupedWords.push({
                            word: sentence,
                            start: currentGroup[0].start,
                            end: currentGroup[currentGroup.length - 1].end
                        });
                        currentGroup = [];
                    }
                    currentGroup.push({
                        word: w.punctuated_word || w.word,
                        start: w.start,
                        end: w.end
                    });
                }
                if (currentGroup.length > 0) {
                    const sentence = currentGroup.map(item => item.word).join(' ');
                    groupedWords.push({
                        word: sentence,
                        start: currentGroup[0].start,
                        end: currentGroup[currentGroup.length - 1].end
                    });
                }
                
                // Cache locally so it syncs with the player!
                localStorage.setItem(`ai_lyrics_${selectedSong.video_id}`, JSON.stringify(groupedWords));

                setLyrics(groupedWords);
                rebuildRegions(groupedWords);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.err_msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Deepgram API');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsTranscribing(false);
        }
    };

    
    const handleImportFromWiki = async () => {

        if (!selectedSong) return;
        try {
            const songTitle = selectedSong.title || "Unknown Title";
            await useLyricsStore.getState().fetchLyrics(selectedSong.video_id, songTitle);
            const cloudLyrics = useLyricsStore.getState().lyrics;
            
            if (!cloudLyrics || cloudLyrics.length === 0) {
                addToast("ไม่พบเนื้อเพลงของวิดีโอนี้บนคลาวด์/Wiki");
                return;
            }
            
            const converted = cloudLyrics.map((line, i) => {
                const duration = line.endTime ? (line.endTime - line.time) : 3.0;
                return {
                    word: line.text,
                    start: line.time,
                    end: line.endTime || (line.time + duration),
                    confidence: 1.0
                };
            });
            
            setLyrics(converted);
            rebuildRegions(converted);
            addToast("นำเข้าเนื้อเพลงจากคลาวด์สำเร็จ!");
        } catch (err: any) {
            addToast("ไม่สามารถนำเข้าข้อมูลได้: " + err.message);
        }
    };

    const handleSaveToWiki = async () => {
        if (!selectedSong) return;
        if (!user) {
            useUIStore.getState().showConfirm({
                title: "เข้าสู่ระบบ",
                message: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถบันทึกเนื้อเพลงลงใน Wiki ได้",
                type: "warning",
                confirmText: "ตกลง",
                cancelText: "none",
                onConfirm: () => {}
            });
            return;
        }

        let lrcContent = "";
        for (let i = 0; i < lyrics.length; i++) {
            const line = lyrics[i];
            const min = Math.floor(line.start / 60).toString().padStart(2, '0');
            const sec = (line.start % 60).toFixed(2).padStart(5, '0');
            lrcContent += `[${min}:${sec}]${line.word}\n`;
            
            if (line.end) {
                const nextTime = lyrics[i+1]?.start || Infinity;
                if (line.end < nextTime - 0.1) {
                    const endMin = Math.floor(line.end / 60).toString().padStart(2, '0');
                    const endSec = (line.end % 60).toFixed(2).padStart(5, '0');
                    lrcContent += `[${endMin}:${endSec}] \n`;
                }
            }
        }

        try {
            await useWikiLyricsStore.getState().saveSync({
                videoId: selectedSong.video_id,
                authorId: user.uid || '',
                authorName: user.displayName || 'Anonymous',
                lrcContent,
                globalOffset: 0
            });
            addToast("บันทึกเนื้อเพลงลงคลาวด์ (Wiki) สำเร็จแล้ว!");
        } catch (err: any) {
            addToast("บันทึกไม่สำเร็จ: " + err.message);
        }
    };

    const handlePasteSubmit = () => {
        if (!rawText.trim()) return;
        const lines = rawText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        const parsed = lines.map((line, i) => ({
            word: line,
            start: i * 4,
            end: i * 4 + 3.5,
            confidence: 1.0
        }));
        
        setLyrics(parsed);
        setTimeout(() => rebuildRegions(parsed), 50);
        setShowPasteModal(false);
        setRawText('');
        addToast(`นำเข้าเนื้อเพลงดิบ ${lines.length} บรรทัดสำเร็จ! กรุณาลากปรับจังหวะกล่องข้อความบนคลื่นเสียง`);
    };

    const handleExport = async () => {
        addToast("Exporting MP4 (FFmpeg process will run on Local Bridge) - Coming in next step!");
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };


    // Check if the loaded lyrics are line-by-line or word-by-word
    const isLineMode = React.useMemo(() => {
        if (lyrics.length === 0) return false;
        let spaceCount = 0;
        let totalLen = 0;
        const sample = lyrics.slice(0, 10);
        sample.forEach(l => {
            if (l.word.includes(' ')) spaceCount++;
            totalLen += l.word.length;
        });
        return (totalLen / sample.length > 8) || (spaceCount > 1);
    }, [lyrics]);

    // Group words into lines
    const lyricLines = React.useMemo(() => {
        if (lyrics.length === 0) return [];
        if (isLineMode) {
            return lyrics.map(l => [l]);
        }
        
        const lines = [];
        let currentLine = [];
        let lastEnd = 0;
        for (const word of lyrics) {
            if (currentLine.length > 0 && (word.start - lastEnd > 1.5 || currentLine.length >= 10)) {
                lines.push(currentLine);
                currentLine = [];
            }
            currentLine.push(word);
            lastEnd = word.end;
        }
        if (currentLine.length > 0) lines.push(currentLine);
        return lines;
    }, [lyrics, isLineMode]);

    const activeLineIndex = React.useMemo(() => {
        if (lyricLines.length === 0) return -1;
        for (let i = 0; i < lyricLines.length; i++) {
            const line = lyricLines[i];
            if (currentTime >= line[0].start && currentTime <= line[line.length - 1].end) {
                return i;
            }
        }
        for (let i = 0; i < lyricLines.length; i++) {
            if (currentTime < lyricLines[i][0].start) {
                return Math.max(0, i - 1);
            }
        }
        return lyricLines.length - 1;
    }, [lyricLines, currentTime]);

    return (

        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <Head>
        <title>Creator Studio - YouOke</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&family=Prompt:wght@400;700&family=Sarabun:wght@400;700&family=Mali:wght@400;700&family=Itim&display=swap" rel="stylesheet" />
    </Head>

            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="font-bold text-lg flex items-center gap-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">YouOke</span>
                        <span className="text-zinc-300 font-medium text-sm border-l border-zinc-700 pl-2">Creator Studio</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 hidden sm:inline-block">โปรเจกต์: {selectedSong ? selectedSong.title : 'ยังไม่เลือกเพลง'}</span>
                    
                    <button
                        onClick={handleSaveToWiki}
                        disabled={!selectedSong || lyrics.length === 0}
                        className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={lyrics.length === 0}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Video
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Center Canvas (Preview) */}
                <div className="flex-1 flex flex-col relative bg-black items-center justify-center overflow-hidden">
                    {!selectedSong ? (
                        <div className="max-w-4xl w-full mx-auto px-4 py-8 animate-in fade-in duration-500">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 mb-3">
                                    YouOke Creator Hub
                                </h2>
                                <p className="text-zinc-400 text-sm max-w-lg mx-auto">
                                    เลือกช่องทางในการสร้างและเตรียมเพลงคาราโอเกะของคุณ 
                                    ระบบจะบันทึกผลงานโดยอัตโนมัติเพื่อให้คุณร้องเพลงได้อย่างราบรื่นที่สุด
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Card 1: Wiki Lyrics Studio */}
                                <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-primary/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-primary/80/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                            <Sparkles className="text-primary w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">1. สตูดิโอเนื้อร้องคลาวด์ (Wiki Studio)</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                            จัดเรียงบรรทัดเนื้อเพลง ซิงค์จังหวะให้ตรง และปรับแต่งตำแหน่งแสดงผลแบบเรียลไทม์ เพื่อบันทึกเป็นฐานข้อมูล Wiki ให้ทุกคนร้องได้
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3 mt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-left">ใส่ลิงก์ YouTube หรือ Video ID</label>
                                            <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 focus-within:border-primary/50 transition-all">
                                                <input 
                                                    type="text" 
                                                    placeholder="เช่น https://www.youtube.com/watch?v=..."
                                                    value={ytUrl}
                                                    onChange={(e) => setYtUrl(e.target.value)}
                                                    className="bg-transparent text-sm text-zinc-200 px-3 py-2 w-full outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleGoToWikiStudio();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGoToWikiStudio}
                                            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} />
                                            เริ่มแต่งเนื้อร้อง
                                        </button>
                                    </div>
                                </div>

                                {/* Card 2: Local AI Separation */}
                                <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-pink-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-primary/80/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                            <Music className="text-orange-400 w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">2. ถอดเสียงแยกคีย์ด้วย AI (Local Studio)</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                            ตัดเสียงคนร้องออกจากดนตรี และให้ปัญญาประดิษฐ์แกะเนื้อหาทีละพยางค์โดยอัตโนมัติ (เหมาะสำหรับการใช้เสียงร้องคุณภาพสูง)
                                        </p>
                                    </div>
                                    
                                    <div className="mt-8">
                                        <button 
                                            onClick={() => setShowLibraryModal(true)}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 text-zinc-200 py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20"
                                        >
                                            <Music size={16} className="text-orange-400" />
                                            เลือกเพลงจากคลัง Local
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative p-8 select-none">
                            {/* Fake Video Canvas Area */}
                            <div ref={videoContainerRef} className="aspect-video w-full max-w-4xl bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 relative flex flex-col items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/40 pointer-events-none" />
                                
                                {/* Lyrics Preview */}
                                <div 
                                    style={{
                                        left: `${lyricPos.x}%`,
                                        top: `${lyricPos.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        cursor: isDraggingOverlay ? 'grabbing' : 'grab',
                                        touchAction: 'none'
                                    }}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        setIsDraggingOverlay(true);
                                        const containerRect = videoContainerRef.current?.getBoundingClientRect();
                                        const elementRect = e.currentTarget.getBoundingClientRect();
                                        if (containerRect) {
                                            const elCenterX = elementRect.left + elementRect.width / 2;
                                            const elCenterY = elementRect.top + elementRect.height / 2;
                                            const offsetX = ((e.clientX - elCenterX) / containerRect.width) * 100;
                                            const offsetY = ((e.clientY - elCenterY) / containerRect.height) * 100;
                                            overlayDragRef.current = {
                                                startX: offsetX,
                                                startY: offsetY,
                                                startPosX: 0,
                                                startPosY: 0
                                            };
                                        }
                                    }}
                                    className={clsx(
                                        "z-10 text-center px-12 py-4 absolute w-max max-w-[90%] flex flex-col items-center select-none rounded-xl border border-transparent transition-all",
                                        isDraggingOverlay ? "border-primary/30 bg-primary/80/5 scale-105" : "hover:border-zinc-800 hover:bg-zinc-900/10"
                                    )}
                                >
                                    <div className="space-y-4 w-full flex flex-col items-center pointer-events-none font-sans">
                                        {lyrics.length > 0 ? (
                                            (() => {
                                                const activeLineIdx = activeLineIndex;
                                                const currentLine = activeLineIdx !== -1 ? lyricLines[activeLineIdx] : null;
                                                let nextLineIdx = activeLineIdx !== -1 ? activeLineIdx + 1
                                                    : lyricLines.findIndex(line => line[0].start > currentTime);
                                                const nextLine = nextLineIdx !== -1 && nextLineIdx < lyricLines.length ? lyricLines[nextLineIdx] : null;
                                                return (
                                                    <div className="space-y-4 flex flex-col items-center">
                                                        {/* Current Active Line */}
                                                        <p
                                                            style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily, WebkitTextStroke: `${fontOutline}px black` }}
                                                            className={clsx(
                                                                "font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-normal transition-all duration-300 text-center min-h-[1.5em]",
                                                                currentLine ? "opacity-100 scale-100" : "opacity-0"
                                                            )}
                                                        >
                                                            {currentLine ? currentLine.map((l, i) => {
                                                                const isPast = currentTime > l.end;
                                                                const isCurrent2 = currentTime >= l.start && currentTime <= l.end;
                                                                return (
                                                                    <span key={i} className={clsx("transition-colors duration-100 mx-1 inline-block")} style={{ color: isPast ? activeColor : isCurrent2 ? activeColor : fillColor, opacity: isPast ? 1 : isCurrent2 ? 0.9 : 0.8 }}>{l.word}</span>
                                                                );
                                                            }) : <span>&nbsp;</span>}
                                                        </p>
                                                        {/* Next Upcoming Line (Faded) */}
                                                        <p
                                                            style={{ fontSize: `${fontSize * 0.8}px`, fontFamily: fontFamily, WebkitTextStroke: `${fontOutline * 0.8}px black` }}
                                                            className={clsx(
                                                                "font-black text-zinc-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-normal transition-all duration-300 text-center min-h-[1.5em]",
                                                                nextLine ? "opacity-40 scale-95" : "opacity-0"
                                                            )}
                                                        >
                                                            {nextLine ? nextLine.map((l, i) => (
                                                                <span key={i} className="mx-1 inline-block" style={{ color: fillColor }}>{l.word}</span>
                                                            )) : <span>&nbsp;</span>}
                                                        </p>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                                                <div className="text-center">
                                                    <h3 className="text-2xl font-black text-white mb-2">ยังไม่มีเนื้อร้อง</h3>
                                                    <p className="text-zinc-400 text-sm">เลือกวิธีสร้างเนื้อร้องสำหรับโปรเจกต์นี้</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={handleTranscribe} disabled={isTranscribing} className="flex flex-col items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-primary/50 p-6 rounded-2xl transition-all shadow-xl disabled:opacity-50 group">
                                                        {isTranscribing ? <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div> : <Mic size={32} className="text-primary group-hover:scale-110 transition-transform" />}
                                                        <span className="font-bold text-white">AI แกะเนื้อร้อง</span>
                                                    </button>
                                                    <button onClick={() => setShowPasteModal(true)} className="flex flex-col items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all shadow-xl group">
                                                        <FileText size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                                        <span className="font-bold text-white">วางเนื้อร้องเอง</span>
                                                    </button>
                                                    <button onClick={handleImportFromWiki} className="flex flex-col items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-sky-500/50 p-6 rounded-2xl transition-all shadow-xl group">
                                                        <UploadCloud size={32} className="text-sky-500 group-hover:scale-110 transition-transform" />
                                                        <span className="font-bold text-white">ดึงจาก Wiki</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500 pointer-events-none">
                                    Canvas 1920x1080 (ลากข้อความเพื่อย้ายตำแหน่งได้)
                                </div>
                            </div>
                            
                            

                        </div>
                    )}
                </div>

                {/* Right Sidebar (Creator Tools) */}
                <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 hidden lg:flex font-sans">
                    <div className="p-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
                        <h2 className="font-bold text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <Settings size={16} className="text-primary" />
                            เครื่องมือแต่งเนื้อร้อง
                        </h2>
                        {lyrics.length > 0 && (
                            <span className="text-[10px] font-bold bg-primary/80/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                                {lyrics.length} บรรทัด
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        
                        {/* Section 2: Canvas Text Overlay Styling */}
                        <div className="space-y-4 pt-4 border-t border-zinc-900">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                การจัดรูปแบบ (Properties)
                            </h3>
                            
                            <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                                <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Type size={14} className="text-primary" /> รูปแบบฟอนต์</span>
                                <select 
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none w-max text-right cursor-pointer"
                                >
                                    <option value="Sukhumvit Set">Sukhumvit (ค่าเริ่มต้น)</option>
                                    <option value="'Kanit', sans-serif">Kanit (คณิต)</option>
                                    <option value="'Prompt', sans-serif">Prompt (พร้อม)</option>
                                    <option value="'Sarabun', sans-serif">Sarabun (สารบรรณ)</option>
                                    <option value="'Mali', cursive">Mali (มะลิ)</option>
                                    <option value="'Itim', cursive">Itim (ไอติม)</option>
                                </select>
                            </div>

                            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">สีข้อความ (Fill)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-500 uppercase">{fillColor}</span>
                                        <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">สีไฮไลท์ (Active)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-500 uppercase">{activeColor}</span>
                                        <input type="color" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    </div>
                                </div>
                            </div>


                            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">ขนาดฟอนต์</span>
                                    <span className="font-mono text-zinc-400">{fontSize}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="24" max="100" 
                                    value={fontSize} 
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">ความหนาของขอบ</span>
                                    <span className="font-mono text-zinc-400">{fontOutline}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="10" step="0.5"
                                    value={fontOutline} 
                                    onChange={(e) => setFontOutline(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="bg-red-950/20 border border-primary/25 p-3.5 rounded-xl text-xs text-red-200">
                                <p className="font-bold flex items-center gap-1.5 mb-1">
                                    💡 เคล็ดลับจัดวางหน้าจอ
                                </p>
                                <p className="text-zinc-400 leading-relaxed mb-2.5">
                                    ท่านสามารถคลิกแล้วลากข้อความพรีวิวเนื้อร้องบนจอวิดีโอเพื่อปรับแต่งตำแหน่งแสดงผลได้อย่างอิสระ
                                </p>
                                <button 
                                    onClick={() => setLyricPos({ x: 50, y: 85 })} 
                                    className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 py-1.5 rounded-lg font-semibold transition-colors active:scale-95"
                                >
                                    รีเซ็ตตำแหน่งตรงกลางล่าง
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className="h-48 border-t border-zinc-800 bg-zinc-950 flex flex-col shrink-0 font-sans">
                {/* Timeline Toolbar (Studio Style) */}
                <div className="h-14 shrink-0 bg-zinc-900 border-y border-white/10 px-4 flex items-center justify-between z-30 shadow-lg select-none">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 bg-white hover:scale-105 active:scale-95 text-black rounded-full flex items-center justify-center transition-transform shadow-lg shadow-white/10 shrink-0"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>
                        <span className="font-mono text-lg font-bold text-white min-w-[80px]">{formatTime(currentTime)}s</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {}} 
                            className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                            title="นำเข้าเนื้อเพลง"
                        >
                            <FileText size={16} /> <span className="hidden sm:inline">นำเข้าเนื้อเพลง</span>
                        </button>
                        <button
                            onClick={handleAddWord}
                            className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                            title="เพิ่มบรรทัด"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">เพิ่มบรรทัด</span>
                        </button>
                        <button
                            onClick={() => setIsRippleEdit(!isRippleEdit)}
                            className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 text-sm ${isRippleEdit ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`}
                            title="ลากขยับพร้อมกันทั้งกลุ่ม"
                        >
                            <Link size={16} /> <span className="hidden sm:inline">Ripple</span>
                        </button>
                        <button
                            onClick={handleToggleTapSync}
                            className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 text-sm ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/15'}`}
                        >
                            {isRecording ? "🔴 STOP (Spacebar)" : "🎯 START TAP-TO-SYNC"}
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {selectedSong && (
                            <div className="flex items-center bg-black/40 border border-white/5 p-1 rounded-lg hidden md:flex">
                                <button
                                    onClick={() => setAudioTrack('vocals')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${audioTrack === 'vocals' ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                                >
                                    <Mic size={14} /> ร้องนำ
                                </button>
                                <button
                                    onClick={() => setAudioTrack('instrumental')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${audioTrack === 'instrumental' ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                                >
                                    <Music size={14} /> ดนตรี
                                </button>
                                <button
                                    onClick={() => setAudioTrack('original')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${audioTrack === 'original' ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                                >
                                    <Sparkles size={14} /> รวมเสียง
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => handleZoomChange({ target: { value: String(Math.max(10, zoom - 15)) } } as any)}
                                className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center justify-center text-zinc-300 transition-colors"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={() => handleZoomChange({ target: { value: String(Math.min(300, zoom + 15)) } } as any)}
                                className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center justify-center text-zinc-300 transition-colors"
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Wavesurfer & Draggable Block Timeline Area */}
                <div 
                    ref={timelineRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden relative bg-zinc-900 custom-scrollbar select-none"
                >
                    {selectedSong ? (
                        <div 
                            style={{ width: `${Math.max(duration, 300) * zoom}px` }} 
                            className="h-full relative select-none"
                            onClick={(e) => {
                                if (e.target === e.currentTarget && wavesurfer.current) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const clickTime = clickX / zoom;
                                    wavesurfer.current.setTime(clickTime);
                                }
                            }}
                        >
                            {/* Waveform Background (Channel 1) */}
                            <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none opacity-80 border-b border-zinc-800 bg-zinc-950/50">
                                <div ref={containerRef} className="w-full h-full" />
                            </div>
                            
                            {/* Timescale markers */}
                            {Array.from({ length: Math.ceil(duration || 300) }).map((_, sec) => {
                                if (sec % 5 === 0) {
                                    return (
                                        <div 
                                            key={sec} 
                                            style={{ left: `${sec * zoom}px` }} 
                                            className="absolute bottom-0 top-0 border-l border-zinc-800/40 text-[9px] font-mono text-zinc-500 pl-1 pt-1 flex flex-col justify-between"
                                        >
                                            <span>{formatTime(sec)}</span>
                                            <span className="mb-6">|</span>
                                        </div>
                                    );
                                }
                                return null;
                            })}

                            {/* Red Playhead Line */}
                            <div 
                                style={{ left: `${currentTime * zoom}px` }} 
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-lg"
                            >
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full -ml-1 -mt-0.5 shadow-md shadow-rose-950/50" />
                            </div>

                            {/* Lyric Blocks (Track 2) */}
                            {lyrics.map((word, idx) => {
                                const left = word.start * zoom;
                                const width = Math.max((word.end - word.start) * zoom, 40);
                                let row = 0;
                                if (idx > 0 && word.start < lyrics[idx - 1].end) {
                                    row = 1;
                                } // Min width 40px to prevent zero-width clipping
                                const isDragging = draggingIdx === idx;
                                const isActive = idx === activeLineIndex;
                                const isDone = currentTime > word.end;
                                
                                return (
                                    <div 
                                        key={idx}
                                        style={{ 
                                            left: `${left}px`, 
                                            width: `${width}px`,
                                            top: '20px',
                                            height: '64px',
                                            cursor: draggingIdx === idx && dragAction === 'move' ? 'grabbing' : 'default',
                                            zIndex: draggingIdx === idx ? 50 : (isActive ? 30 : 20)
                                        }}
                                        className={clsx(
                                            "absolute rounded-lg border flex overflow-hidden transition-all shadow-md group select-none",
                                            isActive 
                                                ? "bg-primary/40 border-primary shadow-[0_0_15px_rgba(229,9,20,0.3)] text-white" 
                                                : isDone
                                                    ? "bg-zinc-850 border-zinc-700/50 text-zinc-400"
                                                    : "bg-zinc-800/80 border-white/10 hover:border-white/30 text-white"
                                        )}
                                        onPointerDown={(e) => {
                                            if ((e.target as HTMLElement).closest('.action-btn')) return;
                                            
                                            e.preventDefault();
                                            setDraggingIdx(idx);
                                            setDragAction('move');
                                            setStartX(e.clientX);
                                            setStartTime(word.start);
                                            setStartEndTime(word.end);
                                        }}
                                    >
                                        {/* Left Drag Handle (Move Block) */}
                                        <div 
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setDraggingIdx(idx);
                                                setDragAction('resize-left');
                                                setStartX(e.clientX);
                                                setStartTime(word.start);
                                                setStartEndTime(word.end);
                                            }}
                                            className="w-4 h-full bg-black/30 hover:bg-black/50 cursor-ew-resize flex items-center justify-center border-r border-black/20 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <GripVertical size={12} className="text-zinc-400" />
                                        </div>

                                        {/* Editable Word Input */}
                                        <input 
                                            value={word.word}
                                            onChange={(e) => handleWordChange(idx, e.target.value)}
                                            onBlur={handleWordBlur}
                                            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging timeline when editing text
                                            className="bg-transparent border-none text-sm font-semibold text-zinc-100 outline-none w-full text-center px-2 select-text cursor-text"
                                        />

                                        {/* Delete Button (appears on hover) */}
                                        <button
                                            className="action-btn absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                handleDeleteWord(idx);
                                            }}
                                        >
                                            <X size={10} />
                                        </button>

                                        {/* Right Drag Handle (Resize Duration) */}
                                        <div 
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setDraggingIdx(idx);
                                                setDragAction('resize-right');
                                                setStartX(e.clientX);
                                                setStartTime(word.start);
                                                setStartEndTime(word.end);
                                            }}
                                            className="w-4 h-full bg-white/5 hover:bg-white/20 cursor-ew-resize flex items-center justify-center border-l border-white/10 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-0.5 h-4 bg-zinc-400 rounded-sm"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs font-semibold">
                            กรุณาเลือกเพลงจากคลังเพื่อเริ่มต้นแก้ไข
                        </div>
                    )}
                </div>
            </div>

            {/* Library Modal */}
            {showLibraryModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">เลือกเพลงจากคลัง</h2>
                            <button onClick={() => setShowLibraryModal(false)} className="text-zinc-500 hover:text-white">✕</button>
                        </div>
                        <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                            {songs.length === 0 ? (
                                <div className="text-center p-8 text-zinc-500">
                                    ไม่มีเพลงที่แยกเสียงไว้ในระบบ<br/>
                                    <span className="text-sm">ไปที่หน้าค้นหาและเปิดใช้งานปุ่ม &quot;แยกเสียงร้อง&quot; ก่อน</span>
                                </div>
                            ) : (
                                songs.map(song => (
                                    <div 
                                        key={song.video_id}
                                        onClick={() => handleSelectSong(song)}
                                        className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-xl cursor-pointer group transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary text-zinc-500">
                                            <Music size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-200 truncate">{song.title}</p>
                                            <p className="text-xs text-zinc-500">{song.mode} • {(song.size_mb).toFixed(1)} MB</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Paste Lyrics Modal */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">วางเนื้อเพลงดิบ</h2>
                            <button onClick={() => setShowPasteModal(false)} className="text-zinc-500 hover:text-white">✕</button>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-4">
                            <p className="text-xs text-zinc-400 font-sans">
                                วางเนื้อเพลงบรรทัดดิบที่ไม่มีข้อมูลไทม์แสตมป์ลงด้านล่าง ระบบจะแบ่งเนื้อเพลงทีละบรรทัดและกระจายช่วงเวลาเริ่มต้นให้โดยอัตโนมัติ เพื่อให้ท่านนำไปลากปรับจังหวะบนคลื่นเสียงต่อไป
                            </p>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="วางเนื้อเพลงที่นี่...&#10;เช่น:&#10;เขาคู่ควรอ้ายทิ้งป่ะ&#10;อ้ายอยู่กับเขาอ้ายหักศอกเอน"
                                className="w-full flex-1 min-h-[250px] bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-purple-500 transition-all font-sans resize-none"
                            />
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-900/50 rounded-b-2xl">
                            <button
                                onClick={() => setShowPasteModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handlePasteSubmit}
                                disabled={!rawText.trim()}
                                className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                นำเข้าเนื้อเพลง
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden backing track element */}
            <audio ref={backingAudioRef} className="hidden" preload="auto" />
        </div>
    );
}
