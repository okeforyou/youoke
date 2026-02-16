import React, { useState } from 'react';
import {
  X,
  Monitor,
  Cast,
  Youtube,
  Loader2,
  Tv,
  Layers,
  ChevronDown,
  ChevronUp,
  Speaker,
  Volume2,
  Radio
} from 'lucide-react';
import clsx from 'clsx';

interface CastModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  isCastAvailable: boolean;
  isMobile?: boolean; // Mobile detection
  onSelectWebMonitor: () => void;
  onSelectSmartTV: () => void;
  onSelectDual: () => void;
  onSelectDj: () => void;
  onSelectGoogleCast: () => void;
  onSelectYouTube: () => void;
}

export const CastModeSelector: React.FC<CastModeSelectorProps> = ({
  isOpen,
  onClose,
  isCastAvailable,
  isMobile = false,
  onSelectSmartTV,
  onSelectDual,
  onSelectDj,
  onSelectGoogleCast,
  onSelectYouTube,
}) => {
  const [showTvSteps, setShowTvSteps] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-sm w-full p-6 relative my-auto max-h-[95vh] overflow-y-auto border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-2">
            <Tv className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            เลือกวิธี Cast
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">

          {/* 1. เชื่อมต่อจอรับภาพ (Caster) */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            <button
              onClick={onSelectSmartTV}
              className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group relative"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Tv className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">เชื่อมต่อจอรับภาพ (Caster)</h3>
                  <p className="text-xs text-gray-500 font-medium">สแกน/กรอกรหัส เพื่อสั่งงาน</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowTvSteps(!showTvSteps)}
              className="w-full py-2 px-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-wider"
            >
              <span>วิธีใช้งาน</span>
              {showTvSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTvSteps && (
              <div className="p-4 pt-0 space-y-2 animate-in slide-in-from-top-1 duration-200">
                <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-3 text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed border border-gray-100 dark:border-white/5">
                  <div className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[10px]">1</span>
                    <p>เปิด <span className="font-bold text-primary">play.youoke.com/tv</span> บนทีวี</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[10px]">2</span>
                    <p>ใช้มือถือ <span className="font-bold text-primary">สแกน QR Code</span> หรือ <span className="font-bold text-primary">กรอกรหัส</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. จอเสริม (Mirror Mode) */}
          {!isMobile && (
            <button
              onClick={onSelectDual}
              className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">จอเสริม (Mirror Mode)</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">โคลนภาพ (เสียงออกเครื่องนี้)</p>
                </div>
              </div>
            </button>
          )}

          {/* 3. แยกเครื่องเล่น (DJ Player) */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">แยกเครื่องเล่น (DJ Player)</h3>
                  <p className="text-xs text-gray-500 font-medium">จอแยกทำงานอิสระ (เสียงออกจอแยก)</p>
                </div>
              </div>
            </button>
          )}

          {/* 4. Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left bg-white dark:bg-white/5 rounded-2xl p-4 border transition-all group shadow-sm relative overflow-hidden",
              isCastAvailable
                ? "hover:bg-gray-50 dark:hover:bg-white/5 border-gray-100 dark:border-white/5 cursor-pointer"
                : "bg-gray-50 dark:bg-white/5 border-transparent cursor-not-allowed opacity-40 text-gray-400"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={clsx(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border",
                isCastAvailable ? "bg-primary/5 text-primary border-primary/10" : "bg-gray-100 text-gray-400 border-gray-200"
              )}>
                {isCastAvailable ? (
                  <Radio className="w-6 h-6" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Google Cast (Chromecast)</h3>
                <p className="text-xs text-gray-500 font-medium">Auto-discover ไม่ต้องกรอกรหัส</p>
              </div>
            </div>
          </button>

          {/* 5. YouTube Cast */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Youtube className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                  <p className="text-xs text-gray-500 font-medium">ส่งตรงไป YouTube app</p>
                </div>
              </div>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
