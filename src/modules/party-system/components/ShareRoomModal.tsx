/**
 * Share Room Modal
 *
 * Modal for sharing room link with friends
 * - QR Code for easy scanning
 * - Shareable link
 * - Copy to clipboard
 * - Native share (mobile)
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  XMarkIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  shareUrl: string;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    // Check if native share is available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'เชิญเข้าห้องคาราโอเกะ',
          text: `มาร้องเพลงด้วยกัน! ห้อง: ${roomCode}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl max-w-sm w-full p-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-1">แชร์ห้องคาราโอเกะ</h2>
          <p className="text-sm text-gray-600">เชิญเพื่อนมาร้องด้วยกัน</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <QRCodeSVG
              value={shareUrl}
              size={160}
              level="M"
            />
          </div>
        </div>

        {/* Room Code */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-600 mb-1">เลขห้อง</p>
          <p className="text-3xl font-bold text-primary tracking-widest">
            {roomCode}
          </p>
        </div>

        {/* Shareable Link */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            <LinkIcon className="w-4 h-4 inline mr-1" />
            ลิงก์แชร์
          </label>
          <div className="bg-base-200 rounded-lg px-3 py-2 border border-base-300">
            <p className="text-xs font-mono text-gray-700 truncate">
              {shareUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 bg-base-200 hover:bg-base-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckIcon className="w-5 h-5 text-success" />
                <span className="text-success">คัดลอกแล้ว!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-5 h-5" />
                <span>คัดลอกลิงก์</span>
              </>
            )}
          </button>

          {/* Native Share Button */}
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="w-5 h-5" />
            <span>แชร์</span>
          </button>
        </div>
      </div>
    </div>
  );
};
