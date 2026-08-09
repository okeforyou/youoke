        return lyricLines.length - 1;
    }, [lyricLines, currentTime]);

    return (

        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <Head>
        <title>Creator Studio - YouOke</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&family=Prompt:wght@400;700&family=Sarabun:wght@400;700&family=Mali:wght@400;700&family=Itim&display=swap" rel="stylesheet" />
    </Head>

            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="font-bold text-lg flex items-center gap-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">YouOke</span>
                        <span className="text-zinc-300 font-medium text-sm border-l border-zinc-700 pl-2">Creator Studio</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 hidden sm:inline-block">โปรเจกต์: {selectedSong ? selectedSong.title : 'ยังไม่เลือกเพลง'}</span>
                    <button 
                        onClick={handleExport}
                        disabled={lyrics.length === 0}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Video
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Center Canvas (Preview) */}
                <div className="flex-1 flex flex-col relative bg-black items-center justify-center overflow-hidden">
                    {!selectedSong ? (
                        <div className="max-w-4xl w-full mx-auto px-4 py-8 animate-in fade-in duration-500">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-3">
                                    YouOke Creator Hub
                                </h2>
                                <p className="text-zinc-400 text-sm max-w-lg mx-auto">
                                    เลือกช่องทางในการสร้างและเตรียมเพลงคาราโอเกะของคุณ 
                                    ระบบจะบันทึกผลงานโดยอัตโนมัติเพื่อให้คุณร้องเพลงได้อย่างราบรื่นที่สุด
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Card 1: Wiki Lyrics Studio */}
                                <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-purple-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                            <Sparkles className="text-purple-400 w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">1. สตูดิโอเนื้อร้องคลาวด์ (Wiki Studio)</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                            จัดเรียงบรรทัดเนื้อเพลง ซิงค์จังหวะให้ตรง และปรับแต่งตำแหน่งแสดงผลแบบเรียลไทม์ เพื่อบันทึกเป็นฐานข้อมูล Wiki ให้ทุกคนร้องได้
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3 mt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-left">ใส่ลิงก์ YouTube หรือ Video ID</label>
                                            <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 focus-within:border-purple-500/50 transition-all">
                                                <input 
                                                    type="text" 
                                                    placeholder="เช่น https://www.youtube.com/watch?v=..."
                                                    value={ytUrl}
                                                    onChange={(e) => setYtUrl(e.target.value)}
                                                    className="bg-transparent text-sm text-zinc-200 px-3 py-2 w-full outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleGoToWikiStudio();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGoToWikiStudio}
                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} />
                                            เริ่มแต่งเนื้อร้อง
                                        </button>
                                    </div>
                                </div>

                                {/* Card 2: Local AI Separation */}
                                <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-pink-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                            <Music className="text-pink-400 w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">2. ถอดเสียงแยกคีย์ด้วย AI (Local Studio)</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                            ตัดเสียงคนร้องออกจากดนตรี และให้ปัญญาประดิษฐ์แกะเนื้อหาทีละพยางค์โดยอัตโนมัติ (เหมาะสำหรับการใช้เสียงร้องคุณภาพสูง)
                                        </p>
                                    </div>
                                    
                                    <div className="mt-8">
                                        <button 
                                            onClick={() => setShowLibraryModal(true)}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 text-zinc-200 py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20"
                                        >
                                            <Music size={16} className="text-pink-400" />
                                            เลือกเพลงจากคลัง Local
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative p-8 select-none">
                            {/* Fake Video Canvas Area */}
                            <div ref={videoContainerRef} className="aspect-video w-full max-w-4xl bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 relative flex flex-col items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/40 pointer-events-none" />
                                
                                {/* Lyrics Preview */}
                                <div 
                                    style={{
                                        left: `${lyricPos.x}%`,
                                        top: `${lyricPos.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        cursor: isDraggingOverlay ? 'grabbing' : 'grab',
                                        touchAction: 'none'
                                    }}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        setIsDraggingOverlay(true);
                                        const containerRect = videoContainerRef.current?.getBoundingClientRect();
                                        const elementRect = e.currentTarget.getBoundingClientRect();
                                        if (containerRect) {
                                            const elCenterX = elementRect.left + elementRect.width / 2;
                                            const elCenterY = elementRect.top + elementRect.height / 2;
                                            const offsetX = ((e.clientX - elCenterX) / containerRect.width) * 100;
                                            const offsetY = ((e.clientY - elCenterY) / containerRect.height) * 100;
                                            overlayDragRef.current = {
                                                startX: offsetX,
                                                startY: offsetY,
                                                startPosX: 0,
                                                startPosY: 0
                                            };
                                        }
                                    }}
                                    className={clsx(
                                        "z-10 text-center px-12 py-4 absolute w-max max-w-[90%] flex flex-col items-center select-none rounded-xl border border-transparent transition-all",
                                        isDraggingOverlay ? "border-purple-500/30 bg-purple-500/5 scale-105" : "hover:border-zinc-800 hover:bg-zinc-900/10"
                                    )}
                                >
                                    <div className="space-y-4 w-full flex flex-col items-center pointer-events-none font-sans">
                                        {lyrics.length > 0 ? (
                                            (() => {
                                                const activeLineIdx = activeLineIndex;
                                                const currentLine = activeLineIdx !== -1 ? lyricLines[activeLineIdx] : null;
                                                let nextLineIdx = activeLineIdx !== -1 ? activeLineIdx + 1
                                                    : lyricLines.findIndex(line => line[0].start > currentTime);
                                                const nextLine = nextLineIdx !== -1 && nextLineIdx < lyricLines.length ? lyricLines[nextLineIdx] : null;
                                                return (
                                                    <div className="space-y-4 flex flex-col items-center">
                                                        {/* Current Active Line */}
                                                        <p
                                                            style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily, WebkitTextStroke: `${fontOutline}px black` }}
                                                            className={clsx(
                                                                "font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-normal transition-all duration-300 text-center min-h-[1.5em]",
                                                                currentLine ? "opacity-100 scale-100" : "opacity-0"
                                                            )}
                                                        >
                                                            {currentLine ? currentLine.map((l, i) => {
                                                                const isPast = currentTime > l.end;
                                                                const isCurrent2 = currentTime >= l.start && currentTime <= l.end;
                                                                return (
                                                                    <span key={i} className={clsx(
                                                                        "transition-colors duration-100 mx-1 inline-block",
                                                                        isPast ? "text-purple-400" : isCurrent2 ? "text-pink-400" : "text-white"
                                                                    )}>{l.word}</span>
                                                                );
                                                            }) : <span>&nbsp;</span>}
                                                        </p>
                                                        {/* Next Upcoming Line (Faded) */}
                                                        <p
                                                            style={{ fontSize: `${fontSize * 0.8}px`, fontFamily: fontFamily, WebkitTextStroke: `${fontOutline * 0.8}px black` }}
                                                            className={clsx(
                                                                "font-black text-zinc-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-normal transition-all duration-300 text-center min-h-[1.5em]",
                                                                nextLine ? "opacity-40 scale-95" : "opacity-0"
                                                            )}
                                                        >
                                                            {nextLine ? nextLine.map((l, i) => (
                                                                <span key={i} className="mx-1 inline-block">{l.word}</span>
                                                            )) : <span>&nbsp;</span>}
                                                        </p>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-zinc-600 text-3xl font-bold">ไม่มีเนื้อเพลง (นำเข้า/วางเนื้อร้องด้านขวา)</span>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500 pointer-events-none">
                                    Canvas 1920x1080 (ลากข้อความเพื่อย้ายตำแหน่งได้)
                                </div>
                            </div>
                            
                            {/* Canvas Toolbar with Quick Controls */}
                            <div className="w-full max-w-4xl mt-3 flex items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl font-sans shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={handleAddBlockAtPlayhead}
                                        disabled={!selectedSong}
                                        className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow"
                                        title="เพิ่มบล็อกเนื้อร้องตรงเวลาที่กำลังเล่นปัจจุบัน"
                                    >
                                        <Plus size={14} />
                                        เพิ่มบรรทัด
                                    </button>
                                    
                                    {/* Tap-to-Sync Controls */}
                                    <button
                                        onClick={handleToggleRecording}
                                        disabled={!selectedSong || lyrics.length === 0}
                                        className={clsx(
                                            "px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow",
                                            isRecording ? "bg-red-600 hover:bg-red-500 text-white animate-pulse" : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200 disabled:opacity-50"
                                        )}
                                        title="เริ่ม/หยุด Tap-to-Sync (กด Spacebar เพื่อซิงค์เนื้อร้อง)"
                                    >
                                        {isRecording ? '⏹ หยุด Sync' : '🎯 Tap-to-Sync'}
                                    </button>
                                    {isRecording && (
                                        <button
                                            onClick={handleTap}
                                            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-black transition-all active:scale-95 shadow"
                                            title={`กด Tap! หรือ Spacebar เพื่อซิงค์บรรทัดที่ ${recordingIndex + 1}/${lyrics.length}`}
                                        >
                                            🎵 Tap! ({recordingIndex + 1}/{lyrics.length})
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => setIsRippleEdit(!isRippleEdit)}
                                        className={clsx(
                                            "px-3.5 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
                                            isRippleEdit 
                                                ? "bg-amber-600/20 border-amber-500/50 text-amber-200" 
                                                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                                        )}
                                        title="ลากกลุ่ม (Ripple): เมื่อเลื่อน/ขยายบล็อก จะขยับบล็อกที่อยู่ตามหลังทั้งหมดไปพร้อมกัน"
                                    >
                                        <Link size={14} />
                                        ลากกลุ่ม (Ripple)
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSaveToWiki}
                                        disabled={!selectedSong || lyrics.length === 0}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow"
                                    >
                                        <Save size={14} />
                                        บันทึกข้อมูล
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Right Sidebar (Creator Tools) */}
                <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 hidden lg:flex font-sans">
                    <div className="p-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
                        <h2 className="font-bold text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <Settings size={16} className="text-purple-400" />
                            เครื่องมือแต่งเนื้อร้อง
                        </h2>
                        {lyrics.length > 0 && (
                            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                                {lyrics.length} บรรทัด
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        
                        {/* Section 1: Lyric Source Selector */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                1. แหล่งข้อมูลเนื้อร้อง
                            </h3>
                            
                            <button 
                                onClick={handleImportFromWiki}
                                disabled={!selectedSong}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-zinc-200 text-xs py-3 px-4 rounded-xl font-bold transition-all flex items-center gap-3 active:scale-95 shadow"
                                title="ดึงข้อมูลเนื้อร้องที่มีอยู่แล้วบนคลาวด์/Wiki"
                            >
                                <UploadCloud size={16} className="text-sky-400 shrink-0" />
                                <div className="text-left">
                                    <p className="font-bold">ดึงเนื้อร้องออนไลน์ (คลาวด์)</p>
                                    <p className="text-[10px] font-normal text-zinc-500">โหลดข้อมูลจากฐานข้อมูลกลาง</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setShowPasteModal(true)}
                                disabled={!selectedSong}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-zinc-200 text-xs py-3 px-4 rounded-xl font-bold transition-all flex items-center gap-3 active:scale-95 shadow"
                                title="พิมพ์หรือวางเนื้อเพลงดิบเพื่อจัดเวลาด้วยตัวเอง"
                            >
                                <FileText size={16} className="text-emerald-400 shrink-0" />
                                <div className="text-left">
                                    <p className="font-bold">พิมพ์ / วางเนื้อร้องเอง</p>
                                    <p className="text-[10px] font-normal text-zinc-500">วางท่อนร้องดิบมาซิงค์จังหวะเอง</p>
                                </div>
                            </button>

                            <button 
                                onClick={handleTranscribe}
                                disabled={isTranscribing || !selectedSong}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-zinc-200 text-xs py-3 px-4 rounded-xl font-bold transition-all flex items-center gap-3 active:scale-95 shadow"
                            >
                                {isTranscribing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-400 shrink-0"></div>
                                ) : (
                                    <Mic size={16} className="text-purple-400 shrink-0" />
                                )}
                                <div className="text-left">
                                    <p className="font-bold">ถอดเนื้อร้องอัตโนมัติ (AI)</p>
                                    <p className="text-[10px] font-normal text-zinc-500">ให้ปัญญาประดิษฐ์แกะเนื้อร้องไทย</p>
                                </div>
                            </button>
                        </div>

                        {/* Section 2: Canvas Text Overlay Styling */}
                        <div className="space-y-4 pt-4 border-t border-zinc-900">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                2. รูปแบบตัวอักษรบนพรีวิว
                            </h3>
                            
                            <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                                <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Type size={14} className="text-purple-400" /> รูปแบบฟอนต์</span>
                                <select 
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none w-max text-right cursor-pointer"
                                >
                                    <option value="Sukhumvit Set">Sukhumvit (ค่าเริ่มต้น)</option>
                                    <option value="'Kanit', sans-serif">Kanit (คณิต)</option>
                                    <option value="'Prompt', sans-serif">Prompt (พร้อม)</option>
                                    <option value="'Sarabun', sans-serif">Sarabun (สารบรรณ)</option>
                                    <option value="'Mali', cursive">Mali (มะลิ)</option>
                                    <option value="'Itim', cursive">Itim (ไอติม)</option>
                                </select>
                            </div>

                            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">ขนาดฟอนต์</span>
                                    <span className="font-mono text-zinc-400">{fontSize}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="24" max="100" 
                                    value={fontSize} 
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">ความหนาของขอบ</span>
                                    <span className="font-mono text-zinc-400">{fontOutline}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="10" step="0.5"
                                    value={fontOutline} 
                                    onChange={(e) => setFontOutline(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            <div className="bg-purple-950/20 border border-purple-500/25 p-3.5 rounded-xl text-xs text-purple-200">
                                <p className="font-bold flex items-center gap-1.5 mb-1">
                                    💡 เคล็ดลับจัดวางหน้าจอ
                                </p>
                                <p className="text-zinc-400 leading-relaxed mb-2.5">
                                    ท่านสามารถคลิกแล้วลากข้อความพรีวิวเนื้อร้องบนจอวิดีโอเพื่อปรับแต่งตำแหน่งแสดงผลได้อย่างอิสระ
                                </p>
                                <button 
                                    onClick={() => setLyricPos({ x: 50, y: 85 })} 
                                    className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 py-1.5 rounded-lg font-semibold transition-colors active:scale-95"
                                >
                                    รีเซ็ตตำแหน่งตรงกลางล่าง
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className="h-48 border-t border-zinc-800 bg-zinc-950 flex flex-col shrink-0 font-sans">
                {/* Timeline Toolbar */}
                <div className="h-11 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-900/30 shrink-0">
                    <div className="flex items-center gap-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                            <button className="hover:text-white transition-all p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg active:scale-90" onClick={togglePlay}>
                                {isPlaying ? <Pause size={14} className="text-purple-400" /> : <Play size={14} />}
                            </button>
                        </div>
                        <span className="text-xs font-mono text-zinc-300 w-16">{formatTime(currentTime)}</span>
                        
                        {selectedSong && (
                            <div className="flex items-center bg-zinc-950 border border-zinc-800/80 p-0.5 rounded-lg ml-2">
                                <button
                                    onClick={() => setAudioTrack('vocals')}
                                    className={clsx(
                                        "p-1.5 rounded transition-all",
                                        audioTrack === 'vocals' ? "bg-purple-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                    title="เสียงร้องเท่านั้น (Vocals)"
                                >
                                    <Mic size={14} />
                                </button>
                                <button
                                    onClick={() => setAudioTrack('instrumental')}
                                    className={clsx(
                                        "p-1.5 rounded transition-all",
                                        audioTrack === 'instrumental' ? "bg-purple-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                    title="ดนตรีเปล่า (Backing)"
                                >
                                    <Music size={14} />
                                </button>
                                <button
                                    onClick={() => setAudioTrack('original')}
                                    className={clsx(
                                        "p-1.5 rounded transition-all",
                                        audioTrack === 'original' ? "bg-purple-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                    title="รวมเสียง (Mix)"
                                >
                                    <Sparkles size={14} />
                                </button>
                            </div>
                        )}
                    </div>

