import re

with open('src/pages/creator.tsx', 'r') as f:
    content = f.read()

# 1. Find Canvas Toolbar block
toolbar_match = re.search(r'\{/\* Canvas Toolbar with Quick Controls \*/\}(.*?)\{/\* Right Sidebar \(Creator Tools\) \*/\}', content, re.DOTALL)
if toolbar_match:
    toolbar_block = toolbar_match.group(1)
    
    # Extract only the buttons we want to move: Add Block, Tap-to-Sync, Ripple
    # The 'Save to Wiki' button will be moved to the Top Navigation Bar.
    # Let's just remove the entire Canvas Toolbar from the Canvas area.
    content = content.replace('{/* Canvas Toolbar with Quick Controls */}' + toolbar_block, '\n')
    
    # Let's add the Save to Wiki button to the Top Navigation Bar.
    # Look for `<div className="flex items-center gap-3">` inside Top Navigation Bar
    nav_bar_target = '<button \n                        onClick={handleExport}'
    save_button = """
                    <button
                        onClick={handleSaveToWiki}
                        disabled={!selectedSong || lyrics.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Project
                    </button>
                    """
    content = content.replace(nav_bar_target, save_button + nav_bar_target)
    
    # 2. Add Add Block, Tap-to-Sync, Ripple to Timeline Toolbar
    # The Timeline Toolbar starts with {/* Timeline Toolbar */}
    timeline_toolbar_target = '<div className="flex items-center gap-4 text-zinc-400">'
    
    timeline_buttons = """
                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">
                            <button 
                                onClick={handleAddBlockAtPlayhead}
                                disabled={!selectedSong}
                                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                                title="เพิ่มบล็อกเนื้อร้องตรงเวลาที่กำลังเล่นปัจจุบัน"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={handleToggleRecording}
                                disabled={!selectedSong || lyrics.length === 0}
                                className={`p-1.5 rounded-lg transition-colors ${isRecording ? "bg-red-600/20 text-red-500 animate-pulse" : "hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"}`}
                                title="เริ่ม/หยุด Tap-to-Sync"
                            >
                                {isRecording ? <Square size={16} /> : <Target size={16} />}
                            </button>
                            {isRecording && (
                                <button
                                    onClick={handleTap}
                                    className="px-2 py-1 rounded-md bg-primary text-white text-xs font-black transition-all active:scale-95 shadow"
                                >
                                    Tap! ({recordingIndex + 1})
                                </button>
                            )}
                            <button 
                                onClick={() => setIsRippleEdit(!isRippleEdit)}
                                className={`p-1.5 rounded-lg transition-colors ${isRippleEdit ? "bg-amber-600/20 text-amber-500" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                title="ลากกลุ่ม (Ripple)"
                            >
                                <Link size={16} />
                            </button>
                        </div>
    """
    
    content = content.replace(timeline_toolbar_target, timeline_toolbar_target + timeline_buttons)

with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)

print("Patched Canvas Toolbar successfully!")
