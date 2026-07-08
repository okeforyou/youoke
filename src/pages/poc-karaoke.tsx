import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function POCKaraoke() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [vocalVolume, setVocalVolume] = useState(1);
  const [instrumentalVolume, setInstrumentalVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs for audio elements
  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  const vocalRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if both files are loaded and ready
    const handleCanPlayThrough = () => {
      if (instrumentalRef.current && vocalRef.current) {
        if (
          instrumentalRef.current.readyState >= 3 &&
          vocalRef.current.readyState >= 3
        ) {
          setIsLoaded(true);
          setDuration(instrumentalRef.current.duration);
        }
      }
    };

    const instAudio = instrumentalRef.current;
    const vocAudio = vocalRef.current;

    if (instAudio && vocAudio) {
      instAudio.addEventListener('canplaythrough', handleCanPlayThrough);
      vocAudio.addEventListener('canplaythrough', handleCanPlayThrough);
      
      // Update progress
      instAudio.addEventListener('timeupdate', () => {
        if (instAudio.duration) {
          setProgress((instAudio.currentTime / instAudio.duration) * 100);
        }
      });
      
      // Handle end of song
      instAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        if (vocAudio) vocAudio.currentTime = 0;
      });
    }

    return () => {
      if (instAudio && vocAudio) {
        instAudio.removeEventListener('canplaythrough', handleCanPlayThrough);
        vocAudio.removeEventListener('canplaythrough', handleCanPlayThrough);
      }
    };
  }, []);

  // Update volumes when state changes
  useEffect(() => {
    if (vocalRef.current) {
      vocalRef.current.volume = vocalVolume;
    }
  }, [vocalVolume]);

  useEffect(() => {
    if (instrumentalRef.current) {
      instrumentalRef.current.volume = instrumentalVolume;
    }
  }, [instrumentalVolume]);

  const togglePlay = () => {
    if (!instrumentalRef.current || !vocalRef.current) return;

    if (isPlaying) {
      instrumentalRef.current.pause();
      vocalRef.current.pause();
    } else {
      // Re-sync before playing to ensure they are exactly aligned
      vocalRef.current.currentTime = instrumentalRef.current.currentTime;
      instrumentalRef.current.play();
      vocalRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!instrumentalRef.current || !vocalRef.current) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    instrumentalRef.current.currentTime = newTime;
    vocalRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center font-sans">
      <Head>
        <title>Karaoke PoC - Vocal Separation</title>
      </Head>

      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Karaoke Mode (PoC)</h1>
          <p className="text-gray-400 text-sm">Testing Demucs Vocal Separation</p>
        </div>

        {/* Audio Elements (Hidden) */}
        {/* We assume the files are placed in public/ folder */}
        <audio ref={instrumentalRef} src="/no_vocals.wav" preload="auto" />
        <audio ref={vocalRef} src="/vocals.wav" preload="auto" />

        {!isLoaded ? (
          <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-xl mb-6">
            <p className="text-gray-400 mb-2">กำลังโหลดไฟล์เสียง...</p>
            <p className="text-xs text-gray-500">
              (หากโหลดไม่ขึ้น โปรดตรวจสอบว่ามีไฟล์ <code className="bg-gray-700 px-1 py-0.5 rounded text-pink-400">vocals.wav</code> และ <code className="bg-gray-700 px-1 py-0.5 rounded text-pink-400">no_vocals.wav</code> ในโฟลเดอร์ public/ หรือไม่)
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Playback Controls */}
            <div className="flex flex-col items-center">
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors shadow-lg shadow-pink-600/30 mb-4"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3 text-sm text-gray-400">
                <span>{formatTime(instrumentalRef.current?.currentTime || 0)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Mixer Controls */}
            <div className="bg-gray-900 rounded-xl p-5 space-y-5 border border-gray-700">
              <h3 className="text-gray-300 font-medium text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Audio Mixer
              </h3>
              
              {/* Vocal Volume */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-pink-400 font-medium">🎤 เสียงร้อง (Vocals)</span>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{Math.round(vocalVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vocalVolume}
                  onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mute</span>
                  <span>Max</span>
                </div>
              </div>

              {/* Instrumental Volume */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-blue-400 font-medium">🎸 ดนตรี (Instrumental)</span>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{Math.round(instrumentalVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={instrumentalVolume}
                  onChange={(e) => setInstrumentalVolume(parseFloat(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                 <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mute</span>
                  <span>Max</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
