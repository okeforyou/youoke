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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-sm w-[92%] sm:w-full p-6 relative my-auto max-h-[95vh] overflow-y-auto border border-white/20">
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
            <button
              onClick={onSelectDual}
              className={clsx(
                "w-full text-left bg-white dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-3xl p-4.5 border border-gray-100 dark:border-zinc-800 transition-all group relative overflow-hidden shadow-sm",
                castMode === 'dual' && "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-500/10"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-13 h-13 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-orange-500">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 dark:text-gray-100">โหมดสายต่อ (HDMI Mode)</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">ต่อจอแยก (Local Sync)</p>
                </div>
              </div>
            </button>
          )}

          {/* 2. หน้าจอไร้สาย (Wireless Display / Smart TV) */}
          <div className={clsx(
            "bg-white dark:bg-zinc-800/50 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden",
            castMode === 'smarttv' && "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-500/10"
          )}>
            <button
              onClick={onSelectSmartTV}
              className="w-full text-left p-4.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all group relative"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-13 h-13 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 dark:text-gray-100">จอภาพไร้สาย (Wireless Display)</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide leading-tight">ส่งภาพไปทีวี หรือคอมอื่นๆ</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowTvSteps(!showTvSteps)}
              className="w-full py-2 px-4 border-t border-gray-50 dark:border-zinc-800 flex items-center justify-between text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              <span>วิธีเชื่อมต่อ / กรอกรหัส</span>
              {showTvSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showTvSteps && (
              <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-1 duration-200">
                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-black text-[10px]">1</span>
                    <p>เปิด <span className="font-black text-primary">{typeof window !== 'undefined' ? window.location.host : 'youoke.vercel.app'}/monitor</span> บนหน้าจออื่น</p>
                  </div>
                  <div className="flex gap-3 mt-2">
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
                    className="flex-1 min-w-0 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border-none rounded-2xl px-4 py-3.5 text-base font-black text-center placeholder:text-gray-400 focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-white/10 transition-all outline-none"
                  />
                  <button
                    onClick={() => {
                      if (pairingCode.length === 4) {
                        onJoinRoom(pairingCode);
                        setPairingCode('');
                      }
                    }}
                    disabled={pairingCode.length !== 4}
                    className="btn btn-primary rounded-2xl px-6 disabled:opacity-50 min-h-[48px] h-[48px] font-black text-sm uppercase tracking-widest whitespace-nowrap"
                  >
                    เชื่อมต่อ
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left bg-white dark:bg-zinc-800/50 rounded-3xl p-4.5 border transition-all group shadow-sm relative overflow-hidden",
              isCastAvailable
                ? "hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-100 dark:border-zinc-800 cursor-pointer"
                : "bg-gray-50 dark:bg-zinc-800/20 border-transparent cursor-not-allowed opacity-40 text-gray-400",
              castMode === 'google' && "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-500/10"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={clsx(
                "flex-shrink-0 w-13 h-13 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                isCastAvailable ? "bg-primary/5 text-primary" : "bg-gray-100 text-gray-400"
              )}>
                {isCastAvailable ? (
                  <Cast className="w-6 h-6" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100">Google ChromeCast (AndroidTV)</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">ส่งภาพขึ้นหน้าจอทันที</p>
              </div>
            </div>
          </button>

          {/* 4. YouTube Cast - HIDDEN as requested implicitly by making it no-op, or just leave as is */}
          <button
            onClick={onSelectYouTube}
            className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-3xl p-4.5 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-13 h-13 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
                <Youtube className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">ส่งตรงไป TV YouTube App</p>
              </div>
            </div>
          </button>

          {/* 🛑 DISCONNECT BUTTON */}
          {isActive && onDisconnect && (
            <button
              onClick={onDisconnect}
              className="w-full flex items-center justify-center gap-2 mt-4 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
            >
              <X className="w-4 h-4" strokeWidth={3} />
              ยกเลิกการเชื่อมต่อ
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
