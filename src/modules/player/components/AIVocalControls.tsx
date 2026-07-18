import React, { useState, useRef, useEffect } from 'react';
import { MicVocal, Loader2, Sparkles, Volume2, VolumeX, Music } from 'lucide-react';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { usePlayerStore } from '../stores/usePlayerStore';

interface AIVocalControlsProps {
    mobile?: boolean;
}

export const AIVocalControls = ({ mobile }: AIVocalControlsProps) => {
    const aiVocal = useAIVocalStore();
    const isKaraoke = usePlayerStore(state => state.isKaraoke);
    const currentVideo = usePlayerStore(state => state.currentVideo);
    
    // Get job status for current video
    const currentVideoId = currentVideo?.videoId || currentVideo?.id;
    const currentJob = currentVideoId ? aiVocal.jobs[currentVideoId] : null;
    const isActive = !!currentVideo?.aiVocalRequested;

    // Auto-resume job if requested but missing in store (e.g. page refresh)
    useEffect(() => {
        if (isActive && currentVideoId && !currentJob) {
            aiVocal.processAudio(currentVideoId).catch(console.error);
        }
    }, [isActive, currentVideoId, currentJob, aiVocal]);

    const [showSlider, setShowSlider] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowSlider(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Only show in Music mode
    if (isKaraoke) return null;
    if (!currentVideo) return null;

    const handleToggle = async () => {
        if (!isActive || !currentJob || currentJob.status === 'error') {
            // Usually triggered from queue now, but if somehow they click it here:
            if (currentVideoId) {
                if (!isActive) {
                    usePlayerStore.getState().updateQueueItem(currentVideo!.uuid, { aiVocalRequested: true });
                }
                await aiVocal.processAudio(currentVideoId);
            }
        } else if (currentJob?.status === 'ready') {
            // Toggle Slider
            setShowSlider(!showSlider);
        }
    };

    const handleTurnOff = () => {
        if (currentVideo) {
            usePlayerStore.getState().updateQueueItem(currentVideo.uuid, { aiVocalRequested: false });
        }
        setShowSlider(false);
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={handleToggle}
                className={`
                    flex items-center justify-center p-2 rounded-full transition-all relative
                    ${isActive 
                        ? (currentJob?.status === 'ready' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-primary') 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
                `}
                title={isActive ? (currentJob?.status === 'ready' ? "ปรับเสียงร้อง (AI)" : currentJob?.message) : "แยกเสียงร้องด้วย AI"}
            >
                {isActive && (currentJob?.status === 'processing' || !currentJob) ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <>
                        <MicVocal size={18} />
                        {!isActive && (
                            <Sparkles size={10} className="absolute top-1 right-1 text-yellow-500" />
                        )}
                    </>
                )}
            </button>

            {/* AI Processing Status Toast (only shows when processing) */}
            {isActive && currentJob?.status === 'processing' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-black/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-bold flex items-center gap-2 shadow-lg z-50">
                    <Loader2 size={12} className="animate-spin" />
                    {currentJob.message || "กำลังประมวลผล..."} {Math.round(currentJob.progress)}%
                </div>
            )}

            {/* Vocal Volume Slider Popover */}
            {showSlider && isActive && currentJob?.status === 'ready' && (
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl p-4 w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-primary" />
                            <h4 className="text-sm font-black text-gray-900">AI Vocal Mixer</h4>
                        </div>
                        <button 
                            onClick={handleTurnOff}
                            className="text-[10px] bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 font-bold px-2 py-1 rounded-full transition-colors"
                        >
                            ปิดใช้งาน
                        </button>
                    </div>

                    {/* Vocals Control */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <MicVocal size={12} /> เสียงร้อง (Vocals)
                            </span>
                            <span>{aiVocal.volumes.vocals}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => aiVocal.toggleMute('vocals')} className={`p-1.5 rounded-md transition-colors ${aiVocal.trackStates.vocals.muted ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:bg-gray-100'}`}>
                                {aiVocal.trackStates.vocals.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" max="100" 
                                value={aiVocal.trackStates.vocals.muted ? 0 : aiVocal.volumes.vocals}
                                onChange={(e) => {
                                    if (aiVocal.trackStates.vocals.muted) aiVocal.toggleMute('vocals');
                                    aiVocal.setVolume('vocals', parseInt(e.target.value));
                                }}
                                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" 
                            />
                        </div>
                    </div>

                    {/* Instrumental Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <Music size={12} /> เสียงดนตรี
                            </span>
                            <span>{aiVocal.volumes.instrumental}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => aiVocal.toggleMute('instrumental')} className={`p-1.5 rounded-md transition-colors ${aiVocal.trackStates.instrumental.muted ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:bg-gray-100'}`}>
                                {aiVocal.trackStates.instrumental.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" max="100" 
                                value={aiVocal.trackStates.instrumental.muted ? 0 : aiVocal.volumes.instrumental}
                                onChange={(e) => {
                                    if (aiVocal.trackStates.instrumental.muted) aiVocal.toggleMute('instrumental');
                                    aiVocal.setVolume('instrumental', parseInt(e.target.value));
                                }}
                                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" 
                            />
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[9px] text-gray-400 text-center uppercase tracking-wider font-bold">Powered by Demucs HTDEMUCS</p>
                    </div>
                </div>
            )}
        </div>
    );
};
