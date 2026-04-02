/** 
 * YouOKE Dynamic Versioning Engine (v4.2.9)
 * ศูนย์รวมเลขเวอร์ชันของทัังระบบ เพื่อความแม่นยำและไม่ซ้ำซ้อน
 */

export const SYSTEM_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "4.8.2";
export const SYSTEM_CODENAME = "Universal Persistence Achievement";
export const SYSTEM_STATUS = "Stable";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (${SYSTEM_CODENAME})`;
export const BUILD_DATE = "2 เม.ย. 2569";

export const CHANGELOGS = [
    {
        version: "4.8.2 (Universal Persistence Milestone)",
        date: "2 เม.ย. 2569",
        changes: [
            "[Sync] Hybrid Database Persistence: เปิดใช้งานระบบบันทึกข้อมูลขนาน (Firestore + Realtime DB) เพื่อความแม่นยำของสถานะ LINE 100%",
            "[UI/UX] Minimalist Bridge: ดีไซน์ส่วนเชื่อมต่อ LINE แบบ Flat & Clean ลดความรกตา และเน้นความพรีเมียมสไตล์เรียบหรู",
            "[System] Anti-Cache Enforcement: บังคับการดึงข้อมูลโปรไฟล์แบบข้าม Cache ทันทีที่เข้าหน้า Profile เพื่อสถานะที่รวดเร็วที่สุด"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.8.0 (Identity Bridge Milestone)",
        date: "2 เม.ย. 2569",
        changes: [
            "[Sync] Identity Bridge Core: เปิดใช้งานระบบผูกบัญชี LINE Login สากล (Identity Bridge) ที่เสถียรที่สุด ทดแทนระบบ LIFF เก่า",
            "[Sync] Professional Handshake: เพิ่มระบบ State-Mapping เพื่อผูกบัญชี Gmail เดิมเข้ากับ LINE โดยไม่ต้องพิมพ์ข้อความยืนยัน",
            "[Security] 0% Hardcode Policy: กวาดล้างรหัส ID และ URL ที่ฝังในโค้ดออกทัั้งระบบ เพื่อความปลอดภัยสูงสุด",
            "[UI/UX] 404 Recovery: ล้างจุดบอดที่ทำให้สมาชิกเจอหน้า 404 ขณะสแกน และปรับปรุงทัั้งระบบเชื่อมต่อใหม่แบบ 1-Click"
        ]
    },
    {
        version: "4.7.4 (Easy-Connect Milestone)",
        date: "2 เม.ย. 2569",
        changes: [
            "[UX] Zero-Friction Handshake: ตัดรหัส UID ที่ซับซ้อนออกทัั้งหมด สมาชิกกดปุ่มเดียวในหน้าสีเขียวเพื่อเชื่อมต่อ LINE ได้ทันที",
            "[System] Dynamic Origin Deployment: กวาดล้าง Hardcode URL ทัั้งใน Client และ API รองรับการย้าย Domain โดยไม่สะดุด",
            "[Standard] Workflow Hardening: บันทึกกฎเหล็ก 0% Hardcode และ Mandatory Versioning ลงในระบบพัฒนาหลัก",
            "uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://play.okeforyou.com'}/packages`"
        ]
    },
    {
        version: "4.7.0 (Senior-Friendly Integration)",
        date: "1 เม.ย. 2569",
        changes: [
            "[UX] Senior-Friendly Flow: ปรับปรุงขั้นตอนการแจ้งโอนให้ง่ายที่สุด ลดขั้นตอนการกด เพื่อรองรับผู้ใช้งานทุกวัย",
            "[Sync] Bank Info Synchronization: อัปเดตข้อมูลบัญชีธนาคารให้ตรงกับระบบหลังบ้านแบบ Real-time ใน UploadSlipModal",
            "[UI] Clean Flat Design: ปรับปรุงหน้าตา UI ให้มีความเรียบง่าย สบายตา และลดความซับซ้อนของเมนู"
        ]
    },
    {
        version: "4.4.0 (Drawer-First Focus)",
        date: "1 เม.ย. 2569",
        changes: [
            "[UI/UX] Drawer-Only Architecture: ยุบรวมระบบโปรไฟล์ทัังหมดให้จบใน 'Drawer แถบสไลด์ขวา' เพื่อความเรียบง่ายที่สุด",
            "[Localization] Thai-First Interface: ปรับข้อความสื่อสารทัังระบบเป็นภาษาไทย 100% เพื่อความเป็นกันเองและดูง่าย",
            "[Cleanup] Minimalist Recovery: ล้างดีไซน์ส่วนเกินและเมนูซ้ำซ้อนออก เพื่อให้แอปกลับมา 'กระชับ' ตามมาตรฐาน YouOKE"
        ]
    },
    {
        version: "4.3.7 (Iconic Simplicity)",
        date: "1 เม.ย. 2569",
        changes: [
            "[UX] Simple Flow: ยกเลิกการบังคับ Upload สลิปหน้าเว็บเพื่อลดความยุ่งยาก",
            "[Sync] Intent Messaging: ระบบจะแจ้งเตือนเจตนาการซื้อของลูกค้าเข้า LINE แอดมินโดยตรง เพื่อให้รอรับสลิปในแชท",
            "[Admin] One-Click Link: แอดมินเพียงแค่ดูสลิปที่ลูกค้าส่งมาในแชท แล้วกด Link แจ้งเตือนเพื่อทำการอนุมัติในระบบได้ทันที"
        ]
    },
    {
        version: "4.3.2 (LINE Image Evidence)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Messaging] Image Evidence: ระบบยิง 'รูปภาพสลิปจริง' เข้า LINE แอดมินทันทีที่ลูกค้าแจ้งโอน เพื่อการตรวจสอบที่รวดเร็วที่สุด",
            "[Admin] Visual Verification: แอดมินสามารถดูสลิปได้จากแจ้งเตือน LINE โดยไม่ต้องกดเปิดแอป (Zero-Click Visibility)",
            "[Workflow] Optimized Push: แยกข้อความรูปภาพและข้อความรายละเอียดเพื่อให้อ่านง่ายและเป็นระเบียบ"
        ]
    },
    {
        version: "4.3.1 (LINE Master Workflow)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Messaging] Payment Guidance: ระบบส่งข้อมูลเลขบัญชีและยอดโอนให้ลูกค้าผ่าน LINE อัตโนมัติเมื่อกดเลือกแพ็กเกจ",
            "[Workflow] End-to-End Automation: เชื่อมต่อกระบวนการตั้งแต่การเลือกซื้อ -> แจ้งโอน -> อนุมัติ ให้เป็นเนื้อเดียวกันผ่าน LINE",
            "[System] Stability Patch: ปรับปรุงการจัดการ Firebase SDK และ React Hooks เพื่อรองรับการทำงานที่รวดเร็วขึ้น"
        ]
    },
    {
        version: "4.3.0 (LINE Full Integration)",
        date: "1 เม.ย. 2569",
        changes: [
            "[Messaging] LINE Messaging SDK: เปิดใช้งานระบบส่งข้อความ Push Notification แบบ 1-on-1 ผ่าน API (Individual Direct Message)",
            "[Payment] Real-time Admin Alerts: เมื่อลูกค้าแจ้งโอน ระบบจะยิงรายละเอียดสลิปและข้อมูลการโอนเข้า LINE แอดมินทันที",
            "[User] Identity Bridge Connector: เพิ่มหน้าเว็บเชื่อมโยงบัญชี เพื่อให้ความแม่นยำในการระบุตัวตนข้ามแพลตฟอร์ม"
        ]
    }
];

// สำหรับการดึง Commit Hash จาก Vercel (ถ้ามี)
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";
