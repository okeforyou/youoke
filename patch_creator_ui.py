import re

path = "src/pages/creator.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add audioTrack state
if "const [audioTrack, setAudioTrack]" not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState<'properties' | 'lyrics'>('properties');",
        "const [activeTab, setActiveTab] = useState<'properties' | 'lyrics'>('properties');\n    const [audioTrack, setAudioTrack] = useState<'original' | 'vocals' | 'instrumental'>('original');"
    )

# Change wavesurfer URL logic
old_ws_create = """                    height: 100,
                    url: `${baseUrl}/files/${song.video_id}/original.audio`,
                    normalize: true,"""
new_ws_create = """                    height: 100,
                    url: `${baseUrl}/files/${song.video_id}/${audioTrack === 'vocals' ? 'vocals.m4a' : audioTrack === 'instrumental' ? 'no_vocals.m4a' : 'original.audio'}`,
                    normalize: true,"""
content = content.replace(old_ws_create, new_ws_create)

# Add useEffect to reload track if audioTrack changes
if "useEffect(() => {\n        if (wavesurfer.current && selectedSong) {" not in content:
    effect_code = """    useEffect(() => {
        if (wavesurfer.current && selectedSong) {
            const loadTrack = async () => {
                const baseUrl = await getActiveBridgeBaseUrl();
                if (!baseUrl) return;
                const url = `${baseUrl}/files/${selectedSong.video_id}/${audioTrack === 'vocals' ? 'vocals.m4a' : audioTrack === 'instrumental' ? 'no_vocals.m4a' : 'original.audio'}`;
                
                // Save current time
                const time = wavesurfer.current?.getCurrentTime() || 0;
                const isPlayingNow = wavesurfer.current?.isPlaying() || false;
                
                await wavesurfer.current?.load(url);
                
                // Rebuild regions after load since loading new url clears them
                rebuildRegions(lyrics);
                
                wavesurfer.current?.setTime(time);
                if (isPlayingNow) {
                    wavesurfer.current?.play();
                }
            };
            loadTrack();
        }
    }, [audioTrack]);"""
    
    # insert before rebuildRegions
    content = content.replace("    const rebuildRegions =", effect_code + "\n\n    const rebuildRegions =")

# Add Track Selector UI
ui_target = """                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="font-medium text-white">{selectedSong.title}</span>
                                <span>•</span>
                                <span>{lyrics.length} คำ</span>
                            </div>"""
ui_replacement = """                            <div className="flex items-center gap-4 text-sm">
                                <div className="text-gray-400">
                                    <span className="font-medium text-white">{selectedSong.title}</span>
                                    <span className="mx-2">•</span>
                                    <span>{lyrics.length} คำ</span>
                                </div>
                                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                                    <button 
                                        onClick={() => setAudioTrack('original')}
                                        className={`px-3 py-1 rounded-md transition-colors ${audioTrack === 'original' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        🎵 รวม
                                    </button>
                                    <button 
                                        onClick={() => setAudioTrack('vocals')}
                                        className={`px-3 py-1 rounded-md transition-colors ${audioTrack === 'vocals' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        🎤 ร้อง
                                    </button>
                                    <button 
                                        onClick={() => setAudioTrack('instrumental')}
                                        className={`px-3 py-1 rounded-md transition-colors ${audioTrack === 'instrumental' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        🎸 ดนตรี
                                    </button>
                                </div>
                            </div>"""
content = content.replace(ui_target, ui_replacement)

# Export button logic
old_export_fn = """    const handleExport = async () => {
        if (!selectedSong || lyrics.length === 0) return;
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            const res = await fetch(`${baseUrl}/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: selectedSong.video_id,
                    timeline: lyrics,
                    bg_color: '#000000'
                })
            });
            if (res.ok) {
                const data = await res.json();
                useUIStore.getState().showConfirm({
                    title: "ส่งออกสำเร็จ",
                    message: "บันทึกวิดีโอคาราโอเกะเรียบร้อยแล้วที่: " + data.file,
                    type: "info",
                    confirmText: "ตกลง",
                    onConfirm: () => useUIStore.getState().hideConfirm()
                });
            }
        } catch (e: any) {
            console.error(e);
        }
    };"""

new_export_fn = """    const handleExport = async () => {
        if (!selectedSong || lyrics.length === 0) return;
        try {
            useUIStore.getState().showConfirm({
                title: "กำลังบันทึกไฟล์",
                message: "กำลังแพ็คไฟล์ .yok กรุณารอสักครู่...",
                type: "info",
                confirmText: "ตกลง",
                onConfirm: () => useUIStore.getState().hideConfirm()
            });

            const baseUrl = await getActiveBridgeBaseUrl();
            const res = await fetch(`${baseUrl}/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: selectedSong.video_id,
                    timeline: lyrics
                })
            });
            
            if (res.ok) {
                // Trigger file download
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Get filename from header if possible, else default
                let filename = `${selectedSong.title}.yok`;
                const disposition = res.headers.get('Content-Disposition');
                if (disposition && disposition.indexOf('filename*=UTF-8\\'\\'') !== -1) {
                    filename = decodeURIComponent(disposition.split('filename*=UTF-8\\'\\'')[1]);
                }
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                useUIStore.getState().hideConfirm();
            } else {
                const errData = await res.json();
                alert('Export failed: ' + errData.detail);
            }
        } catch (e: any) {
            console.error(e);
            alert('Export Error: ' + e.message);
        }
    };"""
content = content.replace(old_export_fn, new_export_fn)


with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("creator.tsx updated")
