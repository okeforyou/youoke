import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, SignalIcon, WifiIcon, PlayCircleIcon, DevicePhoneMobileIcon, KeyIcon } from '@heroicons/react/24/solid';

interface DigitalSignageProps {
    roomCode: string;
    images?: string[]; 
    messages?: string[]; 
    template?: 'classic' | 'ads' | 'split' | 'video' | 'leanback' | string;
    ads?: { type: 'image' | 'video', url: string, title?: string }[];
    isVisible?: boolean; // Performance optimization prop
}

/**
 * YouOKE TV Digital Signage (v5.5.22 - Ultra Performance)
 * Optimization: Unmount animations when isVisible=false for TV Smoothness
 */
export const DigitalSignage: React.FC<DigitalSignageProps> = ({
    roomCode = "8888",
    images = [],
    messages = [],
    template: templateProp,
    ads = [],
    isVisible = true 
}) => {
    const template = (!templateProp || templateProp === "" || templateProp === "default") ? 'leanback' : templateProp;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [qrUrl, setQrUrl] = useState('');
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setQrUrl(`${window.location.origin}/remote?room=${roomCode}`);
        }
    }, [roomCode]);

    // Slideshow Logic - Only run if visible
    useEffect(() => {
        if (!isVisible) return;

        const items = template === 'ads' ? ads : (images && images.length > 0 ? images : []);
        if (!items || items.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 12000);
        return () => clearInterval(timer);
    }, [images, ads, template, isVisible]);

    if (!isVisible) return null; // Complete unmount for maximum CPU/GPU savings during playback

    // Helper: Render Background
    const renderBackground = (opacity = 40) => {
        const defaultImages = [
            'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
        ];
        const items = template === 'ads' ? ads : (images && images.length > 0 ? images : defaultImages);

        return (
            <div className="absolute inset-0 z-0 bg-stone-950">
                {items.map((item: any, index) => {
                    const url = typeof item === 'string' ? item : item?.url;
                    const isActive = index === currentIndex;

                    // Performance: Remove scaling/heavy transitions for background if on low-end TV
                    return (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[3000ms] ${isActive ? `opacity-[0.${opacity}]` : 'opacity-0'}`}
                            style={{ backgroundImage: `url(${url})` }}
                        />
                    );
                })}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950" />
            </div>
        );
    };

    // --- LEANBACK TEMPLATE (Hyper-Optimized) ---
    return (
        <div className="absolute inset-0 bg-stone-950 overflow-hidden flex flex-col font-sans select-none text-white">
            {renderBackground(40)}

            <div className={`relative z-10 flex-1 grid grid-cols-12 h-full transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                
                {/* LEFT SIDE: Connection Card (Removed backdrop-blur for performance) */}
                <div className="col-span-5 flex flex-col justify-center items-center px-[5vw]">
                    <div className="w-full max-w-[32vw] aspect-[4/5] bg-stone-900/90 border border-white/10 rounded-[3rem] p-[3vw] flex flex-col items-center justify-between shadow-2xl">
                        
                        <div className="flex flex-col items-center gap-[1vh]">
                            <div className="w-[4vw] h-[4vw] bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <MusicalNoteIcon className="w-[2.5vw] h-[2.5vw] text-white" />
                            </div>
                            <h2 className="text-[2.2vw] font-black tracking-tighter mt-[1vh]">YouOKE <span className="opacity-40 font-light">TV</span></h2>
                        </div>

                        <div className="relative group p-[1.5vw] bg-white rounded-[2.5rem] shadow-2xl">
                            <div className="w-[16vw] h-[16vw]">
                                <QRCodeSVG value={qrUrl} size={1024} level="H" className="w-full h-full rounded-2xl" />
                            </div>
                            <div className="absolute -bottom-[1.5vh] left-1/2 -translate-x-1/2 bg-stone-900 text-white px-[1.5vw] py-[0.8vh] rounded-full text-[0.9vw] font-bold border border-white/10 flex items-center gap-[0.5vw] shadow-xl whitespace-nowrap">
                                <SignalIcon className="w-[1vw] h-[1vw] text-green-400 animate-pulse" />
                                Scan to Connect
                            </div>
                        </div>

                        <div className="w-full space-y-[1vh] text-center">
                            <p className="text-[1vw] text-white/40 font-bold uppercase tracking-[0.2em]">Enter Room Code</p>
                            <div className="flex items-center justify-center gap-[0.8vw]">
                                {String(roomCode).split('').map((char, i) => (
                                    <div key={i} className="w-[4vw] h-[5.5vw] bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-[3vw] font-black">
                                        {char}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[0.9vw] text-white/30 pt-[0.5vh]">youoke.vercel.app</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Info */}
                <div className="col-span-7 flex flex-col justify-center pr-[5vw]">
                    <div className="space-y-[2.5vh] max-w-[40vw]">
                        <div className="inline-flex items-center gap-[0.5vw] px-[1vw] py-[0.5vh] bg-primary/20 text-primary border border-primary/30 rounded-full text-[0.9vw] font-black uppercase tracking-widest">
                            <PlayCircleIcon className="w-[1vw] h-[1vw]" />
                            Smart Karaoke System
                        </div>
                        <h1 className="text-[4.5vw] font-black leading-[1.1] tracking-tight">
                            Your Mobile is the<br />
                            <span className="text-white/30">Ultimate Remote</span>
                        </h1>
                        <p className="text-[1.4vw] text-white/50 font-medium leading-relaxed">
                            สแกนคิวอาร์โค้ดเพื่อค้นหาเพลง จัดคิว และควบคุมความสนุกได้ทันทีจากมือถือของคุณ
                        </p>
                        
                        <div className="flex flex-col gap-[1.5vh] pt-[2vh]">
                            <div className="flex items-center gap-[1.2vw] text-white/40">
                                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[1vw] font-bold italic">1</div>
                                <span className="text-[1.1vw] font-bold uppercase tracking-widest">เปิดกล้องมือถือแล้วสแกน</span>
                            </div>
                            <div className="flex items-center gap-[1.2vw] text-white/40">
                                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[1vw] font-bold italic">2</div>
                                <span className="text-[1.1vw] font-bold uppercase tracking-widest">เชื่อมต่อห้องรหัส {roomCode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 h-[7vh] bg-stone-950/95 border-t border-white/5 flex items-center">
                <div className="px-[2.5vw] h-full flex items-center font-black text-[0.9vw] text-primary uppercase tracking-[0.2em]">
                    Trending
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <div className="flex whitespace-nowrap animate-marquee">
                        {(messages && messages.length > 0 ? [...messages, ...messages] : ["ยินดีต้อนรับสู่ YouOKE TV"]).map((msg, i) => (
                            <div key={i} className="mx-[4vw] text-[1.1vw] font-bold text-white/40 flex items-center gap-[1vw]">
                                <MusicalNoteIcon className="w-[1vw] h-[1vw] text-white/20" />
                                {msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-marquee { animation: marquee 60s linear infinite; } 
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            `}</style>
        </div>
    );
};
