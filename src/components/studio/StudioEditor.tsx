import React, { useState, useEffect, useRef } from 'react';
import { 
    XMarkIcon, 
    PlayIcon, 
    PauseIcon, 
    ArrowDownTrayIcon, 
    MicrophoneIcon, 
    SpeakerWaveIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useAIVocalStore } from '@/stores/useAIVocalStore';

interface StudioEditorProps {
    songId: string;
    title: string;
    artist: string;
    onClose: () => void;
}

interface TrackControlProps {
    label: string;
    icon: React.ReactNode;
    color: string;
    volume: number;
    isMuted: boolean;
    isSolo: boolean;
    onVolumeChange: (val: number) => void;
    onMuteToggle: () => void;
    onSoloToggle: () => void;
}

const TrackControl = ({ label, icon, color, volume, isMuted, isSolo, onVolumeChange, onMuteToggle, onSoloToggle }: TrackControlProps) => (
    <div className="bg-zinc-900/50 rounded-2xl p-4 flex flex-col items-center gap-4 border border-zinc-800/50 relative group transition-all hover:bg-zinc-800/50">
        <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} bg-opacity-20`}>
                <div className={color.replace('bg-', 'text-')}>{icon}</div>
            </div>
            <span className="text-sm font-bold text-white">{label}</span>
        </div>

        {/* Vertical Fader */}
        <div className="relative h-32 w-12 flex justify-center group-hover:scale-105 transition-transform">
            <input 
                type="range" 
                min="0" max="100" 
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="absolute top-1/2 -translate-y-1/2 w-32 h-2 -rotate-90 appearance-none bg-zinc-800 rounded-full cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                style={{
                    background: `linear-gradient(to right, ${isMuted ? '#52525b' : color.replace('bg-', '')} ${(isMuted ? 0 : volume)}%, #27272a ${(isMuted ? 0 : volume)}%)`
                }}
            />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-2">
            <button 
                onClick={onMuteToggle}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isMuted ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
            >
                M
            </button>
            <button 
                onClick={onSoloToggle}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isSolo ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
            >
                S
            </button>
        </div>
    </div>
);

export default function StudioEditor({ songId, title, artist, onClose }: StudioEditorProps) {
    const { jobs, processAudio } = useAIVocalStore();
    const job = jobs[songId];

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    // Mock Volumes for Demo
    const [volumes, setVolumes] = useState({
        vocals: 100,
        instrumental: 100,
        drums: 100,
        bass: 100
    });
    const [mutes, setMutes] = useState({ vocals: false, instrumental: false, drums: false, bass: false });
    const [solos, setSolos] = useState({ vocals: false, instrumental: false, drums: false, bass: false });

    useEffect(() => {
        // Trigger AI processing when opened (if not ready)
        if (!job || job.status !== 'ready') {
            processAudio(songId, title, 'pro', true).catch(console.error);
        }
    }, [songId, title]);

    const handleVolumeChange = (track: keyof typeof volumes, val: number) => {
        setVolumes(prev => ({ ...prev, [track]: val }));
    };

    const handleMute = (track: keyof typeof mutes) => {
        setMutes(prev => ({ ...prev, [track]: !prev[track] }));
    };

    const handleSolo = (track: keyof typeof solos) => {
        const nextSolo = !solos[track];
        setSolos(prev => ({ ...prev, [track]: nextSolo }));
        
        // If Solo is turned on, mute everything else
        if (nextSolo) {
            const newMutes = { vocals: true, instrumental: true, drums: true, bass: true };
            newMutes[track] = false;
            setMutes(newMutes);
        } else {
            // Unmute all if solo is turned off
            setMutes({ vocals: false, instrumental: false, drums: false, bass: false });
        }
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Topbar */}
            <header className="h-20 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
                        <p className="text-sm text-zinc-400">{artist}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-bold border border-red-500/20">
                        <MicrophoneIcon className="w-5 h-5" />
                        บันทึกเสียงร้อง (เร็วๆนี้)
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors text-sm font-bold shadow-lg shadow-primary/20">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Export
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 items-center justify-center relative">
                
                {/* Status Overlay */}
                {(!job || job.status !== 'ready') && (
                    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
                        <h3 className="text-2xl font-bold text-white mb-2">กำลังประมวลผลเสียงด้วย AI</h3>
                        <p className="text-zinc-400">{job?.message || "กำลังส่งไฟล์เข้าสู่ Local Bridge..."}</p>
                        
                        {/* Progress Bar */}
                        <div className="w-64 h-2 bg-zinc-800 rounded-full mt-6 overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${job?.progress || 0}%` }}></div>
                        </div>
                    </div>
                )}

                {/* Mixer Console */}
                <div className="w-full max-w-5xl">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <AdjustmentsHorizontalIcon className="w-6 h-6 text-primary" />
                            Studio Mixer
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TrackControl 
                            label="Vocals" 
                            icon={<MicrophoneIcon className="w-6 h-6" />}
                            color="bg-purple-500"
                            volume={volumes.vocals}
                            isMuted={mutes.vocals}
                            isSolo={solos.vocals}
                            onVolumeChange={(val) => handleVolumeChange('vocals', val)}
                            onMuteToggle={() => handleMute('vocals')}
                            onSoloToggle={() => handleSolo('vocals')}
                        />
                        <TrackControl 
                            label="Instrumental" 
                            icon={<SpeakerWaveIcon className="w-6 h-6" />}
                            color="bg-emerald-500"
                            volume={volumes.instrumental}
                            isMuted={mutes.instrumental}
                            isSolo={solos.instrumental}
                            onVolumeChange={(val) => handleVolumeChange('instrumental', val)}
                            onMuteToggle={() => handleMute('instrumental')}
                            onSoloToggle={() => handleSolo('instrumental')}
                        />
                        <TrackControl 
                            label="Bass" 
                            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>}
                            color="bg-amber-500"
                            volume={volumes.bass}
                            isMuted={mutes.bass}
                            isSolo={solos.bass}
                            onVolumeChange={(val) => handleVolumeChange('bass', val)}
                            onMuteToggle={() => handleMute('bass')}
                            onSoloToggle={() => handleSolo('bass')}
                        />
                        <TrackControl 
                            label="Drums" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                            color="bg-blue-500"
                            volume={volumes.drums}
                            isMuted={mutes.drums}
                            isSolo={solos.drums}
                            onVolumeChange={(val) => handleVolumeChange('drums', val)}
                            onMuteToggle={() => handleMute('drums')}
                            onSoloToggle={() => handleSolo('drums')}
                        />
                    </div>
                </div>

            </div>

            {/* Transport / Player Bar */}
            <div className="h-24 bg-zinc-950 border-t border-white/5 flex items-center px-6 gap-6 shrink-0 z-30">
                <button 
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                    {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                </button>
                
                <div className="flex-1 flex items-center gap-4">
                    <span className="text-xs font-mono text-zinc-500">00:00</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden cursor-pointer">
                        <div className="h-full bg-white w-1/3"></div>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">03:45</span>
                </div>
            </div>
        </div>
    );
}
