import React from 'react';
import { useMixerStore } from '../stores/useMixerStore';
import { useShallow } from 'zustand/react/shallow';

export const AudioMixer = () => {
    const { volumes, trackStates, setVolume, toggleMute, toggleSolo } = useMixerStore(
        useShallow(state => ({
            volumes: state.volumes,
            trackStates: state.trackStates,
            setVolume: state.setVolume,
            toggleMute: state.toggleMute,
            toggleSolo: state.toggleSolo
        }))
    );

    return (
        <div className="bg-[#101014]/90 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A35]/50 shadow-2xl relative overflow-hidden">
            {/* Fake Waveform Background */}
            <div className="absolute top-0 left-0 right-0 h-16 opacity-10 pointer-events-none flex items-center justify-center gap-[2px] px-4">
                {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="w-1 bg-[#00E5FF] rounded-full" style={{ height: `${Math.random() * 40 + 10}px` }}></div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="text-white text-sm font-bold flex items-center justify-between">
                    <span>✨ AI Audio Mixer</span>
                    <span className="text-[10px] bg-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded-full border border-[#00E5FF]/30">YouOke AI</span>
                </div>
                
                {/* Vocals Track */}
                <div className="flex items-center gap-4 bg-[#1C1C24]/80 p-4 rounded-xl border border-[#2A2A35]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleMute('vocals')}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.vocals.muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={() => toggleSolo('vocals')}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.vocals.solo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            S
                        </button>
                    </div>
                    <div className="text-gray-400 flex-shrink-0 w-8 flex justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="range"
                            min="0" max="100"
                            value={volumes.vocals}
                            onChange={(e) => setVolume('vocals', parseInt(e.target.value))}
                            className="w-full h-1 bg-[#2A2A35] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#00E5FF] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,229,255,0.5)] relative z-10"
                        />
                        <div className="absolute left-0 h-1 bg-[#00E5FF] rounded-full pointer-events-none" style={{ width: `${volumes.vocals}%` }}></div>
                    </div>
                    <div className="text-xs font-mono text-gray-400 w-8 text-right">{volumes.vocals}</div>
                </div>

                {/* Instrumental Track */}
                <div className="flex items-center gap-4 bg-[#1C1C24]/80 p-4 rounded-xl border border-[#2A2A35]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleMute('instrumental')}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.instrumental.muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={() => toggleSolo('instrumental')}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.instrumental.solo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            S
                        </button>
                    </div>
                    <div className="text-gray-400 flex-shrink-0 w-8 flex justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="range"
                            min="0" max="100"
                            value={volumes.instrumental}
                            onChange={(e) => setVolume('instrumental', parseInt(e.target.value))}
                            className="w-full h-1 bg-[#2A2A35] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#00E5FF] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,229,255,0.5)] relative z-10"
                        />
                        <div className="absolute left-0 h-1 bg-[#00E5FF] rounded-full pointer-events-none" style={{ width: `${volumes.instrumental}%` }}></div>
                    </div>
                    <div className="text-xs font-mono text-gray-400 w-8 text-right">{volumes.instrumental}</div>
                </div>
            </div>
        </div>
    );
};
