/** 
 * YouOKE Dynamic Versioning Engine (v4.2.9)
 * ศูนย์รวมเลขเวอร์ชันของทัังระบบ เพื่อความแม่นยำและไม่ซ้ำซ้อน
 */

export const SYSTEM_VERSION = "4.4.0";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (Drawer-First Focus)`;
export const BUILD_DATE = "1 เม.ย. 2569";

export const CHANGELOGS = [
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
    }
];

// สำหรับการดึง Commit Hash จาก Vercel (ถ้ามี)
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";
