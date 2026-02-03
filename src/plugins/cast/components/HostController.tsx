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
    XMarkIcon,
    TvIcon,
    ComputerDesktopIcon
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

    // Get video thumbnail
    const videoId = state.currentVideo?.videoId || '';
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : '';

    // Sync volume
    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* Background: Video Thumbnail with HEAVY Dark Overlay */}
            {thumbnailUrl && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />
                    <div className="absolute inset-0 bg-black/85" />
                </>
            )}

            {/* Fallback Background */}
            {!thumbnailUrl && (
                <div className="absolute inset-0 bg-black" />
            )}

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col">

                {/* Top Bar: Status + Disconnect */}
                <div className="flex items-center justify-between p-4">
                    {/* Connection Status */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white/70 text-sm">
                            {isCasting ? 'เชื่อมต่อกับ TV' : 'โหมด 2 หน้าจอ'}
                        </span>
                        <span className="text-white font-medium">ห้อง {roomCode}</span>
                    </div>

                    {/* Disconnect Button */}
                    <button
                        onClick={() => setIsDisconnectModalOpen(true)}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 px-3 py-2 rounded-full transition-all"
                    >
                        <XMarkIcon className="w-4 h-4" />
                        <span className="text-sm">ตัดการเชื่อมต่อ</span>
                    </button>
                </div>

                {/* Center: Connected Device Display */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Device Icon */}
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 ${state.controls.isPlaying
                            ? 'bg-primary/20 border border-primary/50'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                        {isCasting ? (
                            <TvIcon className={`w-12 h-12 ${state.controls.isPlaying ? 'text-primary' : 'text-white/40'}`} />
                        ) : (
                            <ComputerDesktopIcon className={`w-12 h-12 ${state.controls.isPlaying ? 'text-primary' : 'text-white/40'}`} />
                        )}
                    </div>

                    {/* Status */}
                    <p className="text-white/50 text-sm mb-2">
                        {state.controls.isPlaying ? 'กำลังเล่นบน' : 'หยุดชั่วคราว'}
                    </p>
                    <h3 className="text-white text-lg font-medium mb-4">
                        {isCasting ? 'TV' : 'หน้าจอที่ 2'}
                    </h3>

                    {/* Song Title - Smaller */}
                    {currentVideoTitle && (
                        <p className="text-white/40 text-sm line-clamp-1 max-w-xs">
                            {currentVideoTitle}
                        </p>
                    )}
                </div>

                {/* Bottom: Control Deck */}
                <div className="bg-white/5 p-4 sm:p-6 border-t border-white/10">
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
