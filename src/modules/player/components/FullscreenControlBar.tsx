import React from 'react';
import { Minimize2, X, Play, Pause, Wand2, RefreshCw, ThumbsUp, ThumbsDown, Save, Edit2 } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useCast } from '../../../plugins/cast/context/CastContext';
import { useLyricsStore } from '../stores/useLyricsStore';
import { useWikiLyricsStore } from '../stores/useWikiLyricsStore';
import { useAuthStore } from '../../auth/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';
import { useRouter } from 'next/router';

interface FullscreenControlBarProps {
    showControls: boolean;
    layoutMode: string;
    playerRef?: React.MutableRefObject<any>;
}

export const FullscreenControlBar = ({ showControls, layoutMode, playerRef }: FullscreenControlBarProps) => {
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const cast = useCast();
    const router = useRouter();
    const { user } = useAuthStore();
    
    const currentVideo = usePlayerStore(state => state.currentVideo);

    // System 1: Manual Sync State & Actions
    const { syncOffset, nudgeOffset, setSyncOffset, lyrics } = useLyricsStore();
    
    // Wiki Karaoke State
    const { activeSync, voteSync, saveLocalOffset } = useWikiLyricsStore();

    const handlePlayPause = () => {
        if (cast.isConnected) {
            isPlaying ? cast.pause() : cast.play();
        } else {
            usePlayerStore.getState().togglePlay();
        }
    };

    const toggleFullscreen = () => {
        usePlayerStore.getState().triggerFullscreen();
    };

    const handleSync = async () => {
        // Obsolete AI Sync function - kept for reference or to be completely removed
    };

    const handleSaveOffset = () => {
        if (!currentVideo?.videoId) return;
        saveLocalOffset(currentVideo.videoId, syncOffset);
        useUIStore.getState().showConfirm({
            title: "บันทึกเวลาสำเร็จ",
            message: "บันทึกเวลาเริ่มต้นสำหรับเครื่องของคุณเรียบร้อยแล้ว",
            type: "success",
            confirmText: "ตกลง",
            cancelText: "none",
            onConfirm: () => {
                useUIStore.getState().hideConfirm();
            }
        });
    };

    const handleVote = async (type: 'upvote' | 'downvote') => {
        if (!user) {
            useUIStore.getState().showConfirm({
                title: "เข้าสู่ระบบ",
                message: "กรุณาเข้าสู่ระบบเพื่อโหวตความแม่นยำของเนื้อเพลง",
                type: "warning",
                confirmText: "ตกลง",
                cancelText: "none",
                onConfirm: () => {}
            });
            return;
        }
        if (activeSync) {
            await voteSync(activeSync.id, user.uid, type);
        }
    };

    if (layoutMode !== 'fullscreen') return null;

    return (
        <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            {/* System 1: Manual Offset & One-Tap Live Sync */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5" title="ปรับเวลาเนื้อเพลงแบบ Manual">
                <button
                    onClick={() => nudgeOffset(-0.5)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/15 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
                    title="ถอยหลัง 0.5 วินาที"
                >
                    -0.5s
                </button>
                <button
                    onClick={() => nudgeOffset(-0.1)}
                    className="px-1.5 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/15 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
                    title="ถอยหลัง 0.1 วินาที"
                >
                    -0.1s
                </button>

                <button
                    onClick={() => {
                        if (playerRef?.current && typeof playerRef.current.getCurrentTime === 'function') {
                            const currentTime = playerRef.current.getCurrentTime();
                            if (typeof currentTime === 'number' && lyrics.length > 0) {
                                // Find closest line using the absolute distance from current adjusted time
                                const adjustedTime = currentTime - syncOffset;
                                let closestLine = lyrics[0];
                                let minDistance = Math.abs(adjustedTime - lyrics[0].time);

                                for (let i = 1; i < lyrics.length; i++) {
                                    const distance = Math.abs(adjustedTime - lyrics[i].time);
                                    if (distance < minDistance) {
                                        minDistance = distance;
                                        closestLine = lyrics[i];
                                    }
                                }

                                if (closestLine) {
                                    const newOffset = currentTime - closestLine.time;
                                    setSyncOffset(Math.round(newOffset * 10) / 10);
                                }
                            }
                        }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 border border-blue-500/30"
                    title="กดมาร์กเวลาตรงนี้ทันทีเมื่อนักร้องเริ่มร้องท่อนนี้ (Live Tap Sync)"
                >
                    <span>🎯</span> <span>Sync</span>
                </button>

                <div 
                    onClick={() => setSyncOffset(0)}
                    className={`px-2 py-1 text-xs font-mono font-semibold rounded-md cursor-pointer transition-all ${syncOffset !== 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30' : 'text-white/40'}`}
                    title="คลิกเพื่อรีเซ็ต Offset เป็น 0"
                >
                    {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
                </div>

                <button
                    onClick={() => nudgeOffset(0.1)}
                    className="px-1.5 py-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/15 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
                    title="เดินหน้า 0.1 วินาที"
                >
                    +0.1s
                </button>
                <button
                    onClick={() => nudgeOffset(0.5)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/15 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
                    title="เดินหน้า 0.5 วินาที"
                >
                    +0.5s
                </button>
            </div>

            <div className="w-[1px] h-8 bg-white/10 mx-1" />

            {/* Save Offset Action */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                <button
                    onClick={handleSaveOffset}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${syncOffset !== (activeSync?.globalOffset || 0) ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white'}`}
                    title="บันทึก Offset ไว้ในเครื่อง"
                >
                    <Save size={15} />
                    เซฟ
                </button>
            </div>

            <div className="w-[1px] h-8 bg-white/10 mx-1" />

            {/* Wiki Karaoke Actions */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                <button
                    onClick={() => handleVote('upvote')}
                    disabled={!activeSync || !user?.uid || activeSync.voterIds?.includes(user.uid || '')}
                    className="px-2 py-2 rounded-lg flex items-center gap-1 text-xs font-medium bg-transparent text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    title="โหวตว่าเนื้อร้องตรง"
                >
                    <ThumbsUp size={15} className={user?.uid && activeSync?.voterIds?.includes(user.uid || '') && activeSync?.upvotes > 0 ? "fill-green-400 text-green-400" : ""} />
                    {activeSync?.upvotes || 0}
                </button>
                <button
                    onClick={() => handleVote('downvote')}
                    disabled={!activeSync || !user?.uid || activeSync.voterIds?.includes(user.uid || '')}
                    className="px-2 py-2 rounded-lg flex items-center gap-1 text-xs font-medium bg-transparent text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    title="โหวตว่าเนื้อร้องไม่ตรง"
                >
                    <ThumbsDown size={15} className={user?.uid && activeSync?.voterIds?.includes(user.uid || '') && activeSync?.downvotes > 0 ? "fill-red-400 text-red-400" : ""} />
                </button>
                
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                
                <button
                    onClick={() => {
                        if (currentVideo?.videoId) {
                            router.push(`/studio/${currentVideo.videoId}`);
                        }
                    }}
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="เข้าสู่โหมด Studio เพื่อแก้ไขเนื้อเพลง"
                >
                    <Edit2 size={15} />
                </button>
            </div>

            <div className="w-[1px] h-8 bg-white/10 mx-1" />

            {/* Play/Pause */}
            <button
                onClick={handlePlayPause}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isPlaying ? 'text-white/90 hover:text-white hover:bg-white/10 bg-white/5' : 'bg-primary text-white shadow-lg shadow-primary/30'}`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-2" />

            {/* Layout Controls */}
            <div className="flex items-center gap-1">
                {/* Exit Fullscreen Toggle */}
                <button
                    onClick={toggleFullscreen}
                    className="w-12 h-12 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    title="ย่อหน้าจอ"
                >
                    <Minimize2 size={22} />
                </button>

                {/* Exit to Split Mode */}
                <button
                    onClick={() => usePlayerStore.getState().setLayoutMode('split')}
                    className="w-12 h-12 flex items-center justify-center rounded-xl text-red-400/80 hover:text-white hover:bg-red-500/80 transition-all active:scale-90"
                    title="ออกจากหน้าจอเต็มจอ"
                >
                    <X size={24} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};
