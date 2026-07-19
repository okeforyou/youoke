import React from 'react';
import { Minimize2, X, Play, Pause } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useCast } from '../../../plugins/cast/context/CastContext';

interface MiniControlsProps {
    showMiniControls: boolean;
    layoutMode: string;
}

export const MiniControls = ({ showMiniControls, layoutMode }: MiniControlsProps) => {
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const cast = useCast();

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

    if (layoutMode !== 'fullscreen') return null;

    return (
        <div
            className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-default ${showMiniControls ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
            {/* Play/Pause */}
            <button
                onClick={handlePlayPause}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${isPlaying ? 'text-white/70 hover:text-white hover:bg-white/10' : 'bg-primary text-white'}`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-1" />

            {/* Exit Fullscreen Toggle */}
            <button
                onClick={toggleFullscreen}
                className="w-11 h-11 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                title="ย่อหน้าจอ"
            >
                <Minimize2 size={20} />
            </button>

            {/* Exit to Split Mode */}
            <button
                onClick={() => usePlayerStore.getState().setLayoutMode('split')}
                className="w-11 h-11 flex items-center justify-center rounded-full text-red-400 hover:text-white hover:bg-red-500 transition-all active:scale-90"
                title="ออกจากหน้าจอเต็มจอ"
            >
                <X size={20} strokeWidth={3} />
            </button>
        </div>
    );
};
