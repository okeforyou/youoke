import re

with open('src/components/VocalModeModal.tsx', 'r') as f:
    content = f.read()

# Imports
content = content.replace("import React from 'react';", "import React, { useRef, useState } from 'react';")
content = content.replace("import { Sparkles, Mic, X, AlertCircle } from 'lucide-react';", "import { Sparkles, Mic, X, AlertCircle, Upload, Loader2 } from 'lucide-react';")

# State and functions
insert_state = """    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const uploadAudioFile = useAIVocalStore(state => state.uploadAudioFile);
    const defaultMode = useAIVocalStore(state => state.defaultMode);
"""
content = content.replace("    const isPro = useAIVocalStore(state => videoId ? state.jobs[videoId]?.mode === 'pro' : false);", insert_state + "\n    const isPro = useAIVocalStore(state => videoId ? state.jobs[videoId]?.mode === 'pro' : false);")

# Update handleSelectMode to pass false for manual upload
content = content.replace("processAudio(videoId, songTitle, mode).catch(console.error);", "processAudio(videoId, songTitle, mode, false).catch(console.error);")

# Add handleFileUpload function
handle_file = """
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !videoId || !videoUuid) return;
        
        setIsUploading(true);
        try {
            const success = await uploadAudioFile(videoId, file);
            if (success) {
                updateQueueItem(videoUuid, { aiVocalRequested: true });
                const songTitle = usePlayerStore.getState().queue.find(item => item.uuid === videoUuid)?.title || "Unknown Title";
                processAudio(videoId, songTitle, defaultMode, true).catch(console.error);
                hideVocalModeModal();
            } else {
                alert("การอัปโหลดไฟล์ล้มเหลว กรุณาตรวจสอบว่า Local Bridge ทำงานอยู่");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("การอัปโหลดไฟล์ล้มเหลว");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
"""
content = content.replace("    const handleSelectMode = (mode: 'basic' | 'pro') => {", handle_file + "\n    const handleSelectMode = (mode: 'basic' | 'pro') => {")


# UI for Upload button
upload_ui = """
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="audio/*,video/*" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-bold text-gray-700 dark:text-zinc-300 transition-colors border border-dashed border-gray-200 dark:border-zinc-700"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                                <Upload className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                            )}
                            {isUploading ? "กำลังอัปโหลดไฟล์..." : "อัปโหลดไฟล์เพลงเอง (แก้ปัญหาดาวน์โหลดไม่ได้)"}
                        </button>
                    </div>
"""
content = content.replace("                    <div className=\"mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex justify-center\">", upload_ui + "\n                    <div className=\"mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex justify-center\">")

with open('src/components/VocalModeModal.tsx', 'w') as f:
    f.write(content)
