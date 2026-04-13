import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, SignalIcon, WifiIcon, PlayCircleIcon, UserIcon } from '@heroicons/react/24/solid';

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
        <div className="absolute inset-0 bg-[#050505] overflow-hidden flex flex-col items-center justify-center font-sans select-none text-white p-[5vw]">
            
            {/* BACKGROUND LAYER (Blurred) */}
            <div className="absolute inset-0 z-0 scale-105">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] blur-xl"
                    style={{ backgroundImage: `url(${bgUrl})`, opacity: 0.2 }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
            </div>

            {/* MONITOR STYLE CENTRAL CARD */}
            <div className="relative z-10 w-full max-w-[85vw] bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                
                {/* Header (Top Bar) */}
                <div className="h-[8vh] bg-white/5 border-b border-white/5 flex items-center justify-between px-[3vw]">
                    <div className="flex items-center gap-[0.8vw]">
                        <div className="w-[2vw] h-[2vw] bg-primary rounded-lg flex items-center justify-center">
                            <MusicalNoteIcon className="w-[1.2vw] h-[1.2vw] text-white" />
                        </div>
                        <span className="text-[1.2vw] font-black tracking-tighter uppercase">YouOKE <span className="text-primary font-normal">Receiver</span></span>
                    </div>
                    <div className="flex items-center gap-[1.5vw] text-white/30 text-[0.8vw] font-black uppercase tracking-[0.3em]">
                        <span className="flex items-center gap-[0.5vw]"><SignalIcon className="w-[1vw] h-[1vw] text-green-500" /> Cloud Connected</span>
                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span>{typeof window !== 'undefined' ? window.location.hostname : 'play.okeforyou.com'}</span>
                    </div>
                </div>

                {/* Main Body (Split inside Card) */}
                <div className="flex-1 grid grid-cols-12 p-[4vw] gap-[4vw] items-center">
                    
                    {/* QR HALF */}
                    <div className="col-span-4 flex flex-col items-center gap-[3vh] border-r border-white/5 pr-[4vw]">
                        <div className="relative p-[1.5vw] bg-white rounded-[2.5rem] shadow-2xl transform -rotate-1">
                            <div className="w-[14vw] h-[14vw]">
                                <QRCodeSVG value={qrUrl} size={1024} className="w-full h-full rounded-xl" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[1.1vw] font-black text-white/80 mb-1">สแกนเพื่อเชื่อมต่อ</p>
                            <p className="text-[0.9vw] text-white/40 leading-relaxed font-medium">เปิดกล้องมือถือแล้วสแกน<br />เพื่อเริ่มเลือกเพลงเข้าคิว</p>
                        </div>
                    </div>

                    {/* CODE HALF (Monitor Style) */}
                    <div className="col-span-8 flex flex-col items-center justify-center text-center">
                         <span className="text-[1vw] font-black uppercase tracking-[0.5em] text-primary/60 mb-[2vh]">ยืนยันรหัสเข้าห้อง</span>
                         
                         <div className="relative group">
                             {/* Subtle Glow */}
                             <div className="absolute -inset-[5vw] bg-primary/20 rounded-full blur-[8vw] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                             
                             <div className="relative text-[16vw] font-black leading-none tracking-tighter text-white drop-shadow-[0_10px_60px_rgba(255,50,0,0.15)] flex gap-[1vw]">
                                 {roomCode}
                             </div>
                         </div>

                         <div className="mt-[5vh] flex items-center gap-[1vw]">
                            <div className="px-[2vw] py-[1.2vh] bg-white/5 border border-white/10 rounded-2xl flex items-center gap-[0.8vw] text-[1vw] font-bold text-white/60">
                                <PlayCircleIcon className="w-[1.2vw] h-[1.2vw] text-primary" />
                                พร้อมเริ่มปาร์ตี้ - ควบคุมทุกอย่างผ่านมือถือคุณ
                            </div>
                         </div>
                    </div>

                </div>

                {/* Footer (Info Bar) */}
                <div className="h-[6vh] bg-stone-950 flex items-center px-[3vw]">
                    <marquee className="text-[1vw] font-bold text-white/20 whitespace-nowrap uppercase tracking-[0.3em]">
                        Ready to sing • Connect your mobile to start queueing songs • Scan QR Code to access remote control • System Online • Build v{process.env.NEXT_PUBLIC_APP_VERSION || '5.5.33'}
                    </marquee>
                </div>
            </div>

            {/* SAFE ZONE INDICATORS (Subtle) */}
            <div className="absolute top-[2vh] right-[2vw] text-white/10 text-[0.7vw] font-black uppercase tracking-widest">
                Receiver Instance Active
            </div>
        </div>
    );
};



