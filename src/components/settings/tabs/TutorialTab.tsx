import React, { useState, useEffect } from "react";
import { 
    Search, Smartphone, ListMusic, Tv, Crown, 
    Mic2, PlayCircle, Monitor, Cast, Radio, 
    Sparkles, ArrowRight, ScanLine, Laptop, Globe
} from "lucide-react";
import clsx from "clsx";

export default function TutorialTab() {
    const [activeTab, setActiveTab] = useState('search');
    const [domain, setDomain] = useState('play.okeforyou.com');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDomain(window.location.host);
        }
    }, []);

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
                desc: `เปิดเบราว์เซอร์บนทีวีไปที่ ${domain}/tv เพื่อดูวิดีโอแบบเต็มจอ แล้วใช้มือถือสแกน QR Code เพื่อค้นหาและควบคุมเพลงได้ทันที`, 
                icon: Radio,
                highlight: true 
            },
            { id: 'c2', title: "2. ส่งจอแยกไร้สาย (Web Monitor)", desc: `เหมือนโหมด DJ ที่ใช้หน้าจอหลักคุมเพลง แต่ส่งเนื้อร้องไปแสดงที่อุปกรณ์อื่น (iPad, Laptop) ได้แบบไร้สาย ไม่ต้องใช้สาย HDMI`, icon: Laptop },
            { id: 'c3', title: "3. สาย HDMI (Dual Screen)", desc: "ต่อสาย HDMI -> เลือกโหมด Extend -> ลากหน้าต่างตัวเล่นไปไว้ที่จอทีวี เหมาะสำหรับการตั้งค่าแบบเครื่องเดียวแยกหน้าจอ", icon: Monitor },
            { id: 'c4', title: "4. Google Chromecast", desc: "กดไอคอน Cast 📺 ในระบบ เพื่อส่งภาพขึ้น Chromecast หรือ Android TV ของคุณทันที (ใช้บน Chrome Browser)", icon: Cast },
        ],
        vip: [
            { id: 'v1', title: "เพลิดเพลินแบบไร้โฆษณา", desc: "อัปเกรดเป็น VIP เพื่อร้องเพลงได้ต่อเนื่องไม่มีโฆษณาคั่น ให้ปาร์ตี้ของคุณลื่นไหลตั้งแต่อต้นจนจบ", icon: PlayCircle },
            { id: 'v2', title: "สิทธิพิเศษจัดเต็ม", desc: "ได้รับโควต้าค้นหาไม่จำกัด, บันทึกรายการโปรด และสัมผัสคุณภาพเสียงระดับไฮเอนด์ (Master Grade)", icon: Crown },
        ]
    };

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            {/* Visual Intro */}
            <div className="mb-8 text-left">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Getting Started</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white leading-tight tracking-tighter">
                    มารู้จักวิธีการใช้งาน YouOKE ให้สนุกที่สุดกัน!
                </h2>
            </div>

            {/* Tabs - Flat Style */}
            <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-none no-scrollbar -mx-2 px-2 sticky top-0 bg-white dark:bg-zinc-950 z-10 py-2">
                <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[11px] whitespace-nowrap transition-all border shrink-0 shadow-none",
                                activeTab === tab.id 
                                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white" 
                                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-100 dark:border-zinc-800"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Cards */}
            <div className="space-y-4 mt-2">
                {content[activeTab as keyof typeof content].map((item: any) => (
                    <div 
                        key={item.id} 
                        className={clsx(
                            "p-5 sm:p-6 rounded-3xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-300",
                            item.highlight 
                                ? "bg-white dark:bg-zinc-900 border-primary/20 ring-1 ring-primary/5 shadow-none" 
                                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-none"
                        )}
                    >
                        <div className="flex items-start gap-4 sm:gap-6">
                            <div className={clsx(
                                "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform",
                                item.highlight 
                                    ? "bg-primary text-white border-primary" 
                                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-100 dark:border-zinc-700"
                            )}>
                                <item.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                            <div className="pt-0.5 flex-1">
                                <h3 className={clsx(
                                    "font-black text-base sm:text-lg mb-1 tracking-tight",
                                    item.highlight ? "text-primary" : "text-zinc-900 dark:text-white"
                                )}>
                                    {item.title}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs font-bold leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pro Tips / Footer Info */}
            <div className="mt-8 bg-zinc-900 dark:bg-zinc-900 p-6 rounded-3xl text-center border border-zinc-800 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PlayCircle size={80} className="text-white" />
                </div>
                <h4 className="text-white font-black text-sm mb-3 tracking-tight flex items-center justify-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    เชื่อมความสนุกแบบไร้สาย!
                </h4>
                <p className="text-zinc-400 text-[10px] sm:text-[11px] font-bold leading-loose px-2">
                    คุณรู้หรือไม่? YouOKE สามารถเชื่อมต่อรีโมทมือถือได้พร้อมกันหลายเครื่อง 
                    จะกี่คนก็ช่วยกันเลือกเพลงและจัดการคิวได้ทันทีโดยไม่ต้องแย่งกัน!
                </p>
            </div>
        </div>
    );
}
