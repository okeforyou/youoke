import React, { useState } from "react";
import { useRouter } from "next/router";
import { 
    ChevronLeft, Search, Music, Mic2, Tv, Smartphone, 
    ListMusic, Crown, PlayCircle, Info, Sparkles, UserCheck
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import clsx from "clsx";

export default function TutorialPage() {
    const router = useRouter();
    const setProfileOpen = useUIStore(state => state.setProfileOpen);
    const [activeTab, setActiveTab] = useState('search');

    const handleBack = () => {
        setProfileOpen(true);
        router.back();
    };

    const tabs = [
        { id: 'search', label: 'ค้นหาเพลง', icon: Search },
        { id: 'remote', label: 'รีโมทมือถือ', icon: Smartphone },
        { id: 'display', label: 'ต่อจอทีวี', icon: Tv },
        { id: 'queue', label: 'จัดการคิว', icon: ListMusic },
        { id: 'account', label: 'สมาชิก VIP', icon: Crown },
    ];

    const content = {
        search: [
            { step: 1, title: "เข้าสู่โหมดค้นหา", desc: "กดไอคอนแว่นขยาย หรือใช้ช่องพิมพ์ด้านบนเพื่อเริ่มหาเพลง" },
            { step: 2, title: "ระบุชื่อเพลงหรือศิลปิน", desc: "พิมพ์ชื่อที่ต้องการ ระบบจะค้นหาจากคลังเพลงคุณภาพสูงให้ทันที" },
            { step: 3, title: "สั่งงานด้วยเสียง", desc: "กดไอคอนไมค์แล้วพูดชื่อเพลง คุณจะพบเพลงที่ต้องการในพริบตา" },
        ],
        remote: [
            { step: 1, title: "เปิดหน้าจอตัวเล่นเพลง", desc: "เข้าไปที่หน้าจอ Player (ตัวเล่น) เพื่อเตรียมรับการเชื่อมต่อจากรีโมทมือถือ" },
            { step: 2, title: "สแกน QR Code", desc: "ใช้มือถือเครื่องที่ต้องการให้เป็นรีโมท สแกน QR Code ที่แสดงอยู่บนหน้าจอคอมพิวเตอร์" },
            { step: 3, title: "สั่งเพลงไร้สาย", desc: "เมื่อเชื่อมต่อแล้ว มือถือจะกลายเป็นรีโมทอัจฉริยะ ให้คุณค้นหาและจัดคิวเพลงได้ทันที" },
        ],
        display: [
            { step: 1, title: "เชื่อมต่อสายสัญญาณ", desc: "ต่อสาย HDMI เข้ากับทีวี แล้วไปที่การตั้งค่าในคอมพิวเตอร์ เลือกโหมด 'Extend' (ขยายหน้าจอ)" },
            { step: 2, title: "แยกหน้าต่างตัวเล่น", desc: "กดไอคอนรูปหน้าจอในเมนู เพื่อแยกหน้าต่างตัวเล่น (Player) ออกมาจากหน้าหลัก" },
            { step: 3, title: "ลากและขยายเต็มจอ", desc: "ลากหน้าต่าง Player ไปไว้ที่จอทีวี แล้วกดปุ่ม Fullscreen เพื่อเข้าสู่โหมดคาราโอเกะเต็มรูปแบบ" },
        ],
        queue: [
            { step: 1, title: "ดูรายการคิว", desc: "กดที่รายการเพลงที่กำลังเล่นเพื่อดูคิวทั้งหมดที่รออยู่" },
            { step: 2, title: "จัดลำดับเพลง", desc: "เลือกแทรกคิว (Insert) หรือลบเพลงที่ไม่ต้องการออกได้ง่ายๆ" },
            { step: 3, title: "ข้ามเพลงปัจจุบัน", desc: "กดปุ่มถัดไป (Next) เพื่อข้ามไปยังเพลงถัดไปในคิวทันที" },
        ],
        account: [
            { step: 1, title: "ซิงค์บัญชี Gmail", desc: "เชื่อมต่อ Gmail เพื่อรับโควต้าเพลงเพิ่มและซิงค์คลังเพลงส่วนตัว" },
            { step: 2, title: "สมาชิกระดับ PRO", desc: "อัปเกรดเพื่อร้องเพลงไม่อั้น ไร้โฆษณาคั่น และใช้ฟีเจอร์ได้ครบทุกแบบ" },
            { step: 3, title: "บันทึกเพลย์ลิสต์", desc: "สร้างรายการเพลงโปรดไว้ร้องในปาร์ตี้ครั้งหน้าง่ายๆ แค่กดปุ่มหัวใจ" },
        ]
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col font-sans select-none">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-950 px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-zinc-900 shadow-none">
                <button onClick={handleBack} className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-2xl transition-all">
                    <ChevronLeft className="w-7 h-7 text-zinc-900 dark:text-white" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">คู่มือการใช้งาน</h1>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1.5 opacity-80">User Manual</span>
                </div>
                <div className="w-11"></div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
                {/* Visual Intro */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-primary/10 mb-6 transform hover:rotate-6 transition-transform">
                        <PlayCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 leading-[0.9] tracking-tighter">
                        สนุกกับ YouOke<br/>ง่ายๆ ในไม่กี่ก้าว
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">รวมทุกเทคนิคการใช้งานเพื่อให้คุณเป็นเซียนคาราโอเกะ</p>
                </div>

                {/* Categories Tab - Flat UI */}
                <div className="flex gap-2 overflow-x-auto pb-8 scrollbar-none no-scrollbar mb-10 -mx-6 px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-3.5 rounded-2xl font-black text-[11px] whitespace-nowrap transition-all border shadow-none",
                                activeTab === tab.id 
                                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white" 
                                    : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-gray-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:text-zinc-600"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Step Cards - Pure Flat */}
                <div className="space-y-4">
                    {content[activeTab as keyof typeof content].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-zinc-900/40 p-7 rounded-[3rem] border border-transparent dark:border-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group">
                            <div className="flex items-start gap-8">
                                <div className="w-14 h-14 rounded-3xl bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-zinc-700 font-black text-2xl text-zinc-900 dark:text-white shadow-none transition-transform group-hover:scale-110 group-hover:-rotate-3">
                                    {item.step}
                                </div>
                                <div className="pt-2">
                                    <h3 className="font-black text-zinc-900 dark:text-white text-xl mb-2 tracking-tight">{item.title}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Expert Tips Section */}
                <div className="mt-14 p-10 rounded-[4rem] bg-zinc-950 dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-800 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full mb-6">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Expert Tip</span>
                    </div>
                    <h4 className="text-xl font-black text-white mb-4">เชื่อมต่อความสนุกได้มากกว่า!</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                        คุณรู้หรือไม่? YouOke รองรับการเชื่อมต่อรีโมทหลายเครื่องพร้อมกัน ให้เพื่อนๆ ช่วยกันเลือกเพลงและจัดคิวได้ทันทีโดยไม่ต้องรอกัน!
                    </p>
                </div>

                {/* Action Button */}
                <button 
                    onClick={() => router.push('/')}
                    className="w-full mt-10 py-6 rounded-[2.5rem] bg-primary hover:bg-red-600 text-white font-black text-xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-none border-none"
                >
                    <PlayCircle className="w-7 h-7" />
                    ไปลุยกันเลย!
                </button>
            </main>
        </div>
    );
}
