import React from 'react';
import {
  X,
  Monitor,
  Cast,
  Youtube,
  Loader2,
  Tv,
  Layers,
  ExternalLink
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
            {isMobile ? 'Cast / Remote' : 'เลือกวิธี Cast'}
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-medium italic">"ร้องเพลงได้ทุกที่ ทุกอุปกรณ์"</p>
        </div>

        {/* Options */}
        <div className="space-y-3">

          {/* 1. จอเสริม (Mirror Mode) */}
          {!isMobile && (
            <button
              onClick={onSelectDual}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-blue-600 shadow-inner border border-blue-500/10">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    จอเสริม (Mirror Mode)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">โคลนภาพ (เสียงออกเครื่องนี้) - เหมาะสำหรับต่อสาย HDMI</p>
                </div>
              </div>
            </button>
          )}

          {/* 2. แยกเครื่องเล่น (DJ Player) */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-purple-600 shadow-inner border border-purple-500/10">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">แยกเครื่องเล่น (DJ Player)</h3>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">แยกจอทำงานอิสระ (เสียงออกจอแยก) - เปิดสองจอคอนโทรลได้</p>
                </div>
              </div>
            </button>
          )}

          {/* 3. หน้าจอทีวี (Smart TV) - CROSS DEVICE */}
          <button
            onClick={onSelectSmartTV}
            className="w-full text-left bg-primary/5 hover:bg-primary/10 rounded-2xl p-4 border border-primary/20 hover:border-primary/40 transition-all group relative overflow-hidden shadow-sm"
          >
            {/* Badge for Cross Device */}
            <div className="absolute top-2 right-3 flex items-center gap-1">
              <span className="text-[8px] font-black bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">CROSS-DEVICE</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform text-primary shadow-inner border border-primary/20">
                <Tv className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">หน้าจอทีวี (Smart TV)</h3>
                <p className="text-[11px] text-primary font-bold uppercase tracking-tight">เหมาะสำหรับ Smart TV / Tablet - ส่งภาพแบบข้ามอุปกรณ์</p>
              </div>
            </div>
          </button>

          {/* 4. Google Cast (Chromecast) - CROSS DEVICE */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left rounded-2xl p-4 border transition-all group shadow-sm relative overflow-hidden",
              isCastAvailable
                ? "bg-gray-50 dark:bg-white/5 hover:bg-primary/5 border-gray-100 dark:border-white/5 hover:border-primary/30 cursor-pointer"
                : "bg-gray-100 dark:bg-white/5 border-transparent cursor-not-allowed opacity-40 text-gray-400"
            )}
          >
            {isCastAvailable && (
              <div className="absolute top-2 right-3 flex items-center gap-1">
                <span className="text-[8px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">WIRELESS</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className={clsx(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner border",
                isCastAvailable ? "bg-orange-500/10 text-orange-600 border-orange-500/10" : "bg-gray-200 text-gray-400 border-gray-200"
              )}>
                {isCastAvailable ? (
                  <Cast className="w-6 h-6" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Google Cast</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">ส่งภาพขึ้น Chromecast ทันที - ไม่ต้องกรอกรหัส</p>
              </div>
            </div>
          </button>

          {/* 5. YouTube Cast - CROSS DEVICE */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-2 right-3 flex items-center gap-1">
                <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">APP REDIRECT</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-red-600 shadow-inner border border-red-500/10">
                  <Youtube className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">ส่งตรงไป YouTube app - สำหรับแอปบนทีวี</p>
                </div>
              </div>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
