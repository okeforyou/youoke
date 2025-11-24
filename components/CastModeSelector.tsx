/**
 * Cast Mode Selector
 *
 * Allows user to choose between:
 * 1. Web Monitor Cast (Firebase) - Full control with room code
 * 2. Dual Screen (2 หน้าจอ) - Instant second screen (no code needed)
 * 3. YouTube Cast - Direct to YouTube app
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-base-100 rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 relative my-auto max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 btn btn-sm btn-circle btn-ghost z-10"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-4 sm:mb-6 pr-8">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📺</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
            {isMobile ? 'Cast to TV' : 'เลือกวิธี Cast'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {isMobile
              ? 'ส่งเพลงไปทีวีผ่าน Chromecast'
              : 'เลือกวิธีที่ต้องการส่งเพลงไปทีวี'
            }
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 sm:space-y-4">
          {/* Option 1: Web Monitor Cast - All Devices */}
          <button
            onClick={onSelectWebMonitor}
            className="w-full text-left bg-primary/10 hover:bg-primary/20 rounded-lg p-3 sm:p-5 border-2 border-primary/30 hover:border-primary transition-all group"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl flex-shrink-0">🎮</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-1 sm:mb-2 group-hover:underline break-words">
                  Web Monitor Cast
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                  ควบคุมเต็มรูปแบบ - เพิ่ม/ลบเพลงได้แบบ real-time
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="badge badge-success badge-sm text-xs">เพิ่มคิวได้ทันที</span>
                  <span className="badge badge-success badge-sm text-xs">ควบคุมได้หมด</span>
                  <span className="badge badge-info badge-sm text-xs">แนะนำสำหรับร้าน</span>
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Dual Screen (2 หน้าจอ) - PC Only */}
          {!isMobile && (
            <button
              onClick={onSelectDual}
              className="w-full text-left bg-secondary/10 hover:bg-secondary/20 rounded-lg p-3 sm:p-5 border-2 border-secondary/30 hover:border-secondary transition-all group"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl flex-shrink-0">🖥️</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-secondary mb-1 sm:mb-2 group-hover:underline break-words">
                    2 หน้าจอ (Dual Screen)
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                    เปิดหน้าจอที่ 2 ทันที - ไม่ต้องกรอกรหัส
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="badge badge-success badge-sm text-xs">ง่ายที่สุด</span>
                    <span className="badge badge-success badge-sm text-xs">ไม่ต้องกรอกรหัส</span>
                    <span className="badge badge-info badge-sm text-xs">แนะนำสำหรับ DJ</span>
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Option 3: Google Cast (Chromecast) */}
          <button
            onClick={onSelectGoogleCast}
            disabled={!isCastAvailable}
            className={`w-full text-left rounded-lg p-3 sm:p-5 border-2 transition-all group ${
              isCastAvailable
                ? 'bg-accent/10 hover:bg-accent/20 border-accent/30 hover:border-accent cursor-pointer'
                : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="text-3xl sm:text-4xl flex-shrink-0">
                {isCastAvailable ? '📡' : '⏳'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 break-words ${
                  isCastAvailable ? 'text-accent group-hover:underline' : 'text-gray-500'
                }`}>
                  Google Cast (Chromecast)
                  {!isCastAvailable && <span className="ml-2 text-xs sm:text-sm">(กำลังโหลด...)</span>}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                  {isCastAvailable
                    ? 'Cast ไปยัง Chromecast - ไม่ต้องกรอกรหัส Auto-discover'
                    : 'รอสักครู่ กำลังโหลด Google Cast SDK...'
                  }
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {isCastAvailable ? (
                    <>
                      <span className="badge badge-success badge-sm text-xs">ง่ายที่สุด</span>
                      <span className="badge badge-success badge-sm text-xs">Auto-discover</span>
                      <span className="badge badge-info badge-sm text-xs">แนะนำสำหรับบ้าน</span>
                    </>
                  ) : (
                    <span className="badge badge-warning badge-sm text-xs">กำลังโหลด SDK...</span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Option 4: YouTube Cast - PC Only */}
          {!isMobile && (
            <button
              onClick={onSelectYouTube}
              className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-lg p-3 sm:p-5 border-2 border-base-300 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl flex-shrink-0">📱</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-1 sm:mb-2 group-hover:underline group-hover:text-primary break-words">
                    YouTube Cast
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 break-words">
                    ส่งตรงไป YouTube app - ง่ายที่สุด
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="badge badge-ghost badge-sm text-xs">เล่นผ่าน YouTube</span>
                    <span className="badge badge-ghost badge-sm text-xs">สะดวกสุด</span>
                    <span className="badge badge-warning badge-sm text-xs">เพิ่มคิว = regenerate QR</span>
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Info */}
        {!isMobile && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-info/10 rounded-lg">
            <p className="text-xs text-gray-600 break-words">
              💡 <strong>คำแนะนำ:</strong> ถ้าใช้ในร้านคาราโอเกะ แนะนำให้ใช้ <strong>Web Monitor Cast</strong>
              เพราะสามารถเพิ่มเพลงได้แบบ real-time โดยไม่ต้อง scan QR ใหม่
            </p>
          </div>
        )}
        {isMobile && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-info/10 rounded-lg">
            <p className="text-xs text-gray-600 break-words">
              💡 <strong>สำหรับบ้าน:</strong> Google Cast เหมาะที่สุดสำหรับ mobile - เชื่อมต่อง่าย ไม่ต้องกรอกรหัส
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
