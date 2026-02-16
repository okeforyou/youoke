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
  Volume2,
  Speaker
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
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)] max-w-[380px] w-full p-5 relative my-auto max-h-[95vh] overflow-y-auto border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary mb-2">
            <Cast className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {isMobile ? 'Cast / Remote' : 'เลือกวิธี Cast'}
          </h2>
          <p className="text-gray-500 text-[12px] font-medium italic opacity-80">"ร้องเพลงได้ทุกที่ ทุกอุปกรณ์"</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">

          {/* 1. จอเสริม (Mirror Mode) */}
          {!isMobile && (
            <button
              onClick={onSelectDual}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-blue-600 shadow-inner border border-blue-500/10">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 leading-tight">
                    จอเสริม (Mirror Mode)
                    <Volume2 className="w-3.5 h-3.5 text-blue-500 opacity-60" />
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">
                    คุมที่นี่ <span className="text-blue-600 underline font-black">เสียงออกเครื่องนี้</span> - ต่อสาย HDMI
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* 2. แยกเครื่องเล่น (DJ Player) */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-purple-600 shadow-inner border border-purple-500/10">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    แยกเครื่องเล่น (DJ Mode)
                    <Speaker className="w-3.5 h-3.5 text-purple-500 opacity-60 inline ml-1.5" />
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">
                    คุมที่นี่ <span className="text-purple-600 underline font-black">เสียงออกจอแยก</span> - เปิด 2 จอ อิสระ
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* 3. หน้าจอทีวี (Smart TV) - CROSS DEVICE */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 overflow-hidden shadow-sm">
            <button
              onClick={onSelectSmartTV}
              className="w-full text-left p-3.5 hover:bg-primary/10 transition-all group relative"
            >
              <div className="absolute top-2 right-3 flex items-center gap-1">
                <span className="text-[8px] font-black bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">CROSS-DEVICE</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform text-primary shadow-inner border border-primary/20">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 leading-tight">หน้าจอทีวี (Smart TV)</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tight mt-0.5">เหมาะสำหรับ Smart TV / Tablet</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowTvSteps(!showTvSteps)}
              className="w-full py-1.5 px-3.5 border-t border-primary/10 flex items-center justify-between text-[9px] font-black text-primary/60 hover:text-primary transition-colors uppercase tracking-widest"
            >
              <span>วิธีใช้งานทีวี</span>
              {showTvSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showTvSteps && (
              <div className="p-3.5 pt-0 space-y-2 animate-in slide-in-from-top-1 duration-200">
                <div className="bg-white/50 dark:bg-black/20 rounded-xl p-2.5 text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed border border-primary/5">
                  <div className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <p>เปิดเบราว์เซอร์บนทีวีไปที่ <span className="font-bold text-primary">play.youoke.com/tv</span></p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <p>ใช้มือถือ <span className="font-bold text-primary">สแกน QR Code</span> หรือ <span className="font-bold text-primary">กรอกรหัส</span> ที่ปรากฏบนจอทีวี</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Google Cast (Chromecast) - CROSS DEVICE */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={clsx(
              "w-full text-left rounded-2xl p-3.5 border transition-all group shadow-sm relative overflow-hidden",
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

            <div className="flex items-center gap-3">
              <div className={clsx(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner border",
                isCastAvailable ? "bg-orange-500/10 text-orange-600 border-orange-500/10" : "bg-gray-200 text-gray-400 border-gray-200"
              )}>
                {isCastAvailable ? (
                  <Cast className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 leading-tight">Google Cast</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">ส่งภาพขึ้น Chromecast ทันที - ไม่ต้องกรอกรหัส</p>
              </div>
            </div>
          </button>

          {/* 5. YouTube Cast - CROSS DEVICE */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-gray-50 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-2 right-3 flex items-center gap-1">
                <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">APP REDIRECT</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-red-600 shadow-inner border border-red-500/10">
                  <Youtube className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 leading-tight">YouTube Cast</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">ส่งตรงไปแอป YouTube บนทีวี</p>
                </div>
              </div>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
