import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, SignalIcon, WifiIcon, PlayCircleIcon } from '@heroicons/react/24/solid';

interface DigitalSignageProps {
    roomCode: string;
    images?: string[]; // Array of background image URLs
    messages?: string[]; // Marquee messages
    template?: 'classic' | 'ads' | 'split' | 'video';
    ads?: { type: 'image' | 'video', url: string, title?: string }[];
}

export const DigitalSignage: React.FC<DigitalSignageProps> = ({
    roomCode,
    images = [],
    messages = [],
    template = 'classic',
    ads = []
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [qrUrl, setQrUrl] = useState('');
    const [mounted, setMounted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setQrUrl(`${window.location.origin}/remote?room=${roomCode}`);
        }
    }, [roomCode]);

    // Rotation Logic (Slideshow for images/ads)
    useEffect(() => {
        const items = template === 'ads' ? ads : images;
        if (items.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 10000); // 10s rotation
        return () => clearInterval(timer);
    }, [images, ads, template]);

    const activeItem = template === 'ads'
        ? ads[currentIndex]
        : images[currentIndex] || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop';

    // Helper: Render Background Content
    const renderBackground = (full = true) => {
        const items = template === 'ads' ? ads : images;

        if (items.length === 0 && template === 'classic') {
            return <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${activeItem})` }} />;
        }

        return (
            <div className="absolute inset-0 z-0">
                {items.map((item: any, index) => {
                    const url = typeof item === 'string' ? item : item.url;
                    const type = typeof item === 'string' ? 'image' : item.type;
                    const isActive = index === currentIndex;

                    if (type === 'video') {
                        return (
                            <video
                                key={index}
                                src={url}
                                autoPlay
                                muted
                                loop
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            />
                        );
                    }

                    return (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                            style={{ backgroundImage: `url(${url})` }}
                        />
                    );
                })}
                {full && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                    </>
                )}
            </div>
        );
    };

    // 1. Classic Template (Join Focus)
    if (template === 'classic' || template === 'split') {
        return (
            <div className="absolute inset-0 bg-black overflow-hidden flex flex-col font-sans select-none">
                {renderBackground()}

                {/* Header */}
                <div className="relative z-10 px-12 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                            <MusicalNoteIcon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">YouOke <span className="text-primary">TV</span></span>
                    </div>
                    <div className="flex items-center gap-6 text-white/40 text-sm font-medium uppercase tracking-widest">
                        <span className="flex items-center gap-2"><WifiIcon className="w-4 h-4" /> พร้อมเชื่อมต่อ</span>
                    </div>
                </div>

                {/* Content */}
                <div className={`relative z-10 flex-1 flex flex-col justify-center px-24 gap-12 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="grid grid-cols-12 gap-12 items-center">
                        <div className={template === 'split' ? "col-span-6 space-y-8" : "col-span-7 space-y-8"}>
                            <p className="text-primary font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-primary"></span>
                                ร้องเพลงไปด้วยกัน
                            </p>
                            <h1 className="text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-2xl">
                                เข้าร่วมปาร์ตี้<br />
                                <span className="text-white/30">ผ่านมือถือของคุณ</span>
                            </h1>
                            <p className="text-xl text-white/60 font-light max-w-xl leading-relaxed">
                                สแกน QR Code เพื่อเลือกเพลง คลุมระดับเสียง และแสดงความสามารถของคุณ
                            </p>

                            <div className="inline-flex items-center gap-8 bg-white/5 backdrop-blur-md border border-white/10 pr-12 rounded-3xl overflow-hidden mt-8">
                                <div className="px-8 py-6 bg-primary text-white font-black text-xl uppercase tracking-widest flex flex-col items-center justify-center leading-tight">
                                    <span>รหัส</span>
                                    <span>ห้อง</span>
                                </div>
                                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tighter">
                                    {roomCode}
                                </div>
                            </div>
                        </div>

                        <div className={template === 'split' ? "col-span-6 flex justify-center" : "col-span-5 flex justify-center"}>
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-primary/30 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000 animate-pulse"></div>
                                <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700 ease-out transform hover:scale-105">
                                    <QRCodeSVG value={qrUrl} size={template === 'split' ? 320 : 380} level="H" className="rounded-2xl" />
                                    <div className="absolute -bottom-6 -right-6 bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl border border-white/10 flex items-center gap-2">
                                        <SignalIcon className="w-5 h-5 text-green-400 animate-pulse" />
                                        สแกนเลย
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Marquee */}
                <div className="relative z-20 h-20 bg-gradient-to-t from-black to-transparent flex items-end pb-6">
                    <div className="w-full flex items-center overflow-hidden">
                        <div className="flex whitespace-nowrap animate-marquee">
                            {[...messages, ...messages].map((msg, i) => (
                                <div key={i} className="mx-12 text-2xl font-medium text-white/80 flex items-center gap-4 drop-shadow-md">
                                    <MusicalNoteIcon className="w-5 h-5 text-primary opacity-80" />
                                    {msg}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <style jsx>{`.animate-marquee { animation: marquee 30s linear infinite; } @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
            </div>
        );
    }

    // 2. Ads Template (Creative Focus)
    if (template === 'ads' || template === 'video') {
        return (
            <div className="absolute inset-0 bg-black overflow-hidden flex flex-col font-sans select-none">
                {renderBackground(template !== 'video')}

                {/* Visual Overlay for Info */}
                <div className="absolute bottom-12 left-12 z-20 flex items-center gap-6 bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl scale-in-center">
                    <div className="bg-white p-3 rounded-2xl shadow-lg">
                        <QRCodeSVG value={qrUrl} size={120} level="M" />
                    </div>
                    <div>
                        <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">เข้าร่วมร้องเพลง</p>
                        <div className="flex items-center gap-4">
                            <span className="text-5xl font-black text-white tracking-tighter">{roomCode}</span>
                            <div className="w-px h-10 bg-white/20" />
                            <div className="flex flex-col">
                                <span className="text-primary font-bold text-sm">youoke.okeforyou.com</span>
                                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Connect Remote</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Template Specific HUD */}
                <div className="absolute top-12 right-12 z-20">
                    <div className="flex items-center gap-3 bg-primary/90 text-white px-6 py-3 rounded-2xl font-black shadow-2xl animate-pulse">
                        <PlayCircleIcon className="w-6 h-6" />
                        SPECIAL OFFER
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
