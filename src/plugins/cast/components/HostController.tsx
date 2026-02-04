import React from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    BackwardIcon
} from '@heroicons/react/24/solid';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}

export const HostController: React.FC<HostControllerProps> = ({
    isCasting,
    isDualMode,
    roomCode,
    onDisconnect,
    currentVideoTitle
}) => {
    const {
        play, pause, next, previous,
        toggleMute, setVolume,
        state
    } = useFirebaseCast();

    const [localVolume, setLocalVolume] = React.useState(state.controls.volume ?? 100);

    React.useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    const handleDisconnectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDisconnect();
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-900" />

            {/* Status Overlay (Centered) */}
            <div className="absolute inset-x-0 top-0 bottom-20 z-[10] flex flex-col items-center justify-center text-center p-6">
                <div className="text-4xl md:text-5xl mb-4 animate-pulse">
                    {isCasting ? '📺' : '🖥️'}
                </div>
                <h2 className="text-lg md:text-xl font-bold mb-2 text-white">
                    {isCasting
                        ? `เชื่อมต่อกับ TV (ห้อง: ${roomCode})`
                        : 'โหมดหน้าจอที่ 2'}
                </h2>
                <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto line-clamp-2">
                    {currentVideoTitle
                        ? <span className="text-primary font-medium">กำลังเล่น: {currentVideoTitle}</span>
                        : 'พร้อมรับคำสั่งจากเมนูเพลง'
                    }
                </p>
                {isDualMode && (
                    <button onClick={handleDisconnectClick} className="btn btn-xs btn-outline btn-error mt-4 rounded-full">
                        ปิดโหมด 2 หน้าจอ
                    </button>
                )}
            </div>

            {/* Control Bar (Bottom) */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-6 z-[20]">

                {/* Left: Volume Controls */}
                <div className="flex items-center gap-3 w-1/3">
                    <button onClick={toggleMute} className="text-gray-300 hover:text-white transition-colors">
                        {state.controls.isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-red-500" /> : <SpeakerWaveIcon className="w-6 h-6" />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={localVolume}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setLocalVolume(val);
                            setVolume(val);
                        }}
                        className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary hover:h-2 transition-all"
                    />
                </div>

                {/* Center: Playback Controls */}
                <div className="flex items-center justify-center gap-6 w-1/3">
                    <button onClick={previous} className="text-gray-400 hover:text-white transition-colors">
                        <BackwardIcon className="w-8 h-8" />
                    </button>
                    <button
                        onClick={state.controls.isPlaying ? pause : play}
                        className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        {state.controls.isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}
                    </button>
                    <button onClick={next} className="text-gray-400 hover:text-white transition-colors">
                        <ForwardIcon className="w-8 h-8" />
                    </button>
                </div>

                {/* Right: Disconnect */}
                <div className="flex items-center justify-end gap-3 w-1/3">
                    {isCasting && (
                        <button
                            onClick={handleDisconnectClick}
                            className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                            ตัดการเชื่อมต่อ
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
