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
    SignalIcon
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
            {/* Background: Video Thumbnail with Overlay */}
            {thumbnailUrl && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
                </>
            )}

            {/* Fallback Background */}
            {!thumbnailUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
            )}

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col">

                {/* Top Bar: Status + Disconnect */}
                <div className="flex items-center justify-between p-4">
                    {/* Connection Status */}
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
                        <div className="flex items-center gap-2">
                            <SignalIcon className="w-4 h-4 text-green-500" />
                            <span className="text-white/70 text-sm">
                                {isCasting ? 'TV' : 'Dual Screen'}
                            </span>
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="flex items-center gap-1">
                            <TvIcon className="w-4 h-4 text-primary" />
                            <span className="text-white font-medium text-sm">{roomCode}</span>
                        </div>
                    </div>

                    {/* Disconnect Button */}
                    <button
                        onClick={() => setIsDisconnectModalOpen(true)}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 px-3 py-2 rounded-full transition-all border border-red-500/30"
                    >
                        <XMarkIcon className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">Disconnect</span>
                    </button>
                </div>

                {/* Center: Now Playing Info */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Playing Status Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all ${state.controls.isPlaying
                            ? 'bg-primary/30 border-2 border-primary shadow-lg shadow-primary/20'
                            : 'bg-white/10 border-2 border-white/20'
                        }`}>
                        {state.controls.isPlaying ? (
                            <SpeakerWaveIcon className="w-10 h-10 text-white animate-pulse" />
                        ) : (
                            <PauseIcon className="w-10 h-10 text-white/60" />
                        )}
                    </div>

                    {/* Status Text */}
                    <div className="space-y-2">
                        <p className="text-white/60 text-sm uppercase tracking-wider">
                            {state.controls.isPlaying ? 'Now Playing' : 'Paused'}
                        </p>
                        <h2 className="text-white text-xl md:text-2xl font-bold line-clamp-2 max-w-md">
                            {currentVideoTitle || 'Ready to Play'}
                        </h2>
                        <p className="text-white/40 text-sm">
                            on {isCasting ? 'TV' : 'Second Screen'}
                        </p>
                    </div>
                </div>

                {/* Bottom: Control Deck */}
                <div className="bg-black/50 backdrop-blur-md p-4 sm:p-6 border-t border-white/10">
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
