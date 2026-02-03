import React, { useState, useEffect } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    BackwardIcon,
    XMarkIcon
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

    const [localVolume, setLocalVolume] = useState(state.controls.volume ?? 100);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    const videoId = state.currentVideo?.videoId || '';
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : '';

    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            {/* Background: Blurred Glass Effect */}
            {thumbnailUrl && (
                <div
                    className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110"
                    style={{ backgroundImage: `url(${thumbnailUrl})` }}
                />
            )}
            <div className="absolute inset-0 bg-black/70" />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col">

                {/* Top: Disconnect Button Only */}
                <div className="flex justify-end p-4">
                    <button
                        onClick={() => setIsDisconnectModalOpen(true)}
                        className="flex items-center gap-2 text-white/50 hover:text-red-400 px-3 py-2 rounded-lg transition-all hover:bg-white/5"
                    >
                        <XMarkIcon className="w-5 h-5" />
                        <span className="text-sm">ยกเลิก</span>
                    </button>
                </div>

                {/* Center: Connection Status */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">

                    {/* Animated Rings */}
                    <div className="relative mb-8">
                        {/* Outer ring - pulsing */}
                        <div className={`absolute inset-0 w-32 h-32 rounded-full ${state.controls.isPlaying
                                ? 'bg-primary/20 animate-ping'
                                : 'bg-white/5'
                            }`} style={{ animationDuration: '2s' }} />

                        {/* Middle ring */}
                        <div className={`absolute inset-2 w-28 h-28 rounded-full border ${state.controls.isPlaying
                                ? 'border-primary/40'
                                : 'border-white/10'
                            }`} />

                        {/* Center circle with status */}
                        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${state.controls.isPlaying
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'bg-white/5 border-2 border-white/20'
                            }`}>
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${state.controls.isPlaying ? 'text-primary' : 'text-white/40'
                                    }`}>
                                    {roomCode}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection Text */}
                    <div className="space-y-2">
                        <p className="text-white/40 text-sm">
                            {state.controls.isPlaying ? 'กำลังเล่น' : 'หยุดชั่วคราว'}
                        </p>
                        <h3 className="text-white text-xl font-medium">
                            เชื่อมต่อหน้าจอที่ 2
                        </h3>
                        <p className="text-white/30 text-sm">
                            {isCasting ? 'TV Mode' : 'Dual Screen Mode'}
                        </p>
                    </div>

                    {/* Song Title - Very subtle */}
                    {currentVideoTitle && (
                        <p className="text-white/20 text-xs mt-6 line-clamp-1 max-w-xs">
                            {currentVideoTitle}
                        </p>
                    )}
                </div>

                {/* Bottom: Control Deck */}
                <div className="p-4 sm:p-6">
                    {/* Main Controls */}
                    <div className="flex items-center justify-center gap-6 sm:gap-8 mb-4">
                        <button
                            onClick={previous}
                            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <BackwardIcon className="w-6 h-6 text-white" />
                        </button>

                        <button
                            onClick={state.controls.isPlaying ? pause : play}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-all shadow-lg shadow-primary/30"
                        >
                            {state.controls.isPlaying ? (
                                <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            ) : (
                                <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
                            )}
                        </button>

                        <button
                            onClick={next}
                            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <ForwardIcon className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-3 max-w-sm mx-auto">
                        <button
                            onClick={toggleMute}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            {state.controls.isMuted ? (
                                <SpeakerXMarkIcon className="w-5 h-5 text-red-400" />
                            ) : (
                                <SpeakerWaveIcon className="w-5 h-5 text-white/70" />
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={localVolume}
                            className="range range-primary range-xs flex-1"
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setLocalVolume(val);
                                setVolume(val);
                            }}
                        />
                        <span className="text-white/50 text-xs font-mono w-8 text-right">{localVolume}%</span>
                    </div>
                </div>
            </div>

            {/* Disconnect Modal */}
            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => {
                    setIsDisconnectModalOpen(false);
                    onDisconnect();
                }}
            />
        </div>
    );
};
