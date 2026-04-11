import React, { useState } from 'react';
import {
  X,
  Monitor,
  Youtube,
  Loader2,
  Tv,
  ChevronDown,
  ChevronUp,
  Radio,
  Cast
} from 'lucide-react';
import clsx from 'clsx';

interface CastModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  isCastAvailable: boolean;
  isMobile?: boolean;
  onSelectWebMonitor: () => void;
  onSelectSmartTV: () => void;
  onSelectDual: () => void;
  onSelectDj: () => void;
  onSelectGoogleCast: () => void;
  onSelectYouTube: () => void;
  onJoinRoom: (code: string) => void;
  onDisconnect?: () => void;
  castMode?: string;
}

export const CastModeSelector: React.FC<CastModeSelectorProps> = ({
  isOpen,
  onClose,
  isCastAvailable,
  isMobile = false,
  onSelectWebMonitor,
  onSelectSmartTV,
  onSelectDual,
  onSelectDj,
  onSelectGoogleCast,
  onSelectYouTube,
  onJoinRoom,
  onDisconnect,
  castMode = 'none'
}) => {
  const [showTvSteps, setShowTvSteps] = useState(true);
  const [pairingCode, setPairingCode] = useState('');

  if (!isOpen) return null;

  const isActive = castMode !== 'none';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-lg w-[92%] sm:w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Title */}
        <div className="text-center mb-8 mt-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            เลือกวิธี Cast
          </h2>
          {isActive && (
            <span className="text-[12px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1 rounded-full mt-2 inline-block">
              กำลังเชื่อมต่ออยู่
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">

          {/* ... existing buttons ... */}

          {/* 1. สาย HDMI (Local Dual Screen) */}
          {!isMobile && (
            <div className={clsx(
              "relative bg-white dark:bg-zinc-800/50 rounded-3xl border border-gray-100 dark:border-zinc-800 transition-all shadow-sm overflow-hidden",
              castMode === 'dual' && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-500/10"
            )}>
              <button
                onClick={onSelectDual}
                className="w-full text-left p-4.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all group relative"
              >
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all",
                    castMode === 'dual' ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-orange-500/10 text-orange-500"
                  )}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-gray-900 dark:text-gray-100">โหมดสายต่อ (HDMI Mode)</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ต่อจอแยก (Local Sync)</p>
                  </div>
                  {castMode === 'dual' && onDisconnect && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 z-20"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* 2. หน้าจอไร้สาย (Wireless Display / Smart TV) */}
          <div className={clsx(
            "bg-white dark:bg-zinc-800/50 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all",
            castMode === 'smarttv' && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-500/10"
          )}>
            <div
              className="w-full flex items-center p-4.5 group relative"
            >
              <button onClick={onSelectSmartTV} className="flex flex-1 items-center gap-4 text-left">
                <div className={clsx(
                   "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all",
                   castMode === 'smarttv' ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-primary/5 text-primary"
                )}>
                  <Radio className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 dark:text-gray-100">จอภาพไร้สาย (Wireless Display)</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">ส่งภาพไปทีวี หรือคอมอื่นๆ</p>
                </div>
              </button>
              
              {castMode === 'smarttv' && onDisconnect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 z-20"
                >
                  ยกเลิก
                </button>
              )}
            </div>
            <button
              onClick={() => setShowTvSteps(!showTvSteps)}
              className="w-full py-2 px-4 border-t border-gray-50 dark:border-zinc-800 flex items-center justify-between text-[9px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-[0.2em]"
            >
              <span>วิธีเชื่อมต่อ / กรอกรหัส</span>
              {showTvSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showTvSteps && (
              <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-1 duration-200">
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-xs font-bold text-gray-700 dark:text-zinc-300 leading-relaxed border border-gray-100 dark:border-white/5 shadow-inner">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-black text-[10px]">1</span>
                    <p>เปิด <span className="font-black text-primary underline underline-offset-4 decoration-primary/30">{typeof window !== 'undefined' ? (window.location.host.includes('localhost') ? 'youoke.vercel.app' : window.location.host) : 'play.okeforyou.com'}/monitor</span> บนหน้าจออื่น</p>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-black text-[10px]">2</span>
                    <p>กรอกรหัส 4 หลักที่ปรากฏขึ้นบนจอนั้น</p>
                  </div>
                </div>

                {/* Pairing Code Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="เลข 4 หลัก"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="flex-1 min-w-0 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border-none rounded-2xl px-4 py-3.5 text-base font-black text-center placeholder:text-gray-400 focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-white/10 transition-all outline-none shadow-inner"
                  />
                  <button
                    onClick={() => {
                      if (pairingCode.length === 4) {
                        onJoinRoom(pairingCode);
                        setPairingCode('');
                      }
                    }}
                    disabled={pairingCode.length !== 4}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 min-h-[52px] h-[52px] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-30 active:scale-95 transition-all whitespace-nowrap border-none"
                  >
                    เชื่อมต่อ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Google Cast */}
          <div className={clsx(
            "bg-white dark:bg-zinc-800/50 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all",
            castMode === 'google' && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-500/10"
          )}>
            <div className={clsx(
              "w-full flex items-center p-4.5 transition-all group relative",
              !isCastAvailable && "opacity-40"
            )}>
              <button 
                onClick={onSelectGoogleCast} 
                disabled={!isCastAvailable}
                className="flex flex-1 items-center gap-4 text-left disabled:cursor-not-allowed"
              >
                <div className={clsx(
                  "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                  castMode === 'google' ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" : (isCastAvailable ? "bg-primary/5 text-primary" : "bg-gray-100 dark:bg-zinc-800 text-gray-400")
                )}>
                  {isCastAvailable ? (
                    <Cast className="w-5 h-5" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 dark:text-gray-100">Google ChromeCast</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ส่งภาพขึ้นหน้าจอทีวีทันที</p>
                </div>
              </button>

              {castMode === 'google' && onDisconnect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 z-20"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          {/* 4. YouTube Cast */}
          <div className={clsx(
            "bg-white dark:bg-zinc-800/50 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all",
            castMode === 'youtube' && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-500/10"
          )}>
            <div className="w-full flex items-center p-4.5 group relative">
              <button onClick={onSelectYouTube} className="flex flex-1 items-center gap-4 text-left">
                <div className={clsx(
                    "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all",
                    castMode === 'youtube' ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-primary/5 text-primary"
                )}>
                  <Youtube className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ส่งตรงไป TV YouTube App</p>
                </div>
              </button>

              {castMode === 'youtube' && onDisconnect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 z-20"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
