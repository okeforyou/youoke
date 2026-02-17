import React, { useState } from 'react';
import {
  X,
  Monitor,
  Youtube,
  Loader2,
  Tv,
  ChevronDown,
  ChevronUp,
  Radio
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
  onJoinRoom
}) => {
  const [showTvSteps, setShowTvSteps] = useState(false);
  const [pairingCode, setPairingCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-[320px] w-full p-4 relative my-auto max-h-[95vh] overflow-y-auto border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Title */}
        <div className="text-center mb-5 mt-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            เลือกวิธี Cast
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-2">

          {/* 1. ระบบ 2 หน้าจอ (Dual Screen) - PRIORITY #1 */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">ระบบ 2 หน้าจอ (Dual Screen)</h3>
                  <p className="text-[10px] text-gray-500 font-medium">คุมที่คอมพิวเตอร์ (เสียงออกที่คอมฯ)</p>
                </div>
              </div>
            </button>
          )}

          {/* 2. หน้าจอทีวี (Smart TV) */}
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden p-3.5 space-y-3.5 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Tv className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">หน้าจอทีวี (Smart TV)</h3>
                <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">เปิด play.youoke.com/tv บนทีวีแล้วกรอกรหัส</p>
              </div>
            </div>

            {/* Pairing Code Input - Always Visible */}
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="กรอกรหัส 4 หลัก"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="flex-1 min-w-0 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-center placeholder:text-gray-400 focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none"
              />
              <button
                onClick={() => {
                  if (pairingCode.length === 4) {
                    onJoinRoom(pairingCode);
                    setPairingCode('');
                  }
                }}
                disabled={pairingCode.length !== 4}
                className="btn btn-primary btn-sm rounded-xl px-5 disabled:opacity-50 min-h-[40px] h-[40px] font-bold"
              >
                เชื่อมต่อ
              </button>
            </div>

            <p className="text-[9px] text-gray-400 text-center font-medium opacity-60">หรือสแกน QR Code ที่หน้าจอทีวี</p>
          </div>

          {/* 3. Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left bg-white dark:bg-white/5 rounded-2xl p-3 border transition-all group shadow-sm relative overflow-hidden",
              isCastAvailable
                ? "hover:bg-gray-50 dark:hover:bg-white/5 border-gray-100 dark:border-white/5 cursor-pointer"
                : "bg-gray-50 dark:bg-white/5 border-transparent cursor-not-allowed opacity-40 text-gray-400"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border",
                isCastAvailable ? "bg-primary/5 text-primary border-primary/10" : "bg-gray-100 text-gray-400 border-gray-200"
              )}>
                {isCastAvailable ? (
                  <Radio className="w-4 h-4" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Google Cast</h3>
                <p className="text-[10px] text-gray-500 font-medium">ส่งภาพขึ้นหน้าจอทันที</p>
              </div>
            </div>
          </button>

          {/* 4. YouTube Cast */}
          <button
            onClick={onSelectYouTube}
            className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                <Youtube className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                <p className="text-[10px] text-gray-500 font-medium">ส่งตรงไป YouTube app บนทีวี</p>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};
