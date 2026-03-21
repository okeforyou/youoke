import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Youtube, Info, Lock, Home } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <Head>
                <title>ข้อตกลงและเงื่อนไขการใช้งาน - YouOke</title>
            </Head>

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">ข้อตกลงการใช้งาน</h1>
                </div>
            </header>

            <main className="pt-24 pb-20 px-6">
                <div className="max-w-2xl mx-auto space-y-12">
                    
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                             <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">ข้อตกลงและนโยบายการใช้งาน<br/>เพื่อความสุขของสมาชิก YouOke</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            กรุณาอ่านและทำความเข้าใจนโยบายการให้บริการของเรา เพื่อประสบการณ์คาราโอเกะที่ดีที่สุดสำหรับคุณ
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-10">
                        {/* 1. YouTube Disclaimer */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <Youtube size={24} />
                                <h3 className="text-xl font-black tracking-tight">เราเชื่อมต่อกับ YouTube โดยตรง</h3>
                            </div>
                            <div className="bg-red-50/50 rounded-3xl p-6 lg:p-8 space-y-4 border border-red-100">
                                <p className="text-gray-700 leading-relaxed font-medium">
                                    YouOke <span className="text-red-600 font-black">ไม่ใช่ผู้ให้บริการเนื้อหา (Content Provider)</span> และไม่มีการจัดเก็บหรืออัปโหลดไฟล์เพลง (MP3/MP4) ลงบนเซิร์ฟเวอร์ของเราเอง 
                                </p>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    เนื้อหาดนตรีและวิดีโอทั้งหมดที่คุณเห็น ถูกประมวลผล (Processing) และส่งสัญญาณภาพ/เสียงมาจาก <span className="font-bold">YouTube API</span> โดยตรงสิทธิและความเป็นเจ้าของในเนื้อหานั้นๆ ทั้งหมดเป็นของเจ้าของลิขสิทธิ์ดั้งเดิมบนแพลตฟอร์ม YouTube
                                </p>
                            </div>
                        </section>

                        {/* 2. System Nature */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-blue-600">
                                <Info size={24} />
                                <h3 className="text-xl font-black tracking-tight">YouOke คืออะไร?</h3>
                            </div>
                            <div className="space-y-4">
                                <p className="text-gray-600 leading-relaxed">
                                    YouOke เป็นเพียง <span className="text-gray-900 font-bold underline decoration-2 underline-offset-4 decoration-blue-200">ระบบจัดการคิว (Queue Management System)</span> และส่วนติดต่อผู้ใช้ (Interface) ที่ถูกออกแบบมาเพื่อช่วยให้นักร้องคาราโอเกะสามารถ:
                                </p>
                                <ul className="grid grid-cols-1 gap-3">
                                    {['ค้นหาเพลงที่ต้องการบน YouTube ได้รวดเร็ว', 'จัดลำดับการร้อง (Queue) ได้อย่างมีประสิทธิภาพ', 'ควบคุมการเล่นเพลงผ่านสมาร์ทโฟนแบบไร้สาย'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 font-bold text-[14px]">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* 3. Usage Restriction */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-orange-600">
                                <Home size={24} />
                                <h3 className="text-xl font-black tracking-tight">เงื่อนไขและขอบเขตการใช้งาน</h3>
                            </div>
                            <div className="bg-gray-900 rounded-3xl p-8 text-white space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-orange-400 font-black uppercase text-xs tracking-widest">จำกัดการใช้งาน</h4>
                                    <p className="font-bold text-lg leading-snug">
                                        ระบบ YouOke ถูกออกแบบมาเพื่อการใช้งาน "เพื่อความบันเทิงส่วนบุคคล" และ "ภายในที่พักอาศัย" เท่านั้น
                                    </p>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Lock size={20} className="text-orange-400 shrink-0 mt-1" />
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        ผู้ใช้งานต้องรับผิดชอบในการปฏิบัติตามมาตรฐานชุมชนและข้อตกลงการใช้งานของ YouTube อย่างเคร่งครัด YouOke จะไม่รับผิดชอบต่อกรณีการนำไปใช้งานที่ผิดวัตถุประสงค์หรือผิดเงื่อนไขของแพลตฟอร์มต้นทาง
                                    </p>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Final Note */}
                    <div className="pt-8 border-t border-gray-100 text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">YouOke - The Smart Karaoke OS</p>
                        <Link href="/login" className="inline-flex h-12 items-center px-8 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-full transition-all active:scale-95">
                            กลับสู่หน้าล็อกอิน
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
