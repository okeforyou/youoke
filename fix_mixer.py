import re

with open("src/modules/player/components/SidebarControls.tsx", "r") as f:
    content = f.read()

# We want to replace the `showVocalMixer` block.
# Let's find the exact block.
old_block = """            {/* Flat Mixer Popover */}
            {showVocalMixer && (
                <div ref={mixerRef} className="absolute top-[50px] right-2 mt-2 w-72 max-h-[60vh] overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">ตั้งค่าเสียง (Audio Settings)</h4>"""

new_block = """            {/* Mixer Modal */}
            {showVocalMixer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        ref={mixerRef} 
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-y-auto overscroll-contain"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-primary" />
                                ตั้งค่าเสียง (Mixer)
                            </h3>
                            <button 
                                onClick={() => setShowVocalMixer(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>"""

content = content.replace(old_block, new_block)

# 2. Master Mute
content = content.replace(
"""                    {/* Master Mute */}
                    <div className={clsx("mb-3", isAiReady && "border-b border-gray-100 dark:border-zinc-800 pb-3")}>""",
"""                        {/* Master Mute */}
                        <div className={clsx("mb-5", isAiReady && "border-b border-gray-100 dark:border-zinc-800 pb-5")}>"""
)

content = content.replace(
"""                                "w-full py-1.5 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors border",""",
"""                                "w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-colors border","""
)

content = content.replace(
"""                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            <span>เสียงหลัก (Master)</span>
                            <span className="ml-auto text-[10px] opacity-70">{isMuted ? 'Muted' : 'On'}</span>""",
"""                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            <span>เสียงหลัก (Master)</span>
                            <span className="ml-auto text-[11px] opacity-70 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md">
                                {isMuted ? 'Muted' : 'On'}
                            </span>"""
)

# 3. AI & Volume Controls container
content = content.replace(
"""                    {/* AI & Volume Controls (Always Visible) */}
                    <div className="flex flex-col gap-3">""",
"""                        {/* AI & Volume Controls (Always Visible) */}
                        <div className="flex flex-col gap-4">"""
)

# 4. Vocals, Drums, Bass, Other wrappers & icons
content = content.replace('w-8 h-8 shrink-0', 'w-10 h-10 shrink-0')
content = content.replace('rounded-lg transition-all', 'rounded-xl transition-all')
content = content.replace('size={14}', 'size={18}')
content = content.replace('gap-3', 'gap-4')
content = content.replace('mb-1', 'mb-1.5')
content = content.replace('text-[10px]', 'text-xs')

# Fix the Lyrics button section
content = content.replace(
"""                    <div className={clsx("mt-4 pt-3", isAiReady || isConnected ? "border-t border-gray-100 dark:border-zinc-800" : "")}>
                        <button 
                            onClick={toggleLyrics}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-xl flex items-center justify-between gap-2 text-xs font-bold transition-colors border",""",
"""                        <div className={clsx("mt-6 pt-5", isAiReady || isConnected ? "border-t border-gray-100 dark:border-zinc-800" : "")}>
                            <button 
                                onClick={toggleLyrics}
                                className={clsx(
                                    "w-full py-2.5 px-4 rounded-xl flex items-center justify-between gap-3 text-sm font-bold transition-colors border","""
)

# Replace the text-xs and size=18 that were incorrectly applied to Lyrics
content = content.replace(
"""                            <div className="flex items-center gap-4">
                                <Type size={18} />
                                <span>เนื้อเพลง (Lyrics)</span>
                            </div>
                            <span className="text-xs opacity-70">{showLyrics ? 'On' : 'Off'}</span>
                        </button>""",
"""                            <div className="flex items-center gap-3">
                                <Type size={18} />
                                <span>เนื้อเพลง (Lyrics)</span>
                            </div>
                            <span className={clsx(
                                "text-[11px] px-2 py-1 rounded-md",
                                showLyrics ? "bg-white/20 text-white" : "bg-white/50 dark:bg-black/20 opacity-70"
                            )}>
                                {showLyrics ? 'On' : 'Off'}
                            </span>
                        </button>"""
)

# Lyrics error padding
content = content.replace(
"""                        {lyricsError && showLyrics && !isGeneratingAI && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 p-2 rounded-xl text-center flex flex-col gap-4">
                                <span>{lyricsError}</span>
                                {currentVideo && isAiReady && (
                                    <button
                                        onClick={() => generateAILyrics(currentVideo.id)}
                                        className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Sparkles size={18} />""",
"""                        {lyricsError && showLyrics && !isGeneratingAI && (
                            <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 p-3 rounded-xl text-center flex flex-col gap-3">
                                <span>{lyricsError}</span>
                                {currentVideo && isAiReady && (
                                    <button
                                        onClick={() => generateAILyrics(currentVideo.id)}
                                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg shadow-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Sparkles size={14} />"""
)

content = content.replace(
"""                        {lyricsLoading && showLyrics && !isGeneratingAI && (
                            <div className="mt-2 text-xs text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                กำลังค้นหาเนื้อเพลง...
                            </div>
                        )}
                        {isGeneratingAI && showLyrics && (
                            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 p-2 rounded flex items-center justify-center gap-4">
                                <Sparkles size={18} className="animate-pulse" />
                                AI กำลังประมวลผลฟังเพลงเพื่อแกะเนื้อร้อง... (อาจใช้เวลา 10-20 วินาที)
                            </div>
                        )}""",
"""                        {lyricsLoading && showLyrics && !isGeneratingAI && (
                            <div className="mt-3 text-[11px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                                กำลังค้นหาเนื้อเพลง...
                            </div>
                        )}
                        {isGeneratingAI && showLyrics && (
                            <div className="mt-3 text-[11px] text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl flex items-center justify-center gap-2">
                                <Sparkles size={14} className="animate-pulse" />
                                AI กำลังประมวลผลฟังเพลงเพื่อแกะเนื้อร้อง... (อาจใช้เวลา 10-20 วินาที)
                            </div>
                        )}"""
)

# Sync and Source controls (Restore original first, then replace)
content = content.replace(
"""                        {/* Lyrics Details Controls */}
                        {showLyrics && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/50 flex flex-col gap-4">
                                {/* Source Selector */}
                                <div>
                                    <div className="text-[9px] font-bold mb-1.5 text-black/70 dark:text-zinc-400 uppercase">
                                        แหล่งข้อมูล (Source)
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => handleSourceChange('auto')}
                                            className={clsx(
                                                "flex-1 py-1 rounded shadow-sm text-[9px] font-bold transition-all border",
                                                preferredSource === 'auto' 
                                                    ? "bg-primary text-white border-primary" 
                                                    : "bg-white dark:bg-zinc-700 text-black dark:text-white border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600"
                                            )}
                                        >
                                            LRCLIB
                                        </button>
                                        <button 
                                            onClick={() => handleSourceChange('youtube')}
                                            className={clsx(
                                                "flex-1 py-1 rounded shadow-sm text-[9px] font-bold transition-all border",
                                                preferredSource === 'youtube' 
                                                    ? "bg-blue-600 text-white border-blue-600" 
                                                    : "bg-white dark:bg-zinc-700 text-black dark:text-white border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600"
                                            )}
                                        >
                                            YouTube CC
                                        </button>
                                    </div>
                                </div>

                                {/* Sync Offset Controls */}
                                <div>
                                    <div className="flex justify-between items-center text-[9px] font-bold mb-1.5 text-black/70 dark:text-zinc-400 uppercase">
                                        <span>ปรับเวลา (Sync)</span>
                                        <span className={syncOffset !== 0 ? "text-primary" : ""}>
                                            {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => setSyncOffset(syncOffset - 0.5)}
                                            className="flex-1 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded shadow-sm text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-600 active:scale-95 transition-all text-black dark:text-white"
                                        >
                                            -0.5s
                                        </button>
                                        <button 
                                            onClick={() => setSyncOffset(0)}
                                            className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 rounded text-[9px] font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <button 
                                            onClick={() => setSyncOffset(syncOffset + 0.5)}
                                            className="flex-1 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded shadow-sm text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-600 active:scale-95 transition-all text-black dark:text-white"
                                        >
                                            +0.5s
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}""",
"""                        {/* Lyrics Details Controls */}
                        {showLyrics && (
                            <div className="mt-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">แหล่งข้อมูล (SOURCE)</span>
                                    <div className="flex bg-gray-200 dark:bg-zinc-900 p-1 rounded-lg gap-1">
                                        <button 
                                            onClick={() => handleSourceChange('auto')}
                                            className={clsx(
                                                "px-3 py-1 rounded-md text-[10px] font-bold transition-colors",
                                                preferredSource === 'auto' ? "bg-white dark:bg-zinc-700 text-red-500 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                            )}
                                        >
                                            LRCLIB
                                        </button>
                                        <button 
                                            onClick={() => handleSourceChange('youtube')}
                                            className={clsx(
                                                "px-3 py-1 rounded-md text-[10px] font-bold transition-colors",
                                                preferredSource === 'youtube' ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                            )}
                                        >
                                            YouTube CC
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">ปรับเวลา (SYNC)</span>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleSyncChange(-0.5)}
                                            className="w-10 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-700"
                                        >
                                            -0.5s
                                        </button>
                                        <button 
                                            onClick={() => setSyncOffset(0)}
                                            className="px-3 py-1 bg-gray-200 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 rounded-lg text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-zinc-800"
                                        >
                                            Reset
                                        </button>
                                        <button 
                                            onClick={() => handleSyncChange(0.5)}
                                            className="w-10 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-700"
                                        >
                                            +0.5s
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}"""
)

# And finally we need to add the closing div for the backdrop!
# Wait, the original had:
#                    </div>
#                </div>
#            )}
#        </div>
#    );
# Because we added a wrapper `div className="fixed inset-0 ...">`, we need ONE MORE closing div.
content = content.replace(
"""                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );""",
"""                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}
        </div>
    );"""
)

with open("src/modules/player/components/SidebarControls.tsx", "w") as f:
    f.write(content)
