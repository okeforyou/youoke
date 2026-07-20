import React, { useState, useRef, useEffect } from 'react';
import { MicVocal, Loader2, Sparkles, Volume2, VolumeX, Music } from 'lucide-react';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useMixerStore } from '../stores/useMixerStore';

interface AIVocalControlsProps {
    mobile?: boolean;
}

export const AIVocalControls = ({ mobile }: AIVocalControlsProps) => {
    const aiVocal = useAIVocalStore();
    const mixer = useMixerStore();
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
    const [showModeSelect, setShowModeSelect] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowSlider(false);
                setShowModeSelect(false);
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
            setShowModeSelect(!showModeSelect);
            setShowSlider(false);
        } else if (currentJob?.status === 'ready') {
            setShowSlider(!showSlider);
            setShowModeSelect(false);
        }
    };

    const handleTurnOff = () => {
        if (currentVideo) {
            usePlayerStore.getState().updateQueueItem(currentVideo.uuid, { aiVocalRequested: false });
        }
        setShowSlider(false);
    };

    const renderTrackSlider = (label: string, trackKey: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => (
        <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1.5">
                    {trackKey === 'vocals' ? <MicVocal size={12} /> : <Music size={12} />} {label}
                </span>
                <span>{mixer.volumes[trackKey]}%</span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => mixer.toggleMute(trackKey)} className={`p-1.5 rounded-md transition-colors ${mixer.trackStates?.[trackKey]?.muted ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:bg-gray-100'}`}>
                    {mixer.trackStates?.[trackKey]?.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <input 
                    type="range" 
                    min="0" max="100" 
                    value={mixer.trackStates?.[trackKey]?.muted ? 0 : mixer.volumes[trackKey]}
                    onChange={(e) => {
                        if (mixer.trackStates?.[trackKey]?.muted) mixer.toggleMute(trackKey);
                        mixer.setVolume(trackKey, parseInt(e.target.value));
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" 
                />
            </div>
        </div>
    );

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

            {/* Mode Selection Popover */}
            {showModeSelect && (!isActive || currentJob?.status === 'error') && (
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl p-4 w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-sm font-black text-gray-900 mb-2">เลือกระดับการแยกเสียง</h4>
                    <div className="space-y-2">
                        <button 
                            onClick={async () => {
                                setShowModeSelect(false);
                                if (currentVideoId) {
                                    if (!isActive) usePlayerStore.getState().updateQueueItem(currentVideo!.uuid, { aiVocalRequested: true });
                                    aiVocal.setDefaultMode('basic');
                                    await aiVocal.processAudio(currentVideoId, 'basic');
                                }
                            }}
                            className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            <div className="font-bold text-sm">Basic Mode</div>
                            <div className="text-[10px] text-gray-500">แยก 2 แทร็ก (เสียงร้อง/ดนตรี)</div>
                        </button>
                        <button 
                            onClick={async () => {
                                setShowModeSelect(false);
                                if (currentVideoId) {
                                    if (!isActive) usePlayerStore.getState().updateQueueItem(currentVideo!.uuid, { aiVocalRequested: true });
                                    aiVocal.setDefaultMode('pro');
                                    await aiVocal.processAudio(currentVideoId, 'pro');
                                }
                            }}
                            className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-primary/10 hover:text-primary transition-colors border border-yellow-200 relative overflow-hidden"
                        >
                            <div className="font-bold text-sm flex justify-between">Pro Mode <Sparkles size={12} className="text-yellow-500" /></div>
                            <div className="text-[10px] text-gray-500">แยก 4 แทร็ก (ร้อง/กลอง/เบส/อื่นๆ)</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Vocal Volume Slider Popover */}
            {showSlider && isActive && currentJob?.status === 'ready' && (
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl p-4 w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-primary" />
                            <h4 className="text-sm font-black text-gray-900">
                                {currentJob.mode === 'pro' ? 'Pro Mixer' : 'AI Vocal Mixer'}
                            </h4>
                        </div>
                        <button 
                            onClick={handleTurnOff}
                            className="text-[10px] bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 font-bold px-2 py-1 rounded-full transition-colors"
                        >
                            ปิดใช้งาน
                        </button>
                    </div>

                    {renderTrackSlider('เสียงร้อง (Vocals)', 'vocals')}
                    
                    {currentJob.mode === 'pro' ? (
                        <>
                            {renderTrackSlider('เสียงกลอง (Drums)', 'drums')}
                            {renderTrackSlider('เสียงเบส (Bass)', 'bass')}
                            {renderTrackSlider('ดนตรีอื่นๆ (Other)', 'other')}
                        </>
                    ) : (
                        renderTrackSlider('เสียงดนตรี (Instrumental)', 'instrumental')
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[9px] text-gray-400 text-center uppercase tracking-wider font-bold">Powered by Demucs HTDEMUCS</p>
                    </div>
                </div>
            )}
        </div>
    );
};
