import React from 'react';
import Link from 'next/link';
import { useUIStore } from '../../stores/useUIStore';

interface PremiumLockOverlayProps {
    title?: string;
    description?: string;
    onBack?: () => void;
}

export const PremiumLockOverlay: React.FC<PremiumLockOverlayProps> = ({
    title = "YouTube Theme Pro",
    description = "ฟีเจอร์นี้สำหรับสมาชิกระดับ Premium หรือผู้ที่ซื้อ Module นี้เท่านั้น กรุณาติดต่อ Admin หรือไปที่ร้านค้าเพื่อปลดล็อค",
    onBack
}) => {
    const handleDefaultBack = () => {
        useUIStore.getState().setMusicTheme('spotify');
    };

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 px-4 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/20 mb-4 transform hover:scale-105 transition-transform duration-300">
                <span className="text-4xl">💎</span>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">{title}</h2>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {description}
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onBack || handleDefaultBack}
                    className="btn btn-outline border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium px-6"
                >
                    กลับไปใช้ Spotify Theme
                </button>
                <Link href="/store" className="btn btn-primary bg-gradient-to-r from-red-600 to-red-500 border-none hover:shadow-lg hover:shadow-red-500/30 font-bold px-8 text-white">
                    ไปยังร้านค้า (ซื้อเลย)
                </Link>
            </div>
        </div>
    );
};
