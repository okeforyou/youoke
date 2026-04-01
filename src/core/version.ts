/** 
 * YouOKE Dynamic Versioning Engine (v4.2.9)
 * ศูนย์รวมเลขเวอร์ชันของทัังระบบ เพื่อความแม่นยำและไม่ซ้ำซ้อน
 */

export const SYSTEM_VERSION = "4.3.0";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (LINE Full Integration)`;
export const BUILD_DATE = "1 เม.ย. 2569";

// สำหรับการดึง Commit Hash จาก Vercel (ถ้ามี)
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";
