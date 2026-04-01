/** 
 * YouOKE Dynamic Versioning Engine (v4.2.9)
 * ศูนย์รวมเลขเวอร์ชันของทัังระบบ เพื่อความแม่นยำและไม่ซ้ำซ้อน
 */

export const SYSTEM_VERSION = "4.3.1";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (LINE Master Workflow)`;
export const BUILD_DATE = "1 เม.ย. 2569";

export const CHANGELOGS = [
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
