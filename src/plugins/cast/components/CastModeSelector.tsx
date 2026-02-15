import React from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Cast,
  Youtube,
  Loader2,
  Tv
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
  onSelectWebMonitor,
  onSelectSmartTV,
  onSelectDual,
  onSelectDj,
  onSelectGoogleCast,
  onSelectYouTube,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-sm w-full p-6 relative my-auto max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
            <Cast className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {isMobile ? 'Cast / Remote' : 'เลือกวิธีเชื่อมต่อ'}
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">สัมผัสประสบการณ์ร้องเพลงที่เหนือกว่า</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: Mobile Remote */}
          <button
            onClick={onSelectWebMonitor}
            className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-blue-600 shadow-inner">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">รีโมทมือถือ</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Mobile Remote</p>
              </div>
            </div>
          </button>

          {/* Option 2: Smart TV Player */}
          {!isMobile && (
            <button
              onClick={onSelectSmartTV}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform text-primary shadow-inner">
                  <Tv className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">หน้าจอทีวี (Smart TV)</h3>
                  <p className="text-[11px] text-primary font-bold uppercase tracking-wider">Premium Interface</p>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            </button>
          )}

          {/* Option 3: Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left rounded-2xl p-4 border transition-all group shadow-sm",
              isCastAvailable
                ? "bg-gray-50 dark:bg-white/5 hover:bg-primary/5 border-gray-100 dark:border-white/5 hover:border-primary/30 cursor-pointer"
                : "bg-gray-100 dark:bg-white/5 border-transparent cursor-not-allowed opacity-40"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={clsx(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                isCastAvailable ? "bg-orange-500/10 text-orange-600" : "bg-gray-200 text-gray-400"
              )}>
                {isCastAvailable ? (
                  <Cast className="w-6 h-6" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Google Cast</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Chromecast / Android TV</p>
              </div>
            </div>
          </button>

          {/* Option 4: Dual Screen */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-purple-600 shadow-inner">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">จอแยก (Dual Screen)</h3>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Extend to Second Screen</p>
                </div>
              </div>
            </button>
          )}

          {/* Option 5: YouTube Cast */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-red-600 shadow-inner">
                  <Youtube className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Open in YouTube App</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
