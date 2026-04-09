import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft, ShieldCheck, Youtube, Info, Lock, Home, Sparkles, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export default function TermsPage() {
    const router = useRouter();

    const sections = [
        {
            id: 'youtube',
            title: "เราเชื่อมต่อกับ YouTube โดยตรง",
            desc: "YouOKE ไม่ใช่ผู้ให้บริการเนื้อหา และไม่มีการจัดเก็บหรืออัปโหลดไฟล์เพลงลงบนเซิร์ฟเวอร์ของเราเอง เนื้อหาทั้งหมดถูกประมวลผลผ่าน YouTube API โดยตรง",
            icon: Youtube,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            borderColor: "border-red-500/10",
            highlight: true
        },
        {
            id: 'nature',
            title: "YouOKE คืออะไร?",
            desc: "เป็นระบบจัดการคิว (Queue Management) และส่วนติดต่อผู้ใช้ที่ออกแบบมาเพื่อช่วยให้นักร้องสามารถค้นหาเพลง จัดลำดับ และควบคุมเพลงผ่านมือถือได้อย่างมีประสิทธิภาพ",
            icon: Info,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/10"
        },
        {
            id: 'restriction',
            title: "เงื่อนไขการใช้งาน",
            desc: "ระบบถูกออกแบบมาเพื่อความบันเทิงส่วนบุคคลภายในที่พักอาศัยเท่านั้น ผู้ใช้งานต้องปฏิบัติตามมาตรฐานชุมชนและข้อตกลงของ YouTube อย่างเคร่งครัด",
            icon: Lock,
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/10"
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans select-none overflow-x-hidden">
            <Head>
                <title>ข้อตกลงและเงื่อนไข - YouOKE</title>
            </Head>

            {/* Premium Header - Pure Flat */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/50 sticky top-0 z-[100] px-6 py-4 flex items-center justify-between">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-none border-none"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-black text-zinc-900 dark:text-white tracking-tight leading-none uppercase">ข้อตกลงการใช้งาน</h1>
                    <p className="text-[9px] font-black text-primary tracking-[0.3em] uppercase mt-1 opacity-70">Legal & Privacy</p>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 pb-32">
                {/* Visual Intro */}
                <div className="mb-12 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Safety First</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-[1.1] tracking-tighter mb-4">
                        นโยบายความปลอดภัย<br/>และเงื่อนไขการให้บริการ
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm leading-relaxed sm:max-w-md">
                        กรุณาอ่านและทำความเข้าใจนโยบายของเรา เพื่อสร้างประสบการณ์คาราโอเกะที่ดีและถูกต้องที่สุดสำหรับคุณ
                    </p>
                </div>

                {/* Content Cards */}
                <div className="space-y-6">
                    {sections.map((item) => (
                        <div 
                            key={item.id} 
                            className={clsx(
                                "p-8 rounded-[2.5rem] border transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-none",
                                item.highlight 
                                    ? "bg-white dark:bg-zinc-900 border-red-500/20 ring-1 ring-red-500/5" 
                                    : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                            )}
                        >
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className={clsx(
                                    "w-16 h-16 rounded-[2rem] flex items-center justify-center shrink-0 border transition-transform",
                                    item.bgColor, item.color, item.borderColor
                                )}>
                                    <item.icon className="w-8 h-8" strokeWidth={2.5} />
                                </div>
                                <div className="text-center sm:text-left pt-1">
                                    <h3 className={clsx(
                                        "font-black text-xl mb-3 tracking-tight",
                                        item.highlight ? "text-red-600 dark:text-red-500" : "text-zinc-900 dark:text-white"
                                    )}>
                                        {item.title}
                                    </h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Guidelines */}
                <div className="mt-12 space-y-4">
                    <h4 className="text-zinc-400 dark:text-zinc-500 font-black text-[10px] uppercase tracking-widest px-4 mb-4">YouOKE Features at a Glance</h4>
                    {[
                        'ค้นหาเพลงที่ต้องการบน YouTube ได้รวดเร็วที่สุด',
                        'จัดลำดับการร้อง (Queue) ได้อย่างมีประสิทธิภาพ',
                        'ควบคุมการเล่นเพลงผ่านสมาร์ทโฟนแบบไร้สาย 100%'
                    ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-none">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300 font-black text-xs sm:text-sm">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* Footer Policy Link */}
                <div className="mt-16 text-center space-y-6">
                    <div className="inline-block p-4 rounded-3xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800">
                         <p className="text-zinc-400 text-[10px] font-black tracking-widest uppercase">The Smart Karaoke Operating System</p>
                    </div>
                </div>

                {/* Final Action */}
                <button 
                    onClick={() => router.push('/login')}
                    className="w-full mt-10 py-5 rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-lg active:scale-[0.98] transition-all border-none shadow-none flex items-center justify-center gap-3"
                >
                    <Home className="w-6 h-6" />
                    กลับสู่หน้าล็อกอิน
                </button>
            </main>

            {/* Bottom Padding */}
            <div className="h-20"></div>
        </div>
    );
}
