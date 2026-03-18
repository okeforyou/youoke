import React, { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import { FileUp, Music, Play, Square, Pause } from 'lucide-react';

// Safely import spessasynth only on client side
const useSpessaSynth = () => {
    const [lib, setLib] = useState<any>(null);
    useEffect(() => {
        import('spessasynth_lib').then(m => setLib(m));
    }, []);
    return lib;
};

export default function MidiLab() {
    const spessa = useSpessaSynth();
    const [synth, setSynth] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // File buffers (kept for display in UI)
    const [sf2Buffer, setSf2Buffer] = useState<ArrayBuffer | null>(null);
    const [midiBuffer, setMidiBuffer] = useState<ArrayBuffer | null>(null);
    const [lyrContent, setLyrContent] = useState<string>('');
    const [curData, setCurData] = useState<Uint16Array | null>(null);

    // Smart Import State
    interface NcnSet {
        id: string; // basename
        name: string;
        mid?: File;
        lyr?: File;
        cur?: File;
    }
    const [songList, setSongList] = useState<NcnSet[]>([]);
    const [currentSong, setCurrentSong] = useState<NcnSet | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const log = (msg: string) => setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // 1. Initializer SoundFont
    const loadSoundFont = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        log(`Loading SoundFont: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);

        const buffer = await file.arrayBuffer();
        setSf2Buffer(buffer);

        if (spessa) {
            try {
                // Debug Spessa Object
                console.log('Spessa Lib:', spessa);

                // v4: WorkletSynthesizer, v3: Synthetizer
                // We prefer WorkletSynthesizer if available for better performance
                const SynthetizerClass =
                    spessa.WorkletSynthesizer ||
                    spessa.Synthetizer ||
                    (spessa as any).default?.WorkletSynthesizer ||
                    (spessa as any).default?.Synthetizer;

                if (!SynthetizerClass) {
                    throw new Error(`No compatible Synthetizer class found in spessasynth_lib! Keys: ${Object.keys(spessa).join(', ')}`);
                }

                log(`🔨 Initializing using ${SynthetizerClass.name}...`);

                // Create Audio Context
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

                let newSynth;
                try {
                    // Try to instantiate - v4 usually takes (context, buffer)
                    // We might need to handle worklet URL if it fails, but let's try default first
                    newSynth = new SynthetizerClass(ctx, buffer);
                } catch (e: any) {
                    log(`⚠️ Std Constructor failed: ${e.message}. Retrying...`);
                    // Fallback or specific logic could go here
                    newSynth = new SynthetizerClass(ctx, buffer);
                }

                // If it's a Promise (some versions might be async), await it
                if (newSynth instanceof Promise) {
                    newSynth = await newSynth;
                }

                setSynth(newSynth);
                log(`✅ Ready! Engine: ${SynthetizerClass.name}`);
            } catch (err: any) {
                log(`❌ Synth Error: ${err.message}`);
                console.error(err);
            }
        }
    };

    // 2. Smart Folder Scan
    const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        log(`📂 Scanning ${files.length} files...`);
        // Debug: Print first 5 files
        files.slice(0, 5).forEach(f => console.log('File:', f.name, f.webkitRelativePath));

        const groups: Record<string, NcnSet> = {};

        for (const file of files) {
            const name = file.name;
            const ext = name.split('.').pop()?.toLowerCase();
            const basename = name.substring(0, name.lastIndexOf('.'));
            const groupId = basename.toLowerCase(); // Case-insensitive grouping

            // Allow 'mid' AND 'emk' (eXtreme Karaoke)
            if (!['mid', 'emk', 'lyr', 'cur'].includes(ext || '')) continue;

            if (!groups[groupId]) {
                groups[groupId] = { id: groupId, name: basename };
            }

            if (ext === 'mid' || ext === 'emk') groups[groupId].mid = file;
            if (ext === 'lyr') groups[groupId].lyr = file;
            if (ext === 'cur') groups[groupId].cur = file;
        }

        // Filter only valid sets (must have MIDI)
        const validSets = Object.values(groups).filter(s => s.mid).sort((a, b) => a.name.localeCompare(b.name));

        setSongList(validSets);
        log(`✅ Discovered ${validSets.length} playable songs!`);
        if (validSets.length > 0) {
            log(`   Example: ${validSets[0].name} (Has: ${validSets[0].lyr ? 'Lyr' : ''} ${validSets[0].cur ? 'Cur' : ''})`);
        }
    };

    // 3. Play Specific Song
    const playSong = async (song: NcnSet) => {
        if (!synth) {
            log("⚠️ Please load SoundFont first!");
            return;
        }

        log(`▶️ Loading ${song.name}...`);
        setCurrentSong(song);
        stopMidi();

        try {
            // Load MIDI
            const mBuf = await song.mid!.arrayBuffer();
            setMidiBuffer(mBuf);

            // Load Extras if available
            if (song.lyr) {
                const txt = await song.lyr.text();
                setLyrContent(txt);
                // log(`   Lyrics loaded (${txt.length} chars)`);
            } else {
                setLyrContent('');
            }

            if (song.cur) {
                const cBuf = await song.cur.arrayBuffer();
                const view = new Uint16Array(cBuf);
                setCurData(view);
                // log(`   Cursor loaded (${view.length} points)`);
            } else {
                setCurData(null);
            }

            // Play
            await synth.playMIDI(mBuf);
            log(`🎶 Now Playing: ${song.name}`);

        } catch (e: any) {
            log(`❌ Play Error: ${e.message}`);
        }
    };

    const stopMidi = () => {
        if (synth) {
            synth.stopMIDI();
            log("⏹️ Stopped");
        }
    };

    // Smart Search Logic
    const getFilteredSongs = () => {
        if (!searchTerm) return songList;
        const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
        return songList.filter(s => {
            const searchStr = `${s.name} ${s.id}`.toLowerCase();
            return tokens.every(token => searchStr.includes(token));
        });
    };

    const filteredSongs = getFilteredSongs();

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Header Section */}
                <div className="p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-gray-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">MIDI Lab (Smart Import)</h1>
                            <p className="text-sm text-gray-500 mt-1 font-medium">เครื่องมือจัดการและทดสอบเทมเพลต MIDI</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 h-[calc(100vh-250px)] flex flex-col">

                {/* Top Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                    {/* Audio Engine */}
                    <div className="card bg-base-100 shadow-sm border border-gray-200 compact">
                        <div className="card-body">
                            <h2 className="card-title text-primary text-sm"><Music size={18} /> 1. Audio Engine</h2>
                            <div className="flex items-center gap-3">
                                <div className={`badge ${synth ? 'badge-success' : 'badge-warning'}`}>
                                    {synth ? 'Ready' : 'Waiting for SF2'}
                                </div>
                                <input type="file" accept=".sf2" onChange={loadSoundFont} className="file-input file-input-bordered file-input-sm w-full max-w-xs" />
                            </div>
                        </div>
                    </div>

                    {/* Folder Import */}
                    <div className="card bg-base-100 shadow-sm border border-gray-200 compact">
                        <div className="card-body">
                            <h2 className="card-title text-secondary text-sm"><FileUp size={18} /> 2. Import Songs (Folder)</h2>
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-gray-500">Select your 'NCN' or 'Songs' folder. We will autoscan it.</p>
                                <input
                                    type="file"
                                    // @ts-ignore
                                    webkitdirectory="" directory=""
                                    multiple
                                    onChange={handleFolderSelect}
                                    className="file-input file-input-bordered file-input-secondary file-input-sm w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Song List (Left) */}
                    <div className="card bg-base-100 shadow-xl border border-gray-200 flex flex-col h-full">
                        <div className="card-body p-4 flex flex-col h-full min-h-0">
                            <h3 className="font-bold flex justify-between items-center">
                                <span>📚 Songbook ({songList.length})</span>
                            </h3>
                            <input
                                type="text"
                                placeholder="Search songs..."
                                className="input input-bordered input-sm w-full my-2"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
                                {searchTerm.length === 0 ? (
                                    <div className="text-center text-gray-400 py-10 text-sm flex flex-col items-center gap-2">
                                        <div className="text-4xl opacity-20">🔍</div>
                                        <div>Type to search songs...</div>
                                        <div className="text-xs opacity-50">List hidden for performance</div>
                                    </div>
                                ) : (
                                    <>
                                        {filteredSongs.slice(0, 50).map(song => (
                                            <button
                                                key={song.id}
                                                onClick={() => playSong(song)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 flex justify-between items-center group ${currentSong?.id === song.id ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700'}`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <Music size={14} className="opacity-50" />
                                                    <span className="truncate">{song.name}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-50 group-hover:opacity-100">
                                                    {song.lyr && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">L</span>}
                                                    {song.cur && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">C</span>}
                                                </div>
                                            </button>
                                        ))}
                                        {filteredSongs.length > 50 && (
                                            <div className="text-center text-xs text-gray-400 py-2">
                                                ... and {filteredSongs.length - 50} more matches ...
                                            </div>
                                        )}
                                        {filteredSongs.length === 0 && (
                                            <div className="text-center text-gray-400 py-10 text-sm">
                                                No matches found for "{searchTerm}"
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Player & Logs (Right) */}
                    <div className="md:col-span-2 flex flex-col gap-6 min-h-0">

                        {/* Now Playing */}
                        <div className="card bg-gray-900 text-white shadow-xl shrink-0">
                            <div className="card-body p-6 items-center text-center">
                                <h2 className="text-gray-400 text-sm uppercase tracking-wider">Now Playing</h2>
                                <h1 className="text-3xl font-bold text-primary">{currentSong ? currentSong.name : 'Select a Song'}</h1>
                                <div className="flex gap-4 mt-6">
                                    <button onClick={() => currentSong && playSong(currentSong)} className="btn btn-circle btn-primary btn-lg">
                                        <Play size={32} fill="currentColor" />
                                    </button>
                                    <button onClick={stopMidi} className="btn btn-circle btn-ghost btn-lg text-white">
                                        <Square size={24} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Console Log */}
                        <div className="card bg-black text-green-400 shadow-xl flex-1 min-h-0 font-mono text-xs overflow-hidden border border-gray-800">
                            <div className="p-2 border-b border-gray-800 bg-gray-900/50 font-bold">System Log</div>
                            <div className="p-4 overflow-y-auto h-full space-y-1">
                                {logs.map((L, i) => <div key={i}>{L}</div>)}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        </AdminLayout>
    );
}
