import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { XMarkIcon, DevicePhoneMobileIcon, CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string | null;
};

export default function QRModal({ isOpen, onClose, sessionId }: Props) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !sessionId) return null;

    // Since we don't know the exact domain in dev/prod easily without env, 
    // we can use window.location.origin on client side, or just relative path logic if scanning assumes same domain.
    // But QR code needs full URL.
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/remote?session=${sessionId}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Connect Remote</h2>
                <p className="text-gray-400 mb-6 text-sm">Scan with your phone to control playback</p>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-lg">
                    <QRCodeSVG
                        value={url}
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                {/* PIN Display */}
                <div className="bg-black/50 rounded-xl p-4 mb-4 border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Session PIN</p>
                    <p className="text-3xl font-mono font-bold text-white tracking-widest">{sessionId}</p>
                </div>

                {/* Copy Link */}
                <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors border border-white/5"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                    {copied ? 'Copied Link!' : 'Copy Link manually'}
                </button>

            </div>
        </div>
    );
}
