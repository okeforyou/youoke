import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
    ChevronLeft, Search, Smartphone, ListMusic, Tv, Crown, 
    Mic2, PlayCircle, Monitor, Cast, Youtube, Radio, 
    Sparkles, ArrowRight, ScanLine, Laptop, Globe
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import clsx from "clsx";
import Head from "next/head";

export default function TutorialPage() {
    const router = useRouter();
    const setProfileOpen = useUIStore(state => state.setProfileOpen);
    const [activeTab, setActiveTab] = useState('search');
    const [domain, setDomain] = useState('play.okeforyou.com');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDomain(window.location.host);
        }
    }, []);

    const handleBack = () => {
        setProfileOpen(true);
        router.back();
    };

    const tabs = [
        { id: 'search', label: 'ค้นหาเพลง', icon: Search },
        { id: 'remote', label: 'รีโมทมือถือ', icon: Smartphone },
        { id: 'queue', label: 'จัดการคิว', icon: ListMusic },
        { id: 'casting', label: 'ต่อหน้าจอ', icon: Tv },
        { id: 'vip', label: 'สมาชิก VIP', icon: Crown },
    ];

    const content = {
        search: [
            { id: 's1', title: "พิมพ์ค้นหา", desc: "พิมพ์ชื่อเพลงหรือศิลปินในช่องด้านบน ระบบจะค้นหาและแสดงผลลัพธ์แบบเรียลไทม์ทันทีที่คุณเริ่มพิมพ์", icon: Search },
            { id: 's2', title: "สั่งงานด้วยเสียง", desc: "กดไอคอนไมโครโฟน 🎙️ แล้วพูดชื่อเพลงที่ต้องการ ระบบจะวิเคราะห์เสียงและดึงเพลงที่ตรงที่สุดมาให้ทันที", icon: Mic2 },
        ],
        remote: [
            { id: 'r1', title: "สแกนเพื่อเริ่ม", desc: "เปิดหน้าจอตัวเล่นเพลง (Player) บนคอมพิวเตอร์ แล้วใช้มือถือสแกน QR Code ที่ปรากฏเพื่อสลับเข้าสู่โหมดรีโมท", icon: ScanLine },
            { id: 'r2', title: "ควบคุมไร้สาย", desc: "มือถือของคุณจะกลายเป็นรีโมทอัจฉริยะ ให้คุณเพิ่มเพลง จัดคิว และปรับระดับเสียงได้จากทุกมุมห้อง", icon: Smartphone },
        ],
        queue: [
            { id: 'q1', title: "แทรกคิว (Insert)", desc: "หากต้องการร้องเพลงด่วน ให้กดไอคอน 'แซงคิว' (ด้านซ้ายของวิดีโอ) เพื่อให้เพลงถูกนำมาเล่นเป็นเพลงถัดไปทันที", icon: ArrowRight },
            { id: 'q2', title: "จัดการลำดับ", desc: "คลิกรายการคิวที่รออยู่เพื่อดูเพลงทั้งหมด คุณสามารถเลื่อนเปลี่ยนลำดับ หรือลบเพลงออกได้ตามต้องการ", icon: ListMusic },
        ],
        casting: [
            { 
                id: 'c1', 
                title: "1. โหมด Smart TV (Pure Player)", 
                desc: `เปิดเบราว์เซอร์บนทีวีไปที่ ${domain}/tv เหมาะสำหรับร้องบนจอใหญ่ที่เน้นดูวิดีโอเนื้อร้องคลีนๆ และคุมเพลงผ่านมือถือ 100%`, 
                icon: Radio,
                highlight: true 
            },
            { id: 'c2', title: "2. ส่งจอแยกไร้สาย (Web Monitor)", desc: `เปิด ${domain}/monitor บนแท็บเล็ตหรือคอมอีกเครื่อง เพื่อแยกหน้าจอเนื้อร้องไปแสดงผลแบบไร้สาย โดยไม่ต้องต่อสาย HDMI`, icon: Laptop },
            { id: 'c3', title: "3. สาย HDMI (Dual Screen)", desc: "ต่อสาย HDMI -> เลือกโหมด Extend -> ลากหน้าต่างตัวเล่นไปไว้ที่จอทีวี เหมาะสำหรับการตั้งค่าแบบเครื่องเดียวแยกหน้าจอ", icon: Monitor },
            { id: 'c4', title: "4. Google Chromecast", desc: "กดไอคอน Cast 📺 ในระบบ เพื่อส่งภาพขึ้น Chromecast หรือ Android TV ของคุณทันที (ใช้บน Chrome Browser)", icon: Chromecast },
        ],
        vip: [
            { id: 'v1', title: "เพลิดเพลินแบบไร้โฆษณา", desc: "อัปเกรดเป็น VIP เพื่อร้องเพลงได้ต่อเนื่องไม่มีโฆษณาคั่น ให้ปาร์ตี้ของคุณลื่นไหลตั้งแต่อต้นจนจบ", icon: PlayCircle },
            { id: 'v2', title: "สิทธิพิเศษจัดเต็ม", desc: "ได้รับโควต้าค้นหาไม่จำกัด, บันทึกรายการโปรด และสัมผัสคุณภาพเสียงระดับไฮเอนด์ (Master Grade)", icon: Crown },
        ]
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans select-none overflow-x-hidden">
            <Head>
                <title>คู่มือการใช้งาน - YouOKE</title>
            </Head>

            {/* Premium Header - Pure Flat */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/50 sticky top-0 z-[100] px-6 py-4 flex items-center justify-between">
                <button 
                    onClick={handleBack}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-none"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-black text-zinc-900 dark:text-white tracking-tight leading-none uppercase">คู่มือการใช้งาน</h1>
                    <p className="text-[9px] font-black text-primary tracking-[0.3em] uppercase mt-1 opacity-70">User Manual</p>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 pb-32">
                {/* Visual Intro */}
                <div className="mb-10 text-left">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Getting Started</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-tight tracking-tighter">
                        มารู้จักวิธีการใช้งาน YouOKE ให้สนุกที่สุดกัน!
                    </h2>
                </div>

                {/* Tabs - Flat Style */}
                <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-none no-scrollbar -mx-6 px-6 sticky top-[72px] bg-zinc-50 dark:bg-zinc-950 z-50 py-2">
                    <div className="flex gap-2 min-w-max pr-10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-5 py-3.5 rounded-2xl font-black text-[11px] whitespace-nowrap transition-all border shrink-0 shadow-none",
                                    activeTab === tab.id 
                                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white" 
                                        : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-100 dark:border-zinc-800"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Cards */}
                <div className="space-y-4">
                    {content[activeTab as keyof typeof content].map((item: any) => (
                        <div 
                            key={item.id} 
                            className={clsx(
                                "p-6 sm:p-8 rounded-[2.5rem] border transition-all animate-in fade-in slide-in-from-bottom-2 duration-300",
                                item.highlight 
                                    ? "bg-white dark:bg-zinc-900 border-primary/20 ring-1 ring-primary/5 shadow-none" 
                                    : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-none"
                            )}
                        >
                            <div className="flex items-start gap-5 sm:gap-7">
                                <div className={clsx(
                                    "w-12 h-12 sm:w-14 sm:h-14 rounded-3xl flex items-center justify-center shrink-0 border transition-transform",
                                    item.highlight 
                                        ? "bg-primary text-white border-primary" 
                                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-100 dark:border-zinc-700"
                                )}>
                                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
                                </div>
                                <div className="pt-1.5 flex-1">
                                    <h3 className={clsx(
                                        "font-black text-lg sm:text-xl mb-2 tracking-tight",
                                        item.highlight ? "text-primary" : "text-zinc-900 dark:text-white"
                                    )}>
                                        {item.title}
                                    </h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-bold leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pro Tips / Footer Info */}
                <div className="mt-12 bg-zinc-900 dark:bg-zinc-900 p-8 rounded-[3rem] text-center border border-zinc-800 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <PlayCircle size={100} className="text-white" />
                    </div>
                    <h4 className="text-white font-black text-lg mb-4 tracking-tight flex items-center justify-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        เชื่อมความสนุกแบบไร้สาย!
                    </h4>
                    <p className="text-zinc-400 text-[11px] sm:text-xs font-bold leading-loose px-4">
                        คุณรู้หรือไม่? YouOKE สามารถเชื่อมต่อรีโมทมือถือได้พร้อมกันหลายเครื่อง 
                        จะกี่คนก็ช่วยกันเลือกเพลงและจัดการคิวได้ทันทีโดยไม่ต้องแย่งกัน!
                    </p>
                </div>

                {/* Final Action */}
                <button 
                    onClick={() => router.push('/')}
                    className="w-full mt-8 py-5 rounded-[2rem] bg-primary text-white font-black text-lg active:scale-[0.98] transition-all border-none flex items-center justify-center gap-3 shadow-none"
                >
                    <PlayCircle className="w-6 h-6" />
                    เริ่มร้องเพลงกันเลย!
                </button>
            </main>

            {/* Mobile Tab Spacer */}
            <div className="h-10"></div>
        </div>
    );
}
