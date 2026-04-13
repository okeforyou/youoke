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
        <div className="absolute inset-0 bg-[#020202] overflow-hidden flex flex-col items-center justify-center font-sans select-none text-white p-[5vw]">
            
            {/* BACKGROUND LAYER (Deep & Atmospheric) */}
            <div className="absolute inset-0 z-0 scale-105">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] blur-[1vw]"
                    style={{ backgroundImage: `url(${bgUrl})`, opacity: 0.15 }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#020202]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-40" />
            </div>

            {/* SEAMLESS FLOATING CONTENT */}
            <div className="relative z-10 w-full max-w-[90vw] h-full flex flex-col justify-between py-[3vh]">
                
                {/* Header (Floating) */}
                <div className="flex items-center justify-between opacity-40">
                    <div className="flex items-center gap-[1vw]">
                        <div className="w-[3vw] h-[3vw] bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                            <MusicalNoteIcon className="w-[1.8vw] h-[1.8vw] text-white" />
                        </div>
                        <span className="text-[1.8vw] font-black tracking-tighter uppercase">YouOKE <span className="text-primary font-normal">TV</span></span>
                    </div>
                    <div className="flex items-center gap-[1vw] text-[1vw] font-black uppercase tracking-[0.4em]">
                        <WifiIcon className="w-[1.2vw] h-[1.2vw]" />
                        Cloud Link Active
                    </div>
                </div>

                {/* Main View (Split but Seamless) */}
                <div className="flex-1 grid grid-cols-12 gap-[5vw] items-center">
                    
                    {/* QR AREA (Left) */}
                    <div className="col-span-5 flex flex-col items-start gap-[4vh]">
                        <div className="relative p-[1.5vw] bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] transform -rotate-1">
                            <div className="w-[18vw] h-[18vw]">
                                <QRCodeSVG value={qrUrl} size={1024} className="w-full h-full rounded-2xl" />
                            </div>
                            <div className="absolute -bottom-[2vh] left-1/2 -translate-x-1/2 bg-black text-white px-[2vw] py-[1vh] rounded-full text-[1vw] font-black border border-white/10 flex items-center gap-[0.5vw] whitespace-nowrap">
                                <SignalIcon className="w-[1.2vw] h-[1.2vw] text-green-500" />
                                สแกนเพื่อเชื่อมต่อ
                            </div>
                        </div>
                        <div className="pl-[1vw]">
                            <h3 className="text-[1.5vw] font-black text-white/90 mb-[1vh]">พร้อมร้องเพลงหรือยัง?</h3>
                            <p className="text-[1.1vw] text-white/40 font-medium leading-relaxed">
                                เปิดกล้องมือถือแล้วสแกน QR Code<br />เพื่อเริ่มค้นหาเพลงและจัดคิวได้ทันที
                            </p>
                        </div>
                    </div>

                    {/* CODE AREA (Right) */}
                    <div className="col-span-7 flex flex-col items-center text-center">
                         <span className="text-[1.2vw] font-black uppercase tracking-[0.6em] text-white/20 mb-[2vh]">ยืนยันรหัสเข้าห้อง</span>
                         
                         <div className="relative group">
                             {/* Subtle Glow behind the code */}
                             <div className="absolute inset-0 bg-primary/20 rounded-full blur-[10vw] opacity-40 animate-pulse" />
                             
                             <div className="relative text-[18vw] font-black leading-none tracking-tighter text-white select-none">
                                 {roomCode}
                             </div>
                         </div>

                         <div className="mt-[4vh] space-y-[2vh]">
                            <div className="text-[1.5vw] font-black text-primary/60 tracking-widest uppercase">
                                {typeof window !== 'undefined' ? window.location.hostname : 'play.okeforyou.com'}
                            </div>
                            <div className="flex items-center gap-[0.8vw] text-white/20 text-[1vw] font-black uppercase tracking-[0.2em]">
                                <PlayCircleIcon className="w-[1.2vw] h-[1.2vw]" />
                                Smart Karaoke Receiver Mode
                            </div>
                         </div>
                    </div>

                </div>

                {/* Footer (Floating Ticker) */}
                <div className="flex items-center justify-between mt-[2vh] py-[2vh] border-t border-white/5 opacity-30">
                    <marquee className="flex-1 text-[1.1vw] font-bold uppercase tracking-[0.5em]">
                        Ready to sing • Scan QR Code to access remote control • System Online • Secure Connection • v{process.env.NEXT_PUBLIC_APP_VERSION || '5.5.34'}
                    </marquee>
                    <div className="pl-[4vw] flex items-center gap-[1vw] font-black text-[0.9vw] uppercase tracking-widest">
                        <UserIcon className="w-[1vw] h-[1vw]" />
                        Service Active
                    </div>
                </div>
            </div>
        </div>
    );
};




