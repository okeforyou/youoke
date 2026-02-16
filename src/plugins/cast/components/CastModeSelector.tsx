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
  AlertCircle
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
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-[340px] w-full p-4 relative my-auto max-h-[95vh] overflow-y-auto border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-1">
            <Tv className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            เลือกวิธี Cast
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-2.5">

          {/* 1. หน้าจอทีวี (Smart TV) */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            <button
              onClick={onSelectSmartTV}
              className="w-full text-left p-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group relative"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">หน้าจอทีวี (Smart TV)</h3>
                  <p className="text-[11px] text-gray-500 font-medium">สแกน/กรอกรหัส เพื่อสั่งงาน</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowTvSteps(!showTvSteps)}
              className="w-full py-1.5 px-3.5 border-t border-gray-50 dark:border-white/5 flex items-center justify-between text-[9px] font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-wider"
            >
              <span>วิธีใช้งาน</span>
              {showTvSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showTvSteps && (
              <div className="p-3.5 pt-0 space-y-2 animate-in slide-in-from-top-1 duration-200">
                <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-2.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed border border-gray-100 dark:border-white/5">
                  <div className="flex gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[9px]">1</span>
                    <p>เปิด <span className="font-bold text-primary">play.youoke.com/tv</span> บนทีวี</p>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[9px]">2</span>
                    <p>สแกน QR หรือกรอกรหัสที่ปรากฏ</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. ต่อจอเสริม (Dual Screen) - CONSOLIDATED */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">ต่อจอเสริม (Dual Screen)</h3>
                  <p className="text-[11px] text-gray-500 font-medium">แยกจอคุมหน้าหน้าจอหลัก</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-start gap-1.5 text-[9px] text-orange-600 dark:text-orange-400 font-bold uppercase leading-tight bg-orange-500/5 p-2 rounded-lg border border-orange-500/10">
                <AlertCircle size={12} className="shrink-0" />
                <span>แนะนำให้ปิดเสียงที่เครื่องคอมพิวเตอร์ของคุณหากแยกจอสำเร็จ</span>
              </div>
            </button>
          )}

          {/* 3. Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left bg-white dark:bg-white/5 rounded-2xl p-3.5 border transition-all group shadow-sm relative overflow-hidden",
              isCastAvailable
                ? "hover:bg-gray-50 dark:hover:bg-white/5 border-gray-100 dark:border-white/5 cursor-pointer"
                : "bg-gray-50 dark:bg-white/5 border-transparent cursor-not-allowed opacity-40 text-gray-400"
            )}
          >
            <div className="flex items-center gap-3.5">
              <div className={clsx(
                "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border",
                isCastAvailable ? "bg-primary/5 text-primary border-primary/10" : "bg-gray-100 text-gray-400 border-gray-200"
              )}>
                {isCastAvailable ? (
                  <Radio className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Google Cast</h3>
                <p className="text-[11px] text-gray-500 font-medium">Auto-discover ไม่ต้องกรอกรหัส</p>
              </div>
            </div>
          </button>

          {/* 4. YouTube Cast */}
          <button
            onClick={onSelectYouTube}
            className="w-full text-left bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5 transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform text-primary border border-primary/10">
                <Youtube className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                <p className="text-[11px] text-gray-500 font-medium">ส่งตรงไป YouTube app บนทีวี</p>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};
