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

    const items = template === 'ads' ? ads : (images && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop'
    ]);
    const item = items[currentIndex];
    const bgUrl = typeof item === 'string' ? item : item?.url;

    return (
        <div className="absolute inset-0 bg-stone-950 overflow-hidden flex items-center justify-center font-sans select-none text-white">
            {/* BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
                    style={{ backgroundImage: `url(${bgUrl})`, opacity: 0.25 }}
                />
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-stone-950/80" />
            </div>

            {/* CONTENT LAYER: Cinematic Floating Card */}
            <div className="relative z-10 flex flex-col items-center">
                
                {/* Floating Glass Card */}
                <div className="bg-stone-900/40 backdrop-blur-xl border border-white/10 rounded-[4rem] p-[4vw] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center animate-in zoom-in-95 duration-1000">
                    
                    {/* Header: Identity */}
                    <div className="flex items-center gap-[1.2vw] mb-[4vh] opacity-80">
                        <div className="w-[3.5vw] h-[3.5vw] bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,50,0,0.3)]">
                            <MusicalNoteIcon className="w-[2vw] h-[2vw] text-white" />
                        </div>
                        <h2 className="text-[2.5vw] font-black tracking-tighter">YouOKE <span className="text-primary font-light">TV</span></h2>
                    </div>

                    {/* QR Core Container */}
                    <div className="relative group">
                        <div className="absolute -inset-[1vw] bg-primary/20 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative p-[1.8vw] bg-white rounded-[3rem] shadow-2xl">
                            <div className="w-[18vw] h-[18vw]">
                                <QRCodeSVG value={qrUrl} size={1024} level="M" className="w-full h-full rounded-2xl" />
                            </div>
                            
                            {/* Floating scan tag */}
                            <div className="absolute -bottom-[2vh] left-1/2 -translate-x-1/2 bg-primary text-white px-[1.8vw] py-[0.8vh] rounded-full text-[1vw] font-black shadow-xl flex items-center gap-[0.5vw] whitespace-nowrap border-2 border-stone-950">
                                <SignalIcon className="w-[1.2vw] h-[1.2vw]" />
                                สแกนเพื่อเริ่มร้องเพลง
                            </div>
                        </div>
                    </div>

                    {/* Room Code Section */}
                    <div className="mt-[7vh] flex flex-col items-center gap-[1.5vh]">
                        <p className="text-[1.1vw] text-white/40 font-black uppercase tracking-[0.4em]">รหัสเข้าห้อง</p>
                        <div className="flex gap-[0.8vw]">
                            {(Array.from(String(roomCode || ''))).map((char, i) => (
                                <div key={i} className="w-[4.5vw] h-[6vw] bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-[3.5vw] font-black shadow-inner">
                                    {char}
                                </div>
                            ))}
                        </div>
                        <p className="text-[1vw] text-white/20 font-medium tracking-widest mt-2">{typeof window !== 'undefined' ? window.location.hostname : 'play.okeforyou.com'}</p>
                    </div>
                </div>

                {/* Bottom Instructions (Floating) */}
                <div className="mt-[5vh] flex flex-col items-center gap-[2.5vh]">
                    <div className="flex items-center gap-[3vw]">
                        <div className="flex items-center gap-[1vw] text-white/50">
                            <div className="w-[2vw] h-[2vw] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[0.9vw] font-black">1</div>
                            <span className="text-[1.2vw] font-bold tracking-tight">เปิดกล้องมือถือแล้วสแกน</span>
                        </div>
                        <div className="w-[1px] h-[3vh] bg-white/10" />
                        <div className="flex items-center gap-[1vw] text-white/50">
                            <div className="w-[2vw] h-[2vw] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[0.9vw] font-black">2</div>
                            <span className="text-[1.2vw] font-bold tracking-tight">พิมพ์รหัส ({roomCode}) บนมือถือ</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-[1vw] px-[2vw] py-[1vh] bg-stone-900 border border-white/5 rounded-full">
                        <PlayCircleIcon className="w-[1.5vw] h-[1.5vw] text-primary" />
                        <p className="text-[1.2vw] font-bold text-white/60">
                            พร้อมเริ่มปาร์ตี้ - เชื่อมต่อมือถือเพื่อเริ่มเลือกเพลงได้ทันที
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Footer - Extra Minimal */}
            <div className="absolute bottom-0 inset-x-0 h-[5vh] bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center">
                <div className="flex items-center gap-[0.5vw] text-white/10 text-[0.8vw] font-black uppercase tracking-[0.5em]">
                    <WifiIcon className="w-[1vw] h-[1vw]" />
                    Cloud Sync Active • v{process.env.NEXT_PUBLIC_APP_VERSION || '5.5.30'}
                </div>
            </div>
        </div>
    );
};

