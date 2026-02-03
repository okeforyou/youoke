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

    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a] text-white">

            {/* 1. Top Bar: Disconnect Only */}
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {isCasting ? 'TV Connected' : 'Dual Mode'}
                </div>
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 px-3 py-1.5 rounded-full transition-colors text-sm"
                >
                    <PowerIcon className="w-4 h-4" />
                    <span>ตัดการเชื่อมต่อ</span>
                </button>
            </div>

            {/* 2. Main Center: Status & Connection */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">

                {/* Connection Icon */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <div className="relative w-24 h-24 bg-[#2a2a2a] rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
                        {isCasting ? (
                            <TvIcon className="w-10 h-10 text-primary" />
                        ) : (
                            <ComputerDesktopIcon className="w-10 h-10 text-primary" />
                        )}
                    </div>
                    {/* Room Badge */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-content text-xs font-bold px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                        ห้อง {roomCode}
                    </div>
                </div>

                {/* Info Text */}
                <div>
                    <h2 className="text-xl font-medium text-white/90">
                        {isCasting ? 'กำลังควบคุม TV' : 'กำลังควบคุมหน้าจอที่ 2'}
                    </h2>

                    {currentVideoTitle ? (
                        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 max-w-sm mx-auto">
                            <p className="text-xs text-white/40 mb-1 uppercase">Now Playing</p>
                            <p className="text-sm font-medium line-clamp-2 text-white/80">
                                {currentVideoTitle}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-white/40 mt-2">พร้อมสำหรับเพลงถัดไป</p>
                    )}
                </div>
            </div>

            {/* 3. Footer Control Bar */}
            <div className="bg-[#252525] p-6 border-t border-white/5">
                <div className="max-w-md mx-auto">
                    {/* Controls */}
                    <div className="flex items-center justify-center gap-8 mb-6">
                        <button onClick={previous} className="text-white/60 hover:text-white transition-colors">
                            <BackwardIcon className="w-8 h-8" />
                        </button>

                        <button
                            onClick={state.controls.isPlaying ? pause : play}
                            className="w-16 h-16 bg-primary hover:bg-primary-focus rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
                        >
                            {state.controls.isPlaying ? (
                                <PauseIcon className="w-8 h-8" />
                            ) : (
                                <PlayIcon className="w-8 h-8 ml-1" />
                            )}
                        </button>

                        <button onClick={next} className="text-white/60 hover:text-white transition-colors">
                            <ForwardIcon className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Simple Volume */}
                    <div className="flex items-center gap-3">
                        <button onClick={toggleMute} className="text-white/40 hover:text-white">
                            {state.controls.isMuted ? (
                                <SpeakerXMarkIcon className="w-5 h-5" />
                            ) : (
                                <SpeakerWaveIcon className="w-5 h-5" />
                            )}
                        </button>
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${localVolume}%` }}
                            />
                        </div>
                        {/* Hidden Input for interaction */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={localVolume}
                            className="absolute opacity-0 w-full h-8 cursor-pointer" // Hack to make volume changable but invisible slider style
                            style={{ maxWidth: '28rem' }}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setLocalVolume(val);
                                setVolume(val);
                            }}
                        />
                        <span className="text-xs text-white/40 font-mono w-8 text-right">{localVolume}</span>
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
