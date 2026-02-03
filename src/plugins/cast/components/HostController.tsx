import React, { useState, useEffect } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext'; // Legacy Context Import (to be refactored later)
import { DisconnectModal } from './DisconnectModal';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    BackwardIcon,
    PowerIcon,
    TvIcon
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
    // Hooks
    const {
        play, pause, next, previous,
        toggleMute, setVolume,
        state
    } = useFirebaseCast();

    const [localVolume, setLocalVolume] = useState(state.controls.volume ?? 100);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    // Sync volume
    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="w-full h-full bg-base-100 flex flex-col relative overflow-hidden">
            {/* 1. Status Header (Remote Look) */}
            <div className="bg-gradient-to-b from-base-200 to-base-100 p-4 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <TvIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">
                            {isCasting ? 'Connected to TV' : 'Dual Screen Mode'}
                        </h3>
                        <p className="text-xs text-primary font-mono bg-primary/5 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            Room: {roomCode}
                        </p>
                    </div>
                </div>

                {/* Disconnect Button (Top Right) */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="btn btn-ghost btn-sm text-error hover:bg-error/10 gap-2"
                >
                    <PowerIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Disconnect</span>
                </button>
            </div>

            {/* 2. Main Display Area (The "Now Playing") */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-base-100">
                <div className="w-32 h-32 bg-base-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${state.controls.isPlaying ? 'border-success animate-pulse' : 'border-base-300'}`}>
                        {state.controls.isPlaying ? '▶️' : '⏸️'}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold line-clamp-2 md:text-2xl px-4">
                        {currentVideoTitle || 'Ready to Play'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">
                        {state.controls.isPlaying ? 'Now Playing on TV' : 'Paused'}
                    </p>
                </div>
            </div>

            {/* 3. Control Deck (Separated from Video) */}
            <div className="bg-base-200 p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-base-300">
                {/* Progress (Visual Only for now) */}
                <div className="w-full h-1 bg-base-300 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-primary w-1/2 animate-pulse" />
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-8 mb-8">
                    <button onClick={previous} className="btn btn-circle btn-ghost btn-lg">
                        <BackwardIcon className="w-8 h-8" />
                    </button>

                    <button
                        onClick={state.controls.isPlaying ? pause : play}
                        className="btn btn-circle btn-primary btn-xl w-20 h-20 shadow-xl scale-100 hover:scale-105 active:scale-95 transition-transform"
                    >
                        {state.controls.isPlaying ? (
                            <PauseIcon className="w-10 h-10 text-white" />
                        ) : (
                            <PlayIcon className="w-10 h-10 text-white ml-2" />
                        )}
                    </button>

                    <button onClick={next} className="btn btn-circle btn-ghost btn-lg">
                        <ForwardIcon className="w-8 h-8" />
                    </button>
                </div>

                {/* Volume Deck */}
                <div className="flex items-center gap-4 bg-base-100 p-4 rounded-2xl">
                    <button onClick={toggleMute} className="btn btn-circle btn-ghost btn-sm">
                        {state.controls.isMuted ? (
                            <SpeakerXMarkIcon className="w-5 h-5 text-error" />
                        ) : (
                            <SpeakerWaveIcon className="w-5 h-5 text-gray-600" />
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
                    <span className="text-xs font-mono w-8 text-right">{localVolume}%</span>
                </div>
            </div>

            {/* Modals */}
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
