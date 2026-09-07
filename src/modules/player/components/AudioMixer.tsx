import React from 'react';
import { useMixerStore } from '../stores/useMixerStore';
import { useShallow } from 'zustand/react/shallow';

export const AudioMixer = () => {
    const { volumes, trackStates, pitchShift, playbackRate, setVolume, toggleMute, toggleSolo, setPitchShift, setPlaybackRate, resetPitchAndSpeed } = useMixerStore(
        useShallow(state => ({
            volumes: state.volumes,
            trackStates: state.trackStates,
            pitchShift: state.pitchShift ?? 0,
            playbackRate: state.playbackRate ?? 1.0,
            setVolume: state.setVolume,
            toggleMute: state.toggleMute,
            toggleSolo: state.toggleSolo,
            setPitchShift: state.setPitchShift,
            setPlaybackRate: state.setPlaybackRate,
            resetPitchAndSpeed: state.resetPitchAndSpeed
        }))
    );

    return (
        <div className="bg-[#101014]/95 backdrop-blur-md rounded-2xl p-6 border border-[#2A2A35]/50 shadow-2xl relative overflow-hidden flex flex-col gap-5">
            {/* Fake Waveform Background */}
            <div className="absolute top-0 left-0 right-0 h-16 opacity-10 pointer-events-none flex items-center justify-center gap-[2px] px-4">
                {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="w-1 bg-[#00E5FF] rounded-full" style={{ height: `${Math.random() * 40 + 10}px` }}></div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="text-white text-sm font-bold flex items-center justify-between">
                    <span>✨ AI Audio Studio & Mixer</span>
                    <span className="text-[10px] bg-[#00E5FF]/20 text-[#00E5FF] px-2 py-0.5 rounded-full border border-[#00E5FF]/30">YouOke Pro</span>
                </div>

                {/* 🎼 Key Transpose & Speed Controls */}
                <div className="bg-[#181820] p-3.5 rounded-xl border border-[#2A2A35] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-300">🎹 Key:</span>
                        <div className="flex items-center bg-[#101014] p-1 rounded-lg border border-[#2A2A35]">
                            <button
                                onClick={() => setPitchShift(pitchShift - 1)}
                                disabled={pitchShift <= -6}
                                className="w-7 h-7 rounded bg-[#2A2A35] hover:bg-[#3A3A4A] text-white text-xs font-bold disabled:opacity-30 transition-colors"
                                title="ลดคีย์ (-1 semitone)"
                            >
                                ♭
                            </button>
                            <span className="px-3 text-xs font-mono font-bold text-[#00E5FF]">
                                {pitchShift === 0 ? 'ORIG' : (pitchShift > 0 ? `+${pitchShift}` : `${pitchShift}`)}
                            </span>
                            <button
                                onClick={() => setPitchShift(pitchShift + 1)}
                                disabled={pitchShift >= 6}
                                className="w-7 h-7 rounded bg-[#2A2A35] hover:bg-[#3A3A4A] text-white text-xs font-bold disabled:opacity-30 transition-colors"
                                title="เพิ่มคีย์ (+1 semitone)"
                            >
                                ♯
                            </button>
                        </div>
                        {pitchShift !== 0 && (
                            <button
                                onClick={() => setPitchShift(0)}
                                className="text-[11px] text-gray-400 hover:text-white underline px-1"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-300">⚡ Speed:</span>
                        <div className="flex items-center gap-1 bg-[#101014] p-1 rounded-lg border border-[#2A2A35]">
                            {[0.75, 1.0, 1.25].map(rate => (
                                <button
                                    key={rate}
                                    onClick={() => setPlaybackRate(rate)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${playbackRate === rate ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🎤 Vocals Track */}
                <div className="flex items-center gap-4 bg-[#1C1C24]/80 p-3.5 rounded-xl border border-[#2A2A35]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleMute('vocals')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.vocals.muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={() => toggleSolo('vocals')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.vocals.solo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            S
                        </button>
                    </div>
                    <span className="text-xs font-medium text-gray-300 w-16">🎤 Vocals</span>
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

                {/* 🎶 Instrumental Track */}
                <div className="flex items-center gap-4 bg-[#1C1C24]/80 p-3.5 rounded-xl border border-[#2A2A35]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleMute('instrumental')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.instrumental.muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={() => toggleSolo('instrumental')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.instrumental.solo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            S
                        </button>
                    </div>
                    <span className="text-xs font-medium text-gray-300 w-16">🎶 Music</span>
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

                {/* 🥁 Drums Track */}
                <div className="flex items-center gap-4 bg-[#1C1C24]/80 p-3.5 rounded-xl border border-[#2A2A35]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleMute('drums')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.drums.muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={() => toggleSolo('drums')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.drums.solo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            S
                        </button>
                    </div>
                    <span className="text-xs font-medium text-gray-300 w-16">🥁 Drums</span>
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="range"
                            min="0" max="100"
                            value={volumes.drums}
                            onChange={(e) => setVolume('drums', parseInt(e.target.value))}
                            className="w-full h-1 bg-[#2A2A35] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#00E5FF] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,229,255,0.5)] relative z-10"
                        />
                        <div className="absolute left-0 h-1 bg-[#00E5FF] rounded-full pointer-events-none" style={{ width: `${volumes.drums}%` }}></div>
                    </div>
                    <div className="text-xs font-mono text-gray-400 w-8 text-right">{volumes.drums}</div>
                </div>

                {/* 🎸 Bass Track */}
                <div className="flex items-center gap-4 bg-[#1C1C24]/80 p-3.5 rounded-xl border border-[#2A2A35]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => toggleMute('bass')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.bass.muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={() => toggleSolo('bass')}
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${trackStates.bass.solo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#2A2A35] text-gray-400 hover:text-white'}`}
                        >
                            S
                        </button>
                    </div>
                    <span className="text-xs font-medium text-gray-300 w-16">🎸 Bass</span>
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="range"
                            min="0" max="100"
                            value={volumes.bass}
                            onChange={(e) => setVolume('bass', parseInt(e.target.value))}
                            className="w-full h-1 bg-[#2A2A35] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#00E5FF] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,229,255,0.5)] relative z-10"
                        />
                        <div className="absolute left-0 h-1 bg-[#00E5FF] rounded-full pointer-events-none" style={{ width: `${volumes.bass}%` }}></div>
                    </div>
                    <div className="text-xs font-mono text-gray-400 w-8 text-right">{volumes.bass}</div>
                </div>
            </div>
        </div>
    );
};
