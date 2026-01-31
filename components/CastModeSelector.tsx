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
  ClockIcon
} from '@heroicons/react/24/outline';

interface CastModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  isCastAvailable: boolean;
  isMobile?: boolean; // Mobile detection
  onSelectWebMonitor: () => void;
  onSelectDual: () => void;
  onSelectGoogleCast: () => void;
  onSelectYouTube: () => void;
  onJoinWebMonitor: (code: string) => void;
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
  onJoinWebMonitor,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [roomCode, setRoomCode] = React.useState('');

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
                {loading ? <ClockIcon className="w-5 h-5 animate-spin text-primary" /> : <TvIcon className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">TV Receiver (Smart TV)</h3>
                <p className="text-xs text-gray-600">เปิด youoke.vercel.app/tv บนทีวี</p>
              </div>
            </div>
          </button>

          {/* Connect to Remote via Code */}
          <div className="pt-2">
            <div className="relative flex items-center mb-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">หรือ เข้าร่วมด้วยรหัส</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="เลขห้อง 6 หลัก"
                maxLength={6}
                className="input input-bordered w-full input-sm"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <button
                disabled={roomCode.length < 6}
                onClick={() => onJoinWebMonitor(roomCode)}
                className="btn btn-sm btn-primary"
              >
                Join
              </button>
            </div>
          </div>

          {/* Option 2: Dual Screen (2 หน้าจอ) - PC Only */}
          {!isMobile && (
            <button
              onClick={onSelectDual}
              className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-lg p-3 border border-base-300 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ComputerDesktopIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-0.5">2 หน้าจอ (Dual Screen)</h3>
                  <p className="text-xs text-gray-600">เปิดหน้าจอที่ 2 ทันที</p>
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
                  <SignalIcon className="w-5 h-5 text-primary" />
                ) : (
                  <ClockIcon className="w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">
                  Google Cast (Chromecast)
                </h3>
                <p className="text-xs text-gray-600">
                  {isCastAvailable ? 'Auto-discover ไม่ต้องกรอกรหัส' : 'ไม่รองรับ iOS/Safari - ใช้ Android Chrome'}
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
                  <PlayCircleIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-0.5">YouTube Cast</h3>
                  <p className="text-xs text-gray-600">ส่งตรงไป YouTube app</p>
                </div>
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
