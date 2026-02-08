import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

// Define context shape
interface MidiEngineContextType {
    isReady: boolean;
    isLoading: boolean;
    isPlaying: boolean;
    error: string | null;
    currentTime: number;
    duration: number;
    loadSoundFont: (url: string) => Promise<void>;
    playMidi: (midiBuffer: ArrayBuffer) => Promise<void>;
    stop: () => void;
    setVolume: (volume: number) => void;
    synth: any;
}

const MidiEngineContext = createContext<MidiEngineContextType | undefined>(undefined);

export function MidiEngineProvider({ children }: { children: ReactNode }) {
    const [lib, setLib] = useState<any>(null);
    const [synth, setSynth] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Load SpessaSynth Library dynamically
    useEffect(() => {
        let mounted = true;
        import('spessasynth_lib')
            .then((module) => {
                if (mounted) {
                    console.log('🎹 SpessaSynth Lib Loaded');
                    setLib(module);
                }
            })
            .catch(err => {
                console.error('Failed to load spessasynth_lib:', err);
                if (mounted) setError('Failed to load MIDI engine library');
            });
        return () => { mounted = false; };
    }, []);

    const loadSoundFont = async (url: string) => {
        if (!lib) return;
        setIsLoading(true);
        setError(null);
        try {
            console.log(`🎹 Loading SoundFont from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch SoundFont: ${response.statusText}`);
            const buffer = await response.arrayBuffer();

            // Create AudioContext
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Debug Exports
            const keys = Object.keys(lib);
            console.log("📚 Lib exports:", JSON.stringify(keys));

            // 1. Select Synth Class: Prioritize WorkletSynthesizer (Main Thread) for stability
            // WorkerSynthesizer (Web Worker) caused protocol mismatch errors.
            const WorkerSynthClass = lib.WorkerSynthesizer || (lib as any).default?.WorkerSynthesizer;
            const WorkletSynthClass = lib.WorkletSynthesizer || (lib as any).default?.WorkletSynthesizer;

            // FORCE WORKLET (Main Thread) to debug sound
            let SynthClassToUse = WorkletSynthClass;
            let synthType = 'WorkletSynthesizer';

            /* 
            // Previous Worker Logic (Disabled for Debugging)
            if (WorkerSynthClass) {
                SynthClassToUse = WorkerSynthClass;
                synthType = 'WorkerSynthesizer';
            } else {
                SynthClassToUse = WorkletSynthClass;
                synthType = 'WorkletSynthesizer';
            }
            */

            if (!SynthClassToUse) {
                const debugKeys = JSON.stringify(keys);
                throw new Error(`No compatible Synth class found. Exports: ${debugKeys}`);
            }

            console.log(`🔨 Initializing ${synthType}...`);

            // 2. Load AudioWorklet (Required for most synth types in v4)
            // We use LOCAL path to avoid CORS.
            try {
                const workletUrl = "/lib/spessasynth/spessasynth_processor.min.js";
                console.log("🔌 Adding AudioWorklet Module (Local)...", workletUrl);
                await ctx.audioWorklet.addModule(workletUrl);
            } catch (wkErr: any) {
                console.error("Failed to load local worklet module", wkErr);
            }

            // 3. Instantiate
            let newSynth: any;
            try {
                if (synthType === 'WorkerSynthesizer') {
                    console.log("👷 Spawning Synth Worker...");
                    // IMPORTANT: Must use type: "module" because synth_worker.js is an ESM
                    const worker = new Worker('/lib/spessasynth/synth_worker.js', { type: "module" });

                    // Instantiate using the worker
                    // WorkerSynthesizer expects (ctx, postMessageCallback)
                    // The callback signature is (message, transfer) => void
                    newSynth = new WorkerSynthClass(ctx, (msg: any, transfer: Transferable[]) => {
                        worker.postMessage(msg, transfer);
                    });

                    worker.onmessage = (e) => {
                        // Check available handlers
                        if (newSynth.handleWorkerMessage) {
                            newSynth.handleWorkerMessage(e.data);
                        } else if (newSynth.onWorkerMessage) {
                            newSynth.onWorkerMessage(e.data);
                        } else if ((newSynth as any).handleMessage) {
                            (newSynth as any).handleMessage(e.data);
                        }
                    };
                } else {
                    newSynth = new SynthClassToUse(ctx, buffer, { processorUrl: "/lib/spessasynth/spessasynth_processor.min.js" });
                }

                if (newSynth instanceof Promise) newSynth = await newSynth;
            } catch (instErr: any) {
                console.error("Synth Constructor Failed:", instErr);
                throw instErr;
            }

            if (newSynth instanceof Promise) await newSynth;

            // Load Soundbank if not loaded by constructor
            console.log("🎹 Adding SoundBank...");
            try {
                await newSynth.soundBankManager.addSoundBank(buffer, "default_sf2");
            } catch (e: any) {
                // Ignore if already loaded
            }

            setSynth(newSynth);

            // Initialize Sequencer & Bind Events
            const SequencerClass = lib.Sequencer || (lib as any).default?.Sequencer;
            if (SequencerClass) {
                console.log("🎹 Initializing Sequencer & Events...");
                const seq = new SequencerClass(newSynth);

                // Bind Events
                seq.eventHandler.addEvent("timeChange", "ctx-time", (t: number) => {
                    setCurrentTime(t);
                });

                seq.eventHandler.addEvent("songChange", "ctx-song", (mid: any) => {
                    console.log("🎵 Song Changed:", mid);
                    setDuration(mid.duration || 0);
                    setCurrentTime(0);
                });

                seq.eventHandler.addEvent("songEnded", "ctx-end", () => {
                    console.log("🏁 Song Ended");
                    setIsPlaying(false);
                    setCurrentTime(0);
                });

                (newSynth as any).sequencer = seq;
            }

            setIsReady(true);
            console.log(`✅ MIDI Engine Ready: ${synthType}`);

        } catch (err: any) {
            console.error('SoundFont Load Error:', err);
            setError(err.message || 'Failed to load SoundFont');
        } finally {
            setIsLoading(false);
        }
    };

    const playMidi = async (midiBuffer: ArrayBuffer) => {
        if (!synth) {
            setError("Engine not ready");
            return;
        }

        const sequencer = (synth as any).sequencer;
        if (!sequencer) {
            setError("Sequencer not initialized (or synth not ready)");
            return;
        }

        try {
            setIsPlaying(true);
            setError(null);

            console.log("▶️ Loading MIDI to Sequencer...");

            // EMK / NCN / Standard MIDI Parsing
            let processedBuffer = midiBuffer;

            // Import parser dynamically to avoid circular deps if any (though unlikely here)
            // Or just use static import if available. Assuming static import at top.
            // But I need to add the import first. I'll simply use dynamic for safety or add import in next step.
            // Let's assume I'll add the import line at the top in a separate edit or use dynamic here.

            // Dynamic import of EmkParser
            const { EmkParser } = await import('@/utils/EmkParser');
            const result = await EmkParser.parse(midiBuffer);

            if (result.midi) {
                processedBuffer = result.midi;
                console.log(`✅ Extracted/Parsed MIDI size: ${processedBuffer.byteLength} bytes`);
            } else if (result.error) {
                console.warn("⚠️ Parser warning:", result.error);
                // If standard MIDI check fails later, we fail then.
                // But EmkParser handles standard MIDI too, so if it failed, it's likely invalid or unknown encryption.
            }

            // Validate MIDI Header (MThd = 0x4D 0x54 0x68 0x64)
            const header = new Uint8Array(processedBuffer.slice(0, 4));
            console.log("🔍 MIDI Header:", header[0].toString(16), header[1].toString(16), header[2].toString(16), header[3].toString(16));

            if (header[0] !== 0x4d || header[1] !== 0x54 || header[2] !== 0x68 || header[3] !== 0x64) {
                const msg = "Invalid MIDI File: Missing 'MThd' header.";
                console.error(msg);
                setError(msg);
                setIsPlaying(false);
                return;
            }

            // Reset state
            setCurrentTime(0);

            // loadNewSongList expects array: { binary: ArrayBuffer, fileName: string }
            try {
                // Ensure we pass a COPY of the buffer if needed, but sequencer likely handles it.
                // Pass as transfer if possible?
                sequencer.loadNewSongList([{ binary: processedBuffer, fileName: "song.mid" }]);
            } catch (loadErr: any) {
                console.error("loadNewSongList failed:", loadErr);
                throw loadErr;
            }

            sequencer.play();
            console.log("🎶 Playing...");

        } catch (err: any) {
            console.error("Play Error:", err);
            setError(err.message);
            setIsPlaying(false);
        }
    };

    const stop = () => {
        const sequencer = (synth as any)?.sequencer;
        if (sequencer) {
            console.log('⏹️ Stopping MIDI');
            sequencer.pause();
            sequencer.currentTime = 0;
            // Manually trigger state updates since pause might not fire timeChange 0
            setCurrentTime(0);
            setIsPlaying(false);
        }
    };

    const setVolume = (volume: number) => {
        if (synth) {
            // Check API for master gain
            // synth.setMasterGain(volume);
        }
    };

    return (
        <MidiEngineContext.Provider value={{
            isReady,
            isLoading,
            isPlaying,
            error,
            currentTime,
            duration,
            loadSoundFont,
            playMidi,
            stop,
            setVolume,
            synth
        }}>
            {children}
        </MidiEngineContext.Provider>
    );
}

export const useMidiEngine = () => {
    const context = useContext(MidiEngineContext);
    if (!context) {
        throw new Error('useMidiEngine must be used within a MidiEngineProvider');
    }
    return context;
};
