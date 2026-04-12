import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, SignalIcon, WifiIcon, PlayCircleIcon, DevicePhoneMobileIcon, KeyIcon } from '@heroicons/react/24/solid';

interface DigitalSignageProps {
    roomCode: string;
    images?: string[]; 
    messages?: string[]; 
    template?: 'classic' | 'ads' | 'split' | 'video' | 'leanback' | string;
    ads?: { type: 'image' | 'video', url: string, title?: string }[];
    isVisible?: boolean; 
}

/**
 * YouOKE TV Digital Signage (v5.5.23 - Zero Effect)
 * Strategy: Absolute Minimum CPU Load for Smart TV.
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
            setQrUrl(`${window.location.origin}/remote?room=${encodeURIComponent(String(roomCode || ''))}`);
        }
    }, [roomCode]);

    // Simple Rotation (12s) - No heavy hooks
    useEffect(() => {
        if (!isVisible) return;
        const items = template === 'ads' ? ads : (images && images.length > 0 ? images : []);
        if (!items || items.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 12000);
        return () => clearInterval(timer);
    }, [images, ads, template, isVisible]);

    if (!isVisible) return null;

    // Helper: Static Background
    const renderBackground = () => {
        const defaultImages = [
            'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop'
        ];
        const items = template === 'ads' ? ads : (images && images.length > 0 ? images : defaultImages);
        const item = items[currentIndex];
        const url = typeof item === 'string' ? item : item?.url;

        return (
            <div className="absolute inset-0 z-0 bg-stone-950">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url(${url})` }}
                />
                <div className="absolute inset-0 bg-stone-950/20" />
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-stone-950 overflow-hidden flex flex-col font-sans select-none text-white">
            {renderBackground()}

            <div className="relative z-10 flex-1 grid grid-cols-12 h-full">
                {/* LEFT SIDE: Identity & QR */}
                <div className="col-span-5 flex flex-col justify-center items-center px-[5vw]">
                    <div className="w-full max-w-[32vw] aspect-[4/5] bg-stone-900 border border-white/10 rounded-[3rem] p-[3vw] flex flex-col items-center justify-between">
                        
                        <div className="flex flex-col items-center gap-[1vh]">
                            <div className="w-[4vw] h-[4vw] bg-primary rounded-2xl flex items-center justify-center">
                                <MusicalNoteIcon className="w-[2.5vw] h-[2.5vw] text-white" />
                            </div>
                            <h2 className="text-[2.2vw] font-black tracking-tighter mt-[1vh]">YouOKE <span className="opacity-40 font-light">TV</span></h2>
                        </div>

                        <div className="p-[1.5vw] bg-white rounded-[2.5rem]">
                            <div className="w-[16vw] h-[16vw]">
                                <QRCodeSVG value={qrUrl} size={1024} level="M" className="w-full h-full rounded-2xl" />
                            </div>
                            <div className="absolute -bottom-[1.5vh] left-1/2 -translate-x-1/2 bg-stone-950 text-white px-[1.5vw] py-[0.8vh] rounded-full text-[0.9vw] font-bold border border-white/10 flex items-center gap-[0.5vw]">
                                <SignalIcon className="w-[1vw] h-[1vw] text-green-500" />
                                Scan to Connect
                            </div>
                        </div>

                        <div className="w-full space-y-[1vh] text-center">
                            <p className="text-[1vw] text-white/40 font-bold uppercase tracking-[0.2em]">Enter Room Code</p>
                            <div className="flex items-center justify-center gap-[0.8vw]">
                                {(Array.from(String(roomCode || ''))).map((char, i) => (
                                    <div key={i} className="w-[4vw] h-[5.5vw] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-[3vw] font-black">
                                        {char}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[0.9vw] text-white/30 pt-[0.5vh]">{typeof window !== 'undefined' ? window.location.hostname : 'play.okeforyou.com'}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Info */}
                <div className="col-span-7 flex flex-col justify-center pr-[5vw]">
                    <div className="space-y-[2.5vh] max-w-[42vw]">
                        <div className="inline-flex items-center gap-[0.5vw] px-[1vw] py-[0.5vh] bg-stone-900 text-primary border border-white/10 rounded-full text-[0.9vw] font-black uppercase tracking-widest">
                            <PlayCircleIcon className="w-[1vw] h-[1vw]" />
                            Zero-Latency TV System
                        </div>
                        <h1 className="text-[4.5vw] font-black leading-[1.1] tracking-tight">
                            Smart Karaoke<br />
                            <span className="text-white/30">Remote Control</span>
                        </h1>
                        <p className="text-[1.4vw] text-white/50 font-medium leading-relaxed">
                            สแกนโค้ดเพื่อเริ่มความสนุก ควบคุมทุกอย่างจากมือถือ
                        </p>
                        
                        <div className="flex flex-col gap-[1.5vh] pt-[2vh]">
                            <div className="flex items-center gap-[1.2vw] text-white/40">
                                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[1vw] font-bold">1</div>
                                <span className="text-[1.1vw] font-bold uppercase tracking-widest">เปิดกล้องมือถือแล้วสแกน</span>
                            </div>
                            <div className="flex items-center gap-[1.2vw] text-white/40">
                                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[1vw] font-bold">2</div>
                                <span className="text-[1.1vw] font-bold uppercase tracking-widest">พิมพ์รหัส {roomCode} บนมือถือ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 h-[7vh] bg-stone-950 border-t border-white/5 flex items-center">
                <div className="px-[2.5vw] h-full flex items-center font-black text-[0.9vw] text-primary uppercase tracking-[0.2em]">
                    INFO
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex px-[4vw] text-[1.1vw] font-bold text-white/40 gap-[1vw]">
                         <MusicalNoteIcon className="w-[1vw] h-[1vw] text-white/20" />
                         Ready to Sing - Connect your mobile to start queueing songs.
                    </div>
                </div>
            </div>
        </div>
    );
};
