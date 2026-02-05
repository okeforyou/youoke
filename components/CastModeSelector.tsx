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
  XMarkIcon,
  TvIcon,
  ComputerDesktopIcon,
  SignalIcon,
  PlayCircleIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  RectangleStackIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Custom Google Cast Icon (Standard Cast Logo)
const GoogleCastIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
    <line x1="2" y1="20" x2="2.01" y2="20" strokeWidth="3" />
  </svg>
);

interface CastModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  isCastAvailable: boolean;
  isMobile?: boolean; // Mobile detection
  onSelectWebMonitor: () => void;
  onSelectDual: () => void;
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
  onSelectGoogleCast,
  onSelectYouTube,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleWebMonitor = async () => {
    setLoading(true);
    await onSelectWebMonitor();
    setLoading(false);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-base-100 rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-5 relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost z-10"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-4 pr-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TvIcon className="w-6 h-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">
              {isMobile ? 'Cast to TV' : 'เลือกวิธี Cast'}
            </h2>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {/* Option 1: Web Monitor Cast - All Devices */}
          <button
            onClick={handleWebMonitor}
            disabled={loading}
            className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-lg p-3 border border-base-300 hover:border-primary transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {loading ? <ClockIcon className="w-5 h-5 animate-spin text-primary" /> : <DevicePhoneMobileIcon className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  {isMobile ? 'คุมทีวีจากเครื่องนี้' : 'ใช้มือถือคุม (ใส่รหัส)'}
                </h3>
                <p className="text-xs text-gray-500">
                  {isMobile ? 'ใช้เครื่องนี้เป็นรีโมท' : 'ใช้มือถือเป็นรีโมท เสียงออกที่ทีวี'}
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Dual Screen (2 หน้าจอ) - PC Only */}
          {!isMobile && (
            <button
              onClick={onSelectDual}
              className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-lg p-3 border border-base-300 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <RectangleStackIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-0.5">จอแยก (ต่อสาย HDMI)</h3>
                  <p className="text-xs text-gray-500">คุมที่คอม ร้องเพลงบนจอใหญ่</p>
                </div>
              </div>
            </button>
          )}

          {/* Option 3: Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={`w-full text-left rounded-lg p-3 border transition-all group ${isCastAvailable
              ? 'bg-base-200/50 hover:bg-base-200 border-base-300 hover:border-primary cursor-pointer'
              : 'bg-base-200/30 border-base-300 cursor-not-allowed opacity-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isCastAvailable ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-gray-200'
                }`}>
                {isCastAvailable ? (
                  <GoogleCastIcon className="w-5 h-5 text-primary" />
                ) : (
                  <ClockIcon className="w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">
                  ยิงขึ้นจอ (ไร้สาย)
                </h3>
                <p className="text-xs text-gray-500">
                  {isCastAvailable ? 'สำหรับ Google TV / Android TV' : 'ไม่รองรับ iOS/Safari - ใช้ Android Chrome'}
                </p>
              </div>
            </div>
          </button>

          {/* Option 4: YouTube Cast - PC Only */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-lg p-3 border border-base-300 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <PlayIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-0.5">ส่งเข้าแอป YouTube</h3>
                  <p className="text-xs text-gray-500">ร้องเพลงผ่านแอป YouTube โดยตรง</p>
                </div>
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
