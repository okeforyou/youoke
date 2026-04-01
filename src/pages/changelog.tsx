import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CHANGELOGS = [
    {
        version: "4.2.8 (LINE Identity Bridge)",
        date: "1 เม.ย. 2569",
        changes: [
            "[System] Identity Bridge: เพิ่มระบบตรวจสอบสถานะการเชื่อมต่อ LINE ในหน้าโปรไฟล์ลูกค้า เพื่อผูกบัญชี Gmail เข้ากับ LINE ID อัตโนมัติ",
            "[UI/UX] Dynamic LINE Support: ปรับปรุงส่วนติดต่อแอดมินใน Profile Drawer ให้แสดงสถานะ 'Linked' เมื่อมีการผูกบัญชีแล้ว",
            "[Admin] UX Enhancement: แยกปุ่ม 'คุยกับแอดมิน' และปุ่ม 'เชื่อมต่อระบบ' ให้ชัดเจนขึ้นเพื่อลดความสับสนของผู้ใช้งาน"
        ]
    },
    {
        version: "4.2.7 (LINE Connect & Admin DM)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Admin] LINE Messaging Bridge: เพิ่มระบบตรวจสอบคนเชื่อมต่อ LINE ในหน้าจัดการสมาชิก พร้อมช่องส่งข้อความ LINE รายบุคคล (Direct Push)",
            "[User] LINE Connection UI: เพิ่มส่วน 'เชื่อมต่อ LINE เพื่อรับการแจ้งเตือน' ในหน้าโปรไฟล์เพื่อสมานรอยเชื่อมระหว่าง Gmail และ LINE",
            "[System] Data Mapping: เตรียมโครงสร้าง Firestore ฟิลด์ lineUserId เพื่อความแม่นยำในการระบุตัวตนข้ามแพลตฟอร์ม"
        ]
    },
    {
        version: "4.2.6 (Hybrid UI & Messaging Prep)",
        date: "1 เม.ย. 2569",
        changes: [
            "[UI/UX] Hybrid Changelog: ปรับปรุงส่วนหัวเป็นแบบเดิม (Classic Header) เพื่อความโล่งและอ่านง่าย และคงเนื้อหาแบบ Compact Timeline",
            "[Admin] Messaging Strategy: เริ่มวางโครงสร้าง LINE Messaging API เพื่อส่งรายละเอียดสมัครสมาชิก/ต่ออายุ พร้อมปุ่ม 'อนุมัติ' รายบุคคล",
            "[System] Cloud Sync: ปรับปรุงโครงสร้าง API Notify ให้รองรับการเพิ่ม LINE Channel ในอนาคต"
        ]
    },
    {
        version: "4.2.4 (Messaging & Logic Fix)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Critical Fix] Notification Sync: แก้ไชระบบคำนวณข่าวที่ยังไม่ได้อ่าน ทำให้จุดกระพริบสีแดงหายไปทันทีเมื่อกดอ่าน (Global Sync)",
            "[Admin] Messaging Prep: เริ่มวางโครงสร้าง LINE Messaging API เพื่อส่งข้อความแจ้งเตือนสถานะการโอนเงินและอื่นๆ",
            "[System] UI Polishing: ปรับปรุงความเสถียรของหน้า Dashboard และ Sidebar ให้ซิงค์เวอร์ชันตรงกัน 100%"
        ]
    },
    {
        version: "4.2.2 (Billboard Master)",
        date: "1 เม.ย. 2569",
        changes: [
            "[UI/UX] Pulse Dot Mass Update: กวาดล้างตัวเลข Badge ออกจากทุุกจุด (Sidebar, Mobile Bar, Bottom Nav) เปลี่ยนเป็นจุดกระพริบเพื่อความ Minimalist",
            "[Admin] Billboard Edit Mode: เพิ่มระบบ 'แก้ไข' (Edit) ประกาศเดิม สามารถแก้หัวข้อและเนื้อหาได้ทันทีโดยไม่ต้องลบสร้างใหม่",
            "[System] Custom Modal Integration: เปลี่ยนจาก window.confirm เป็นการใช้ระบบ Confirm Modal พรีเมียมของ YouOKE ในทุุกจุด"
        ]
    },
    {
        version: "4.2.1 (Management Update)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Announcement] Pulse Indicator: เปลี่ยนจากตัวเลข Badge เป็นจุดสีแดงกระพริบ (Minimal Pulse) เพื่อความสะอาดตา",
            "[Admin] Billboard Manager: เพิ่มระบบจัดการประกาศในหน้า Admin บรอดแคสต์ สามารถลบข่าวเก่าได้ทันที",
            "[System] Layout Sync: ปรับปรุงหน้า Broadcast ให้รองรับการแสดงผลรายการข่าวแบบสองคอลัมน์"
        ]
    },
    {
        version: "4.2.0 (Unified Sync)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Announcement] Unified Read Status: เชื่อมต่อระบบกะดิ่งและรายการใน Sidebar ให้ซิงค์สถานะการอ่านและ Badge Count พร้อมกัน 100%",
            "[Announcement] Multi-Component Messaging: เพิ่มระบบ Event Listener เพื่อเคลียร์ Badge บนหน้า Dashboard ทันทีที่กดอ่านจาก Sidebar",
            "[Announcement] UI Polishing: ปรับปรุงสถานะจาง (Dim) และปุ่ม 'อ่านทั้งหมด' ให้แสดงผลถูกต้องในทุุกอุปกรณ์"
        ]
    },
    {
        version: "4.1.8 (Agent Standards)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Governance] บันทึกกฎเหล็ก Agnet.md: กำหนดมาตรฐานการอัปเดตเวอร์ชันและ Changelog ทุกครั้งที่มีการแก้ไข (Formalize Versioning Policy)",
            "[System] Sync Logic: ปรับปรุงโครงสร้างโปรเจกต์ให้เลขเวอร์ชันในหน้าจอตรงกับในบันทึกการเปลี่ยนแปลง (Changelog) ทั้งระบบ"
        ]
    },
    {
        version: "4.1.7 (Announcement UX)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Announcement] เพิ่มระบบ Interactive Read: ผู้ใช้สามารถเลือกกด 'อ่าน' ทีละรายการเพื่อลดจำนวนแจ้งเตือนได้จริง",
            "[Announcement] ย้ายระบบ Read Status ไปเก็บแบบ Array ใน LocalStorage เพื่อความแม่นยำรายบุคคล",
            "[UI/UX] เพิ่มปุ่ม 'ทำเครื่องหมายว่าอ่านทั้งหมด' ที่ใช้งานได้จริง เพื่อความสะดวกของผู้ใช้",
            "[UI/UX] ปรับปรุง Version Label ใน Sidebar เป็นสีเทาเท่ๆ (Minimalist) ตามมาตรฐาน Master Pattern",
            "[Navigation] เชื่อมโยงเลขเวอร์ชันใน Sidebar ให้ลิงก์เข้าสู่หน้า Changelog โดยตรง"
        ]
    },
    {
        version: "4.1.4 (System Billboard)",
        date: "31 มี.ค. 2569",
        changes: [
            "[System] Billboard Engine: เปลี่ยนระบบประกาศข่าวสารมาใช้ Firestore Direct Read แทน API เพื่อตัดปัญหา Quota Exhausted",
            "[Performance] Social Login Optimization: ปรับปรุงความเร็วในการเข้าสู่ระบบด้วยระบบ Delay Async Initialization",
            "[Bug Fix] แก้ไขปัญหา Invalid Date ในหน้าแจ้งเตือนด้วย Date Formatter ตัวใหม่ที่รองรับ Firestore Timestamp"
        ]
    },
    {
        version: "2.18.0 (Spotify Module)",
        date: "19 ม.ค. 2569",
        changes: [
            "[Code Structure] แยก Spotify Integration ออกเป็น Module (spotify-theme) เพื่อความเป็นระเบียบและแก้ไขง่าย",
            "[Refactor] จัดระเบียบ API และ Service ที่เกี่ยวข้องกับ Spotify ทั้งหมดไปยัง src/modules/",
            "[System] เตรียมรองรับการเปิด/ปิด Feature Spotify ในอนาคตผ่าน Marketplace System",
            "[System] เพิ่มการแสดงรหัส Build Commit Hash ในหน้า Changelog เพื่อตรวจสอบเวอร์ชัน"
        ]
    },
    {
        version: "2.17.1 (Mobile Performace)",
        date: "19 ม.ค. 2569",
        changes: [
            "[Performance] แก้ปัญหาหน้าจอกระพริบและแลค (Flicker/Lag) เวลาเลื่อนเมาส์หรือแตะที่หน้าจอ",
            "[Performance] ลดการ Re-render ของระบบ Update เวลาเพลง (Timer) ทำให้ลื่นขึ้น 300%",
            "[Mobile] เมนูนำทางด้านล่าง 5 ปุ่ม (Home, Recommend, Trending, Playlist, Queue) กลับมาใช้งานได้ปกติ",
            "[Mobile] ย้ายปุ่ม Search กลับไปที่ Header ด้านบน (ขวา) เพื่อความคุ้นเคย",
            "[UI] เก็บโค้ดเพิ่มประสิทธิภาพ (Optimization) ไว้ทั้งหมด เพื่อความลื่นไหล",
            "[Fix] แก้ไข Build Error ที่เกิดจากการประกาศตัวแปรซ้ำซ้อน"
        ]
    },
    {
        version: "2.16.0 (Mobile UX)",
        date: "18 ม.ค. 2569",
        changes: [
            "[Mobile] ปรับขนาดปุ่มควบคุม (Play/Pause) ให้ใหญ่ขึ้น กดง่ายขึ้น",
            "[Mobile] ซ่อน Version Tag บนมือถือเพื่อประหยัดพื้นที่",
            "[Refactor] ลบ Component ที่ไม่ได้ใช้งาน (MobileMiniPlayer) เพื่อลดขนาดไฟล์"
        ]
    }
];

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans p-6 md:p-12 max-w-3xl mx-auto">
            <Head>
                <title>Changelog - YouOKE</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <header className="mb-12 border-b pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">Change Log</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-sm text-gray-500 mt-1 font-medium">ติดตามสถานะและความเคลื่อนไหวล่าสุด (v4.2.8)</p>
                        {process.env.NEXT_PUBLIC_COMMIT_HASH && (
                            <span className="text-[10px] font-mono opacity-40 bg-slate-100 px-1.5 py-0.5 rounded">
                                #{process.env.NEXT_PUBLIC_COMMIT_HASH.slice(0, 7)}
                            </span>
                        )}
                    </div>
                </div>
                <Link href="/" className="btn btn-ghost btn-sm gap-2 text-slate-500 hover:text-primary transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            <main className="space-y-8">
                {CHANGELOGS.map((log, index) => (
                    <article key={index} className="relative pl-8 border-l border-slate-100 last:border-l-0">
                        {/* Timeline Node */}
                        <div className={cn(
                            "absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm transition-all duration-500",
                            index === 0 ? 'bg-primary scale-125 z-10 ring-4 ring-primary/10' : 'bg-slate-200'
                        )}></div>

                        <header className="mb-3">
                            <div className="flex items-baseline gap-3">
                                <h2 className={cn(
                                    "text-base font-black tracking-tight",
                                    index === 0 ? "text-slate-900" : "text-slate-500"
                                )}>
                                    v{log.version}
                                </h2>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    index === 0 ? "text-primary/70" : "text-slate-300"
                                )}>
                                    {log.date}
                                </span>
                            </div>
                        </header>

                        <ul className="space-y-2">
                            {log.changes.map((change, i) => (
                                <li key={i} className="group flex gap-3 text-[13px] leading-relaxed text-slate-600 hover:text-slate-900 transition-colors">
                                    <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0 group-hover:bg-primary transition-colors" />
                                    <span className="font-medium">{change}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </main>

            <footer className="mt-20 pt-8 border-t border-slate-50 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">&copy; {new Date().getFullYear()} YouOKE. All rights reserved.</p>
            </footer>
        </div>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
