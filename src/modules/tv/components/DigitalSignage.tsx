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
        <div className="absolute inset-0 bg-[#050505] overflow-hidden flex flex-col font-sans select-none text-white">
            
            {/* BACKGROUND: Cinematic Rotation */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
                    style={{ backgroundImage: `url(${bgUrl})`, opacity: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            </div>

            {/* MAIN CONTENT AREA: Wrapped in SAFE ZONE (5vw Padding) */}
            <div className="relative z-10 flex-1 grid grid-cols-12 h-full p-[5vw]">
                
                {/* LEFT SIDE (40%): QR & Identity */}
                <div className="col-span-5 flex flex-col justify-center items-start">
                    <div className="space-y-[4vh]">
                        {/* App Logo */}
                        <div className="flex items-center gap-[1vw]">
                            <div className="w-[3.5vw] h-[3.5vw] bg-primary rounded-2xl flex items-center justify-center shadow-2xl">
                                <MusicalNoteIcon className="w-[2vw] h-[2vw] text-white" />
                            </div>
                            <h2 className="text-[2.2vw] font-black tracking-tighter">YouOKE <span className="text-primary">TV</span></h2>
                        </div>

                        {/* Large QR Card (Glass style) */}
                        <div className="relative group">
                            <div className="absolute -inset-[0.5vw] bg-white/5 rounded-[3rem] blur-xl opacity-50" />
                            <div className="relative p-[1.5vw] bg-white rounded-[2.5rem] shadow-2xl">
                                <div className="w-[16vw] h-[16vw]">
                                    <QRCodeSVG value={qrUrl} size={1024} level="M" className="w-full h-full rounded-2xl" />
                                </div>
                                <div className="absolute -bottom-[2vh] left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-white px-[1.5vw] py-[0.8vh] rounded-full text-[0.9vw] font-bold border border-white/10 flex items-center gap-[0.5vw] whitespace-nowrap">
                                    <SignalIcon className="w-[1.2vw] h-[1.2vw] text-green-500" />
                                    สแกนเพื่อเริ่มร้องเพลง
                                </div>
                            </div>
                        </div>

                        {/* Basic Instructions */}
                        <div className="space-y-[1.5vh] pt-[2vh]">
                            <div className="flex items-center gap-[1vw] text-white/50">
                                <span className="w-8 h-px bg-white/20"></span>
                                <span className="text-[1vw] font-black uppercase tracking-widest text-primary">วิธีเชื่อมต่อ</span>
                            </div>
                            <p className="text-[1.2vw] font-bold text-white/70">1. เปิดกล้องมือถือแล้วสแกน QR Code</p>
                            <p className="text-[1.2vw] font-bold text-white/70">2. เลือกเพลงและจัดคิวได้ทันที</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE (60%): HUGE Room Code (Monitor Style) */}
                <div className="col-span-7 flex flex-col justify-center items-end">
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-[5vw] flex flex-col items-center gap-[4vh] shadow-2xl">
                        <span className="text-[1vw] font-black uppercase tracking-[0.5em] text-white/20">ยืนยันรหัสเข้าห้อง</span>
                        
                        {/* HUGE MONITOR STYLE ROOM CODE */}
                        <div className="text-[12vw] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                            {roomCode}
                        </div>

                        <div className="flex flex-col items-center gap-[1vh]">
                            <div className="flex items-center gap-[0.5vw] px-[1.5vw] py-[0.8vh] bg-stone-900 border border-white/5 rounded-full text-[1vw] font-bold text-primary">
                                <WifiIcon className="w-[1.2vw] h-[1.2vw]" />
                                play.okeforyou.com
                            </div>
                            <p className="text-[0.9vw] text-white/30 font-medium tracking-normal">เชื่อมระบบ Cloud Sync อัตโนมัติ</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM TICKER: Info */}
            <div className="relative z-20 h-[6vh] bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center overflow-hidden">
                <div className="px-[5vw] w-full flex items-center justify-between text-[0.9vw] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-[1vw] text-primary">
                        <PlayCircleIcon className="w-[1.2vw] h-[1.2vw]" />
                        Ready to Sing
                    </div>
                    <div className="text-white/20 flex items-center gap-[0.5vw]">
                        <UserIcon className="w-[1vw] h-[1vw]" />
                        v{process.env.NEXT_PUBLIC_APP_VERSION || '5.5.31'}
                    </div>
                </div>
            </div>
        </div>
    );
};


