import React, { useState, useEffect } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    BackwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    PowerIcon,
    TvIcon,
    ComputerDesktopIcon,
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

    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white">

            {/* 1. Top Status Bar - Minimal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#161616]">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-white/60 text-xs tracking-wider font-light uppercase">
                        {isCasting ? 'TV Connected' : 'Dual Screen Active'}
                    </span>
                </div>
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs border border-white/10 px-3 py-1 rounded-full hover:bg-white/5"
                >
                    <PowerIcon className="w-3 h-3" />
                    <span>Disconnect</span>
                </button>
            </div>

            {/* 2. Main Center: Status & Connection */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-10">

                {/* Circular Device Icon */}
                <div className="relative group">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-700"></div>

                    {/* Circle Container */}
                    <div className="relative w-32 h-32 rounded-full border border-white/10 bg-[#1a1a1a] flex flex-col items-center justify-center shadow-2xl">
                        {isCasting ? (
                            <TvIcon className="w-10 h-10 text-primary mb-1" />
                        ) : (
                            <ComputerDesktopIcon className="w-10 h-10 text-primary mb-1" />
                        )}
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mt-1">Room</span>
                        <span className="text-xl font-bold text-white">{roomCode}</span>
                    </div>

                    {/* Status Badge below circle */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max">
                        <p className="text-sm font-light text-white/50">
                            {isCasting ? 'ควบคุมจอทีวี' : 'ควบคุมจอที่สอง'}
                        </p>
                    </div>
                </div>

                {/* Info Text / Current Song - Very Clean */}
                <div className="w-full max-w-md">
                    <p className="text-xs text-primary/70 mb-3 tracking-widest uppercase font-medium">Now Playing</p>
                    <h2 className="text-lg md:text-xl font-light leading-relaxed text-white/90 line-clamp-2">
                        {currentVideoTitle || 'Ready to play...'}
                    </h2>
                </div>
            </div>

            {/* 3. Bottom Control Deck - Darker Contrast */}
            <div className="bg-[#0f0f0f] border-t border-white/5 p-6 pb-8">
                <div className="max-w-md mx-auto space-y-6">

                    {/* Main Buttons */}
                    <div className="flex items-center justify-center gap-10">
                        <button onClick={previous} className="text-white/40 hover:text-white transition-colors p-2">
                            <BackwardIcon className="w-8 h-8" />
                        </button>

                        <button
                            onClick={state.controls.isPlaying ? pause : play}
                            className="w-16 h-16 rounded-full bg-primary hover:bg-primary-focus flex items-center justify-center text-white shadow-lg shadow-black/50 transition-all hover:scale-105 active:scale-95"
                        >
                            {state.controls.isPlaying ? (
                                <PauseIcon className="w-7 h-7" />
                            ) : (
                                <PlayIcon className="w-7 h-7 ml-1" />
                            )}
                        </button>

                        <button onClick={next} className="text-white/40 hover:text-white transition-colors p-2">
                            <ForwardIcon className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Volume Line */}
                    <div className="flex items-center gap-4 px-4">
                        <button onClick={toggleMute} className="text-white/30 hover:text-white transition-colors">
                            {state.controls.isMuted ? (
                                <SpeakerXMarkIcon className="w-4 h-4" />
                            ) : (
                                <SpeakerWaveIcon className="w-4 h-4" />
                            )}
                        </button>
                        <div className="flex-1 h-1 bg-white/10 rounded-full relative group cursor-pointer">
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                                style={{ width: `${localVolume}%` }}
                            />
                            {/* Invisible Slider overlay for interaction */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={localVolume}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setLocalVolume(val);
                                    setVolume(val);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

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
