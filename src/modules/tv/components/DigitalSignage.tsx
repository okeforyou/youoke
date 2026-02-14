import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, SignalIcon, WifiIcon } from '@heroicons/react/24/solid';

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setQrUrl(`${window.location.origin}/remote?room=${roomCode}`);
        }
    }, [roomCode]);

    // Slideshow Timer
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % images.length);
        }, 10000); // Change every 10s for slower, more majestic pace
        return () => clearInterval(timer);
    }, [images]);

    const activeImage = images.length > 0
        ? images[currentImageIndex]
        : 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop';

    return (
        <div className="absolute inset-0 bg-black overflow-hidden flex flex-col font-sans select-none">
            {/* 1. Background Slideshow (CSS Transition) */}
            <div className="absolute inset-0 z-0">
                {images.length > 0 ? (
                    images.map((img, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out ${index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                }`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))
                ) : (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${activeImage})` }}
                    />
                )}
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            </div>

            {/* 2. Top Header (Brand) */}
            <div className="relative z-10 px-12 py-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                        <MusicalNoteIcon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white">YouOke <span className="text-primary">TV</span></span>
                </div>
                <div className="flex items-center gap-6 text-white/40 text-sm font-medium uppercase tracking-widest">
                    <span className="flex items-center gap-2"><WifiIcon className="w-4 h-4" /> Ready to Connect</span>
                </div>
            </div>

            {/* 3. Main Content (Hero Section) */}
            <div className={`relative z-10 flex-1 flex flex-col justify-center px-24 gap-12 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

                <div className="grid grid-cols-12 gap-12 items-center">
                    {/* Left: Huge Call to Action & Room Code */}
                    <div className="col-span-7 space-y-8">
                        <div>
                            <p className="text-primary font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-primary"></span>
                                Sing Together
                            </p>
                            <h1 className="text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-2xl">
                                Join the Party<br />
                                <span className="text-white/30">From Your Phone</span>
                            </h1>
                            <p className="text-xl text-white/60 font-light max-w-xl leading-relaxed">
                                Scan the QR Code or visit <span className="text-white font-medium">youoke.com/remote</span> to queue songs, control volume, and unleash your inner star.
                            </p>
                        </div>

                        {/* Room Code Box */}
                        <div className="inline-flex items-center gap-8 bg-white/5 backdrop-blur-md border border-white/10 pr-12 rounded-3xl overflow-hidden mt-8">
                            <div className="px-8 py-6 bg-primary text-white font-black text-xl uppercase tracking-widest flex flex-col items-center justify-center leading-tight">
                                <span>Room</span>
                                <span>Code</span>
                            </div>
                            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tighter">
                                {roomCode}
                            </div>
                        </div>
                    </div>

                    {/* Right: QR Code Visual */}
                    <div className="col-span-5 flex justify-center">
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute -inset-4 bg-primary/30 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000 animate-pulse"></div>

                            <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700 ease-out transform hover:scale-105">
                                <QRCodeSVG value={qrUrl} size={380} level="H" className="rounded-2xl" />
                                <div className="absolute -bottom-6 -right-6 bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl border border-white/10 flex items-center gap-2">
                                    <SignalIcon className="w-5 h-5 text-green-400 animate-pulse" />
                                    Scan Me
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* 4. Footer Marquee (Refined) */}
            <div className="relative z-20 h-20 bg-gradient-to-t from-black to-transparent flex items-end pb-6">
                <div className="w-full flex items-center overflow-hidden">
                    <div className="flex whitespace-nowrap animate-marquee">
                        {[...messages, ...messages, ...messages].map((msg, i) => (
                            <div key={i} className="mx-12 text-2xl font-medium text-white/80 flex items-center gap-4 drop-shadow-md">
                                <MusicalNoteIcon className="w-5 h-5 text-primary opacity-80" />
                                {msg || "Welcome to YouOke Karaoke! 🍔 Special Offer: Buy 1 Get 1 Free on all cocktails until midnight! 🍹"}
                            </div>
                        ))}
                        {/* Default Fallback Marquee */}
                        {messages.length === 0 && (
                            <>
                                <div className="mx-12 text-2xl font-medium text-white/80 flex items-center gap-4">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    Scan QR code to start requesting songs 🎵
                                </div>
                                <div className="mx-12 text-2xl font-medium text-white/80 flex items-center gap-4">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    Order food & drinks directly from your phone 🍟🍺
                                </div>
                                <div className="mx-12 text-2xl font-medium text-white/80 flex items-center gap-4">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Promotion: Happy Hour 50% Off 17:00 - 20:00! 🎉
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS for Marquee */}
            <style jsx>{`
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};
