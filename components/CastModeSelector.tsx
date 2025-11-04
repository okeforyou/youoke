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
  onSelectWebMonitor: () => void;
  onSelectDual: () => void;
  onSelectYouTube: () => void;
}

export const CastModeSelector: React.FC<CastModeSelectorProps> = ({
  isOpen,
  onClose,
  onSelectWebMonitor,
  onSelectDual,
  onSelectYouTube,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📺</div>
          <h2 className="text-2xl font-bold mb-2">เลือกวิธี Cast</h2>
          <p className="text-sm text-gray-600">
            เลือกวิธีที่ต้องการส่งเพลงไปทีวี
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Option 1: Web Monitor Cast */}
          <button
            onClick={onSelectWebMonitor}
            className="w-full text-left bg-primary/10 hover:bg-primary/20 rounded-lg p-5 border-2 border-primary/30 hover:border-primary transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎮</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary mb-2 group-hover:underline">
                  Web Monitor Cast
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  ควบคุมเต็มรูปแบบ - เพิ่ม/ลบเพลงได้แบบ real-time
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-success badge-sm">เพิ่มคิวได้ทันที</span>
                  <span className="badge badge-success badge-sm">ควบคุมได้หมด</span>
                  <span className="badge badge-info badge-sm">แนะนำสำหรับร้าน</span>
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Dual Screen (2 หน้าจอ) */}
          <button
            onClick={onSelectDual}
            className="w-full text-left bg-secondary/10 hover:bg-secondary/20 rounded-lg p-5 border-2 border-secondary/30 hover:border-secondary transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🖥️</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-secondary mb-2 group-hover:underline">
                  2 หน้าจอ (Dual Screen)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  เปิดหน้าจอที่ 2 ทันที - ไม่ต้องกรอกรหัส
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-success badge-sm">ง่ายที่สุด</span>
                  <span className="badge badge-success badge-sm">ไม่ต้องกรอกรหัส</span>
                  <span className="badge badge-info badge-sm">แนะนำสำหรับ DJ</span>
                </div>
              </div>
            </div>
          </button>

          {/* Option 3: YouTube Cast */}
          <button
            onClick={onSelectYouTube}
            className="w-full text-left bg-base-200/50 hover:bg-base-200 rounded-lg p-5 border-2 border-base-300 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">📱</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-700 mb-2 group-hover:underline group-hover:text-primary">
                  YouTube Cast
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  ส่งตรงไป YouTube app - ง่ายที่สุด
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-ghost badge-sm">เล่นผ่าน YouTube</span>
                  <span className="badge badge-ghost badge-sm">สะดวกสุด</span>
                  <span className="badge badge-warning badge-sm">เพิ่มคิว = regenerate QR</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-info/10 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>คำแนะนำ:</strong> ถ้าใช้ในร้านคาราโอเกะ แนะนำให้ใช้ <strong>Web Monitor Cast</strong>
            เพราะสามารถเพิ่มเพลงได้แบบ real-time โดยไม่ต้อง scan QR ใหม่
          </p>
        </div>
      </div>
    </div>
  );
};
