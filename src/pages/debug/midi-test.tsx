import { useState, useMemo, useEffect } from 'react';
import { useMidiEngine } from '@/context/MidiEngineContext';
import { EmkParser } from '@/utils/EmkParser';
import { decodeThai } from '../../utils/textDecoder';
import { extractLyrics, LyricEvent } from '../../utils/MidiLyricsParser';
import { KaraokeDisplay } from '@/modules/player/components/KaraokeDisplay';
import { MidiCanvasRenderer } from '@/modules/player/components/MidiCanvasRenderer';

export default function MidiTestPage() {
    const midiEngine = useMidiEngine();
    // const { isReady, playMidi, stop, isPlaying, synth } = midiEngine; // Access helper
    // Note: midiEngine has these. 

    const [status, setStatus] = useState<string>('Idle');
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Karaoke State
    const [lyrics, setLyrics] = useState<LyricEvent[]>([]);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [midiBuffer, setMidiBuffer] = useState<ArrayBuffer | null>(null); // Fixed missing state

    // Song Selection State
    const [rawFiles, setRawFiles] = useState<File[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSong, setSelectedSong] = useState<File | null>(null);

    // Process file list into searchable songs
    const songList = useMemo(() => {
        return rawFiles.filter(f => {
            const name = f.name.toLowerCase();
            return name.endsWith('.mid') || name.endsWith('.kar') || name.endsWith('.emk');
        }).map(f => ({
            name: f.name,
            file: f
        }));
    }, [rawFiles]);

    // Enhanced Search Logic (Space-separated terms)
    const filteredSongs = useMemo(() => {
        if (!searchTerm.trim()) return songList;
        const terms = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        return songList.filter(s => {
            const nameLower = s.name.toLowerCase();
            return terms.every(term => nameLower.includes(term));
        });
    }, [songList, searchTerm]);

    // High-Precision Timer for Karaoke
    // We need to move useEffect to top level module or rely on React.useEffect if imported
    // Since module imports are at top

    // ... Inside component:

    // Sync Timer
    useEffect(() => {
        if (!isPlaying || !midiEngine.synth) return;

        let frameId: number;
        const loop = () => {
            // Get exact time from Sequencer (seconds)
            // @ts-ignore
            const seq = midiEngine.synth.sequencer;
            if (seq) {
                setPlaybackTime(seq.currentTime);
            }
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(frameId);
    }, [isPlaying, midiEngine.synth]);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const handleSoundFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus(`Loading SoundFont: ${file.name}...`);
        try {
            const url = URL.createObjectURL(file);
            await midiEngine.loadSoundFont(url);
            setStatus(`SoundFont Loaded: ${file.name}`);
        } catch (err: any) {
            setError(err.message);
            setStatus('Error loading SoundFont');
        }
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setRawFiles(Array.from(e.target.files));
            setStatus(`Indexed ${e.target.files.length} files`);
        }
    };

    const testAudio = async () => {
        if (!midiEngine.synth) return;
        console.log("🔔 Testing Audio Output...");
        try {
            // CRITICAL: Resume AudioContext on user gesture
            if (midiEngine.synth.context.state === 'suspended') {
                console.log("🔊 Resuming AudioContext...");
                await midiEngine.synth.context.resume();
            }

            // Play C4 (60) on Channel 0
            // WorkletSynthesizer might need explicit noteOn on its core, checking API
            // SpessaSynth standard: synth.noteOn(channel, key, velocity)
            midiEngine.synth.noteOn(0, 60, 100);
            setTimeout(() => midiEngine.synth.noteOff(0, 60), 500);
            setStatus("Played Test Note (C4) - Check Speakers!");
        } catch (e: any) {
            console.error("Test Audio Failed:", e);
            setError("Test Audio Failed: " + e.message);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            console.log("📂 Parsing potential EMK/NCN file...");
            const buffer = await file.arrayBuffer();
            let processedMidiBuffer = buffer; // Use a local variable for processing

            const result = await EmkParser.parse(buffer);

            if (result.midi) {
                processedMidiBuffer = result.midi;
                console.log(`✅ Extracted MIDI size: ${processedMidiBuffer.byteLength} bytes`);
            } else if (result.error && file.name.toLowerCase().endsWith('.emk')) {
                throw new Error(result.error);
            } else {
                console.log("⚠️ Parser returned null, trying raw buffer...");
            }

            setMidiBuffer(processedMidiBuffer); // Set the state after processing

            // 🛠️ Extract Lyrics with Tempo Map
            try {
                const parsedLyrics = extractLyrics(processedMidiBuffer);
                console.log("📜 Extracted Lyrics (Thai):", parsedLyrics);
                setLyrics(parsedLyrics);
            } catch (lyricErr) {
                console.error("❌ Lyric Extraction Failed:", lyricErr);
                setLyrics([]);
            }
        } catch (err: any) {
            console.error("Parse Error:", err);
            setError("Error parsing file: " + err.message);
            setMidiBuffer(null);
            setLyrics([]);
        }
    };

    const playSong = async (file: File) => {
        if (!midiEngine.isReady) {
            setError("Engine Not Ready! Load SoundFont first.");
            return;
        }

        try {
            setSelectedSong(file);
            setError(null);
            setIsPlaying(true);
            const arrayBuffer = await file.arrayBuffer();
            let currentMidiBuffer = arrayBuffer; // Use a local variable for this play action

            // EMK / NCN Handling
            if (file.name.toLowerCase().endsWith('.emk') || file.name.toLowerCase().endsWith('.mid')) {
                console.log("📂 Parsing potential EMK/NCN file...");
                const result = await EmkParser.parse(arrayBuffer);
                if (result.midi) {
                    currentMidiBuffer = result.midi;
                    console.log(`✅ Extracted MIDI size: ${currentMidiBuffer.byteLength} bytes`);

                    // 🛠️ TEST: Extract Lyrics immediately
                    try {
                        const lyrics = extractLyrics(currentMidiBuffer);
                        console.log("📜 Extracted Lyrics (Thai):", lyrics);
                        setLyrics(lyrics); // Update lyrics state
                        // const sample = lyrics.slice(0, 5).map(l => l.text).join(" | ");
                        // alert(`Thai Lyrics Sample: ${sample}`);
                    } catch (lyricErr) {
                        console.error("❌ Lyric Extraction Failed:", lyricErr);
                        setLyrics([]);
                    }

                } else if (result.error && file.name.toLowerCase().endsWith('.emk')) {
                    throw new Error(result.error);
                } else {
                    console.log("⚠️ Parser returned null, trying raw buffer...");
                }
            } else {
                // For non-EMK/NCN files, still try to extract lyrics
                try {
                    const lyrics = extractLyrics(currentMidiBuffer);
                    setLyrics(lyrics);
                } catch (lyricErr) {
                    console.error("❌ Lyric Extraction Failed for non-EMK/NCN:", lyricErr);
                    setLyrics([]);
                }
            }

            setMidiBuffer(currentMidiBuffer); // Also update the global midiBuffer state

            console.log("▶️ Loading MIDI to Sequencer...");
            // CRITICAL: Resume AudioContext
            if (midiEngine.synth.context.state === 'suspended') {
                await midiEngine.synth.context.resume();
            }

            await midiEngine.playMidi(currentMidiBuffer); // Play the processed buffer

            // ANALYZE: Wait a tick for sequencer to update
            setTimeout(() => {
                // @ts-ignore
                // Access sequencer from synth to get song
                const sequencer = midiEngine.synth.sequencer || (midiEngine.synth as any).sequencer;
                if (sequencer && sequencer.song) {
                    const song = sequencer.song;
                    const tracks = song.tracks.length;
                    const lyrics = song.lyrics ? song.lyrics.length : 0;
                    // @ts-ignore
                    const copyright = song.copyright || "None";
                    console.log(`📊 Song Analysis:`);
                    console.log(`- Tracks: ${tracks}`);
                    console.log(`- Lyrics Events: ${lyrics}`);
                    console.log(`- Copyright: ${copyright}`);

                    if (lyrics === 0) {
                        console.warn("⚠️ No standard lyrics found. This is expected for NCN (Lyrics separate).");
                        setError("Playing, but No Lyrics found in MIDI (NCN format requires separate lyric parser).");
                    }
                } else {
                    console.warn("❌ Sequencer Song object not found!");
                }
            }, 500); // 500ms delay to allow worker/sequencer sync

        } catch (err: any) {
            console.error("Playback Error:", err);
            setError(err.message);
            setIsPlaying(false);
        }
    };

    return (
        <div className="p-6 bg-[#0f1115] min-h-screen text-gray-200 font-mono">
            {/* Header / Engine Status */}
            <div className="mb-8 p-4 bg-[#1a1d24] rounded-lg border border-gray-800">
                <h1 className="text-xl font-bold text-white mb-4">🎹 MIDI Engine Debugger</h1>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${midiEngine.isReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
                            <span className="font-bold">{midiEngine.isReady ? "ENGINE READY" : "ENGINE OFFLINE"}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            Load State: {midiEngine.isLoading ? "Loading..." : "Idle"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {status}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end items-center">
                        <button
                            onClick={testAudio}
                            disabled={!midiEngine.isReady}
                            className={`px-4 py-2 rounded font-bold shadow-lg transition-transform active:scale-95 ${midiEngine.isReady
                                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            🔔 Test Audio (C4)
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded text-red-200">
                    ❌ {error}
                </div>
            )}

            {/* Setup Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 1. SoundFont */}
                <div className="p-4 bg-[#1a1d24] rounded-lg border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="bg-gray-800 px-2 py-1 rounded text-xs font-bold text-gray-400">1. Engine</span>
                        {midiEngine.isReady && <span className="text-green-400 text-xs">Ready</span>}
                    </div>
                    <label className="block w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-center py-2 rounded transition font-medium">
                        CHOOSE SOUNDFONT (SF2)
                        <input type="file" accept=".sf2" onChange={handleSoundFontUpload} className="hidden" />
                    </label>
                    <p className="mt-2 text-xs text-center text-gray-500">Required: Load .sf2 first</p>
                </div>

                {/* 2. Song Folder */}
                <div className="p-4 bg-[#1a1d24] rounded-lg border border-gray-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="bg-gray-800 px-2 py-1 rounded text-xs font-bold text-gray-400">2. Data</span>
                        <span className="text-gray-500 text-xs">{songList.length} Songs Indexed</span>
                    </div>
                    <label className="block w-full cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-center py-2 rounded transition font-medium">
                        CHOOSE FOLDER
                        <input
                            type="file"
                            // @ts-ignore
                            webkitdirectory=""
                            directory=""
                            onChange={handleFolderSelect}
                            className="hidden"
                        />
                    </label>
                    <p className="mt-2 text-xs text-center text-gray-500">Select folder with .emk / .mid / .kar</p>
                </div>
            </div>

            {/* KARAOKE DISPLAY */}
            <div className="w-full bg-[#1a1d24] p-4 rounded-lg border border-gray-800 mb-8 min-h-[150px] flex items-center justify-center shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-blue-900/10 animate-pulse pointer-events-none" />

                {lyrics.length > 0 ? (
                    <KaraokeDisplay lyrics={lyrics} currentTime={playbackTime} />
                ) : (
                    <div className="text-gray-600 font-mono text-sm flex flex-col items-center gap-2">
                        <span className="text-2xl opacity-20">🎤</span>
                        <span>Load a song to start Karaoke</span>
                    </div>
                )}
            </div>

            {/* Player UI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Song List */}
                <div className="lg:col-span-2 bg-[#1a1d24] rounded-lg border border-gray-800 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 bg-[#15171c] border-b border-gray-800">
                        <input
                            type="text"
                            placeholder="Search title, code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0f1115] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-[#15171c] sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 w-24">Code</th>
                                    <th className="px-4 py-3">Title / Artist</th>
                                    <th className="px-4 py-3 w-20 text-center">Type</th>
                                    <th className="px-4 py-3 w-20">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredSongs.slice(0, 100).map((song, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-green-400 font-mono">
                                            {song.name.split('.')[0].substring(0, 6)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-200">
                                            {song.name.replace(/\.[^/.]+$/, "")}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-500">
                                            {song.name.split('.').pop()?.toUpperCase()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => playSong(song.file)}
                                                className="bg-green-600/20 text-green-400 hover:bg-green-600/40 px-3 py-1 rounded text-xs transition"
                                            >
                                                PLAY
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSongs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                            No matches found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-2 bg-[#15171c] border-t border-gray-800 text-xs text-center text-gray-500">
                        Found {filteredSongs.length} matches
                    </div>
                </div>

                {/* Visualizer & Controls */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-[#000] rounded-lg border-4 border-gray-700 aspect-video relative overflow-hidden shadow-2xl">
                        <MidiCanvasRenderer />

                        {/* Time Overlay */}
                        <div className="absolute top-2 left-2 text-green-500 font-mono text-xl z-10 font-bold drop-shadow-md">
                            {formatTime(midiEngine.currentTime)}
                        </div>
                        <div className="absolute top-2 right-2 text-green-800 font-mono text-xl z-10 font-bold drop-shadow-md">
                            {formatTime(midiEngine.duration)}
                        </div>

                        {/* Song Info Overlay */}
                        {selectedSong && (
                            <div className="absolute top-2 right-12 left-16 text-center text-green-900/50 font-mono text-sm z-10 truncate">
                                Playing: {selectedSong.name}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-[#1a1d24] p-4 rounded-lg border border-gray-800">
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_#22c55e]"
                                style={{ width: `${(midiEngine.currentTime / (midiEngine.duration || 1)) * 100}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => midiEngine.stop()}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded font-bold shadow-lg active:transform active:scale-95"
                            >
                                STOP (ENTER)
                            </button>
                            <button className="w-full bg-gray-700 text-gray-400 py-3 rounded font-bold cursor-not-allowed">
                                KEY +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
