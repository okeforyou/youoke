import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DigitalSignageProps {
    roomCode: string;
    images?: string[]; // Array of background image URLs
    messages?: string[]; // Marquee messages
}

export const DigitalSignage: React.FC<DigitalSignageProps> = ({
    roomCode,
    images = [],
    messages = []
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setQrUrl(`${window.location.origin}/remote?room=${roomCode}`);
        }
    }, [roomCode]);

    // Slideshow Timer
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % images.length);
        }, 8000); // Change every 8s
        return () => clearInterval(timer);
    }, [images]);

    const activeImage = images.length > 0
        ? images[currentImageIndex]
        : 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop'; // Default Karaoke BG

    return (
        <div className="absolute inset-0 bg-black overflow-hidden flex flex-col">
            {/* 1. Background Slideshow (CSS Transition) */}
            <div className="absolute inset-0 z-0 transition-opacity duration-1000">
                {/* We render all images but control opacity. Better for preloading. */}
                {images.length > 0 ? (
                    images.map((img, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                }`}
                            style={{
                                backgroundImage: `url(${img})`,
                                transition: 'opacity 1.5s ease-in-out, transform 10s ease-out'
                            }}
                        />
                    ))
                ) : (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${activeImage})` }}
                    />
                )}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            </div>

            {/* 2. Main Content (QR & Room Code) */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-12 gap-16">
                {/* Left: Call to Action */}
                <div className="flex flex-col items-center space-y-8 animate-in slide-in-from-left duration-1000">
                    <div className="bg-white p-4 rounded-[40px] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                        <QRCodeSVG value={qrUrl} size={320} level="H" className="rounded-2xl" />
                    </div>
                    <div className="text-center">
                        <p className="text-2xl text-white/80 font-medium mb-2 uppercase tracking-widest">Scan to Join</p>
                        <div className="text-7xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                            {roomCode}
                        </div>
                    </div>
                </div>

                {/* Right: Messages / Instructions */}
                <div className="max-w-xl space-y-6 text-white text-left animate-in slide-in-from-right duration-1000 delay-300">
                    <h1 className="text-6xl font-bold leading-tight">
                        ร้องเพลงง่ายๆ<br />
                        <span className="text-primary">ผ่านมือถือคุณ</span>
                    </h1>
                    <ul className="space-y-4 text-2xl text-white/70 font-light">
                        <li className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">1</span>
                            สแกน QR Code หรือเข้าเว็บ
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">2</span>
                            ใส่รหัสห้อง <span className="text-white font-bold">{roomCode}</span>
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">3</span>
                            ค้นหาเพลงและเพิ่มคิวได้เลย!
                        </li>
                    </ul>
                </div>
            </div>

            {/* 3. Marquee (Ticker) */}
            <div className="relative z-20 h-16 bg-gradient-to-r from-primary/90 to-purple-900/90 backdrop-blur-md flex items-center overflow-hidden border-t border-white/10">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[...messages, ...messages].map((msg, i) => (
                        <div key={i} className="mx-8 text-xl font-medium text-white flex items-center gap-4">
                            <span className="w-2 h-2 rounded-full bg-white/50" />
                            {msg || "ยินดีต้อนรับสู่ YouOke Karaoke! โปรโมชั่น: สั่งเครื่องดื่ม 1 เหยือก แถมฟรีเฟรนช์ฟรายส์ 🍟 ยิ่งดึกยิ่งมันส์!"}
                        </div>
                    ))}
                    {/* Default Fallback Marquee */}
                    {messages.length === 0 && (
                        <>
                            <div className="mx-8 text-xl font-medium text-white flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                Welcome to YouOke! Scan QR to start singing 🎤
                            </div>
                            <div className="mx-8 text-xl font-medium text-white flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                สั่งอาหารและเครื่องดื่มผ่านมือถือได้แล้ววันนี้ 🍔🍺
                            </div>
                            <div className="mx-8 text-xl font-medium text-white flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                โปรโมชั่นเดือนนี้: มา 4 จ่าย 3 ทุกวันพุธ! 🎉
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* CSS for Marquee */}
            <style jsx>{`
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
};
