import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CHANGELOGS = [
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
    },
    {
        version: "2.15.0 (PC Redesign)",
        date: "16 ม.ค. 2569",
        changes: [
            "[UI] สรุปหน้าจอ PC Mode ใหม่ทั้งหมด (Modern Glassmorphism)",
            "[UI] Redesigned Sidebar: เปลี่ยนเป็นโลโก้พร้อมไอคอนที่สะอาดตา (Minimal)",
            "[UI] Player Bar: ดีไซน์ใหม่แบบลอยตัว (Floating Glass) พร้อม Neon Progress Bar",
            "[UX] Moved Shuffle Button: ย้ายปุ่มสุ่มเพลงลงไปรวมที่แถบควบคุมด้านล่าง",
            "[UX] Artist Grid: ปรับโฉมใหม่ (Cover Overlay) ไม่มีกรอบ พร้อมชื่อศิลปินมุมซ้ายล่าง",
            "[Fix] Prevent Auto-play: แก้ไขปัญหาเพลงเล่นเองเมื่อโหลดหน้าเว็บครั้งแรก",
            "[Fix] Artist Text Position: จัดตำแหน่งชื่อศิลปินให้ชิดขอบล่างซ้ายเสมอ"
        ]
    },
    {
        version: "2.14.0 (2f010d0)",
        date: "15 ม.ค. 2569",
        changes: [
            "[Mobile] เพิ่มเมนูนำทางด้านล่าง (Bottom Navigation) แบบ Glassmorphism สวยงาม",
            "[Mobile] เพิ่มเมนู 'คิวเพลง' ใน Footer พร้อม Badge แจ้งจำนวนแบบ Real-time",
            "[UX] ปรับปรุงระบบคิวเพลงแบบ Overlay: กดดูคิวได้โดยไม่ขยายจอ Video ใหญ่กวนใจ",
            "[Feature] เพิ่มปุ่ม 'ซ่อน' เครื่องเล่น (Eye Icon) เมื่อต้องการดูเนื้อหาเต็มจอ",
            "[Design] ออกแบบปุ่ม Profile ใหม่แบบ Gradient Ring สวยงามทันสมัย",
            "[Fix] แก้ไขปัญหาส่วนแสดงผลทับซ้อนกันในหน้าจอมือถือ",
            "[Fix] ปรับปรุง Mobile Search ให้สามารถเลื่อนดูเนื้อหาด้านล่างได้ขณะค้นหา",
            "[UX] เพิ่มระบบ Toggle ที่เมนูคิวเพลง: กดซ้ำเพื่อซ่อน/แสดงเครื่องเล่นได้ทันที",
            "[Design] ปรับความกว้างของ Search Bar ให้เท่ากับ Player Card เพื่อความสวยงาม",
            "[Design] Tablet: นำปุ่ม Fullscreen ออกเพื่อลดความซับซ้อนตาม Feedback",
            "[Fix] Tablet: แก้ไขบั๊กคิวเพลงแสดงซ้อนกัน 2 จุดเมื่อหมุนหน้าจอแนวนอน",
            "[Design] ปรับลดความกว้าง Player บน Tablet/PC ให้กระชับ (60%) ไม่บังส่วนอื่น",
            "[UX] นำไอคอน Karaoke/Song หน้าชื่อเพลงออก เพื่อลดความสับสนเรื่องตัดเสียงร้อง",
            "[Layout] ปรับตำแหน่ง Player ให้กึ่งกลางเนื้อหา (Main Content) ไม่ซ้อน Sidebar ด้านข้าง",
            "[UX] เปลี่ยนตัวเลขบอกจำนวนคิว (Right Sidebar) เป็นปุ่ม 'ลบทั้งหมด' เพื่อการใช้งานที่สะดวกขึ้น",
            "[Fix] แก้ไข Application Error (ReferenceError) บนหน้า Tablet",
            "[Fix] แก้ไขระยะห่างด้านบน (Top Spacing) ที่เกิดจากการวางตำแหน่ง Player",
            "[UI] ปรับตำแหน่ง Player แนวตั้งให้ลอยเหนือ Footer พอดี (Tablet Portrait)",
            "[UI] Search Bar & Player Width: ปรับให้เท่ากันเป๊ะ (95%) เพื่อความสมดุล",
            "[UI] Player Position: ลดระดับลงสุดๆ (24px + safe-area) ให้กลืนไปกับ Footer",
            "[UX] Fullscreen: ย้ายปุ่มไปซ่อนใน Video Player (แสดงเมื่อเอาเมาส์ชี้) เพื่อลดความซ้ำซ้อนใน Control Bar",
            "[UX] Search: เพิ่มปุ่ม 'ปิด' (X) ข้างช่องค้นหา เพื่อให้กดปิดได้ง่ายขึ้น",
            "[UI] Queue Toggle: ปรับดีไซน์ปุ่ม 'ซ่อนคิว' เป็นแบบ 'Tab' (ติ่งยื่น) ด้านบนขวา สวยงามและกดง่าย",
            "[UX] EQ Animation: เต้นเฉพาะตอนเล่นเพลงเท่านั้น",
            "[Theme] Search Toggle: เปลี่ยนเป็นสีแดง (Primary)"
        ]
    },
    {
        version: "2.13.0",
        date: "14 ม.ค. 2569",
        changes: [
            "[ระบบหลังบ้าน] ปรับปรุงหน้าระบบจัดการ (Admin Config) ใหม่ ให้ใช้งานง่ายขึ้น",
            "[ฟีเจอร์ใหม่] เพิ่มการตั้งค่า Link สำหรับ 'เงื่อนไขการใช้งาน' และ 'นโยบายความเป็นส่วนตัว' ในหน้า Login",
            "[ฟีเจอร์ใหม่] สามารถใส่ลิงก์ภายนอกให้กับรายการฟีเจอร์ในหน้า Login ได้แล้ว",
            "[UI] ปรับปรุงเมนู Admin ให้เลื่อนตาม (Sticky) เพื่อความสะดวกในการกดบันทึก",
            "[ระบบ] ปรับเลขเวอร์ชันเป็น v2.13.0 เพื่อให้สอดคล้องกับระบบหลักเดิม"
        ]
    },
    {
        version: "2.12.0",
        date: "12 ม.ค. 2569",
        changes: [
            "[ปรับปรุง] รวมการตั้งค่าเนื้อหาหน้า Login เข้ามาอยู่ในส่วนตั้งค่าระบบ",
            "[ภาษา] แปลภาษาเมนูระบบหลังบ้านเป็นภาษาไทยทั้งหมด",
            "[แก้ไข] อัปเดตระบบไอคอนให้ทันสมัยขึ้น (Heroicons v2)",
            "[ประสิทธิภาพ] ปรับปรุงความเร็วในการโหลดหน้า Admin Dashboard"
        ]
    }
];

export default function ChangelogPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans p-6 md:p-12 max-w-3xl mx-auto">
            <Head>
                <title>Changelog - YouOke</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <header className="mb-12 border-b pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Change Log</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-gray-500">บันทึกการเปลี่ยนแปลงของระบบ</p>
                        {process.env.NEXT_PUBLIC_COMMIT_HASH && (
                            <span className="badge badge-sm badge-ghost text-xs font-mono opacity-50">
                                Build: {process.env.NEXT_PUBLIC_COMMIT_HASH}
                            </span>
                        )}
                    </div>
                </div>
                <Link href="/" className="btn btn-ghost btn-sm gap-2">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            <main className="space-y-10">
                {CHANGELOGS.map((log, index) => (
                    <article key={index} className="relative pl-6 border-l-2 border-gray-200">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${index === 0 ? 'bg-black' : 'bg-gray-300'}`}></div>

                        <header className="mb-3">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                v{log.version}
                                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                                    {log.date}
                                </span>
                            </h2>
                        </header>

                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {log.changes.map((change, i) => (
                                <li key={i} className="pl-2">{change}</li>
                            ))}
                        </ul>
                    </article>
                ))}
            </main>

            <footer className="mt-20 pt-6 border-t text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} YouOke. All rights reserved.</p>
            </footer>
        </div>
    );
}
