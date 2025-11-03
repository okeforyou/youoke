/**
 * YouTube Cast Button Component
 *
 * Shows QR code for YouTube playlist URL
 * User scans QR to open YouTube app on TV
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useYouTubeCast } from '../context/YouTubeCastContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const YouTubeCastButton: React.FC = () => {
  const {
    isYouTubeCastActive,
    playlist,
    generateYouTubeURL,
    startYouTubeCast,
    stopYouTubeCast,
  } = useYouTubeCast();

  const [showQR, setShowQR] = useState(false);

  const handleCastClick = () => {
    if (playlist.length === 0) {
      alert('กรุณาเพิ่มเพลงลงคิวก่อน');
      return;
    }

    startYouTubeCast();
    setShowQR(true);
  };

  const handleClose = () => {
    setShowQR(false);
    stopYouTubeCast();
  };

  const youtubeURL = generateYouTubeURL();

  return (
    <>
      {/* Cast Button */}
      <button
        onClick={handleCastClick}
        className={`btn btn-sm gap-2 ${
          isYouTubeCastActive ? 'btn-success' : 'btn-primary'
        }`}
        disabled={playlist.length === 0}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
        </svg>
        {isYouTubeCastActive ? 'YouTube Cast (Active)' : 'Cast to YouTube'}
      </button>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📺</div>
              <h2 className="text-2xl font-bold mb-2">Cast to YouTube</h2>
              <p className="text-sm text-gray-600">
                Scan QR code บน Smart TV เพื่อเปิด YouTube
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6 bg-white p-6 rounded-lg">
              <QRCodeSVG
                value={youtubeURL}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Instructions */}
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-2">วิธีใช้งาน:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>เปิด Camera หรือ YouTube app บน Smart TV</li>
                <li>Scan QR Code นี้</li>
                <li>เพลงจะเล่นบน YouTube app อัตโนมัติ</li>
              </ol>
            </div>

            {/* Playlist Info */}
            <div className="text-center text-sm text-gray-600">
              <p>คิวเพลง: {playlist.length} เพลง</p>
              <p className="text-xs mt-1 text-warning">
                ⚠️ การเพิ่ม/ลบเพลงต้อง scan QR ใหม่
              </p>
            </div>

            {/* URL (for copy) */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">หรือคัดลอก URL:</p>
              <input
                type="text"
                value={youtubeURL}
                readOnly
                className="input input-sm w-full font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
