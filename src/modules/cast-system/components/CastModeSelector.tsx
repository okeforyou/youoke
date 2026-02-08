/**
 * Cast Mode Selector
 *
 * Allows user to choose between:
 * 1. Web Monitor Cast (Firebase) - Full control with room code
 * 2. Dual Screen (2 หน้าจอ) - Instant second screen (no code needed)
 * 3. YouTube Cast - Direct to YouTube app
 */

import React from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Cast,
  Youtube,
  Loader2
} from 'lucide-react';

interface CastModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  isCastAvailable: boolean;
  isMobile?: boolean; // Mobile detection
  onSelectWebMonitor: () => void;
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
  onSelectDual,
  onSelectDj,
  onSelectGoogleCast,
  onSelectYouTube,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto">
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full p-5 relative my-auto max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <Cast className="w-6 h-6 text-primary" />
            <span>{isMobile ? 'Cast / Remote' : 'เลือกวิธีเชื่อมต่อ'}</span>
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: Mobile Remote - All Devices */}
          <button
            onClick={onSelectWebMonitor}
            className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-xl p-4 border border-base-300 hover:border-primary transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent -mr-4 -mt-4 rounded-bl-full" />
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-blue-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">ควบคุมด้วยมือถือ</h3>
                <p className="text-xs text-gray-500 font-medium">ใช้มือถือเลือกเพลง / เป็นรีโมท</p>
              </div>
            </div>
          </button>

          {/* Option 2.5: Dual Screen - Formerly DJ Player */}
          {!isMobile && (
            <button
              onClick={onSelectDj}
              className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-xl p-4 border border-base-300 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-purple-600">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">จอแยก (Dual Screen)</h3>
                  <p className="text-xs text-gray-500 font-medium">เปิดอีกหน้าต่างสำหรับร้องเพลง</p>
                </div>
              </div>
            </button>
          )}

          {/* Option 3: Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={`w-full text-left rounded-xl p-4 border transition-all group ${isCastAvailable
              ? 'bg-base-200/50 hover:bg-base-200 border-base-300 hover:border-primary cursor-pointer'
              : 'bg-base-200/30 border-base-300 cursor-not-allowed opacity-60 grayscale'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${isCastAvailable ? 'bg-orange-500/10 text-orange-600' : 'bg-gray-200 text-gray-400'
                }`}>
                {isCastAvailable ? (
                  <Cast className="w-6 h-6" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">
                  Google Cast
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {isCastAvailable ? 'ส่งภาพขึ้น TV (Chromecast/Android TV)' : 'กำลังค้นหาอุปกรณ์... (เฉพาะ Chrome Check)'}
                </p>
              </div>
            </div>
          </button>

          {/* Option 4: YouTube Cast - PC Only */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-xl p-4 border border-base-300 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform text-red-600">
                  <Youtube className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">YouTube Cast</h3>
                  <p className="text-xs text-gray-500 font-medium">เปิดผ่านแอป YouTube</p>
                </div>
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
