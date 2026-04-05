import packageInfo from "../../package.json";

export const SYSTEM_VERSION = "4.9.77";
export const SYSTEM_CODENAME = "Total Eclipse";
export const SYSTEM_STATUS = "Stable";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (${SYSTEM_CODENAME})`;
export const BUILD_DATE = "5 เม.ย. 2569";

export const CHANGELOGS = [
    {
        version: "4.9.77 (Full Darkness)",
        date: "5 เม.ย. 2569",
        changes: [
            "[UI] Universal Dark Mode: กวาดล้างจุดสีขาวทัังหมดในแอป (Drawer Header, Footer, Background) ให้เป็นสีมืดสนิท 100%",
            "[UI] Global Style Sync: บังคับสีพื้นหลังระดับ Root ผ่าน global.css เพื่อป้องกันปัญหาสีขาวกระพริบระหว่างโหลด",
            "[System] Component Polish: ปรับจูนสีเส้นขอบ (Borders) ในโหมดมืดให้นุ่มนวลขึ้นสไตล์ Flat Design"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.76 (Hotfix)",
        date: "5 เม.ย. 2569",
        changes: [
            "[Fix] SpotifyDashboard: เพิ่มการ Import ฟังก์ชัน getJooxCharts ที่หายไป แก้ไขปัญหา Client-side Exception (หน้าจอขาว)",
            "[Fix] _app.tsx Stability: ทำความสะอาดไฟล์ root และแก้ไขการเชื่อมต่อ useUIStore ให้กลับมานิ่งสมบูรณ์"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.75 (Dark Mode)",
        date: "5 เม.ย. 2569",
        changes: [
            "[UI] Full Dark Mode: ติดตั้งระบบสลับโหมดมืด (Dark Mode) สมบูรณ์แบบทัังแอป เพื่อความสบายตาในการใช้งานตอนกลางคืน",
            "[UI] Theme Toggle: เพิ่มปุ่มสลับโหมดพระจันทร์/พระอาทิตย์ในหน้าโปรไฟล์ เข้าถึงง่ายและทำงานร่วมกับระบบจดจำ (Persistent Theme)",
            "[System] Auto-Sync: ระบบจะตรวจเช็คธีมจากเครื่องผู้ใช้งานและปรับเปลี่ยนให้อัตโนมัติในครั้งแรกที่เข้าใช้งาน",
            "[Design] Flat Zinc Theme: ใช้ชุดสี Zinc-900 สำหรับโหมดมืด เพื่อความพรีเมียมและนุ่มนวลสูงสุด"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.74 (Sync Patch)",
        date: "5 เม.ย. 2569",
        changes: [
            "[Access] Station Playback: แก้ไขเงื่อนไขการเข้าถึงสถานีเพลงให้เรียบง่ายขึ้น (Login = Play) ช่วยให้ Admin และสมาชิกพรีเมียมเข้าใช้งานได้ปกติ 100%",
            "[UI] Home Cleanup: นำส่วน Package Grid ออกจากหน้าแรกตามหลัก Flat Design เพื่อความสะอาดตาและเป็นมืออาชีพ",
            "[Speed] Chart Performance: เพิ่มระยะเวลา Cache ข้อมูลชาร์ตเพลงเป็น 24 ชม. เพื่อการแสดงผลที่รวดเร็วทันใจ (Instant Display)",
            "[System] Version Lock v4.9.74: ปรับปรุงความเสถียรของระบบสิทธิ์การเข้าถึง"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.73 (Performance L2)",
        date: "5 เม.ย. 2569",
        changes: [
            "[Speed] Smart Memory Caching: เพิ่มระบบจดจำข้อมูลแพ็กเกจในหน่วยความจำ (In-Memory Cache) ทำให้การสลับหน้าโปรไฟล์และหน้า Shop โหลดข้อมูลได้ทันที 0 วินาทีแบบไม่ต้องรอ Loading อีกต่อไป",
            "[Sync] Background Revalidation: ระบบจะยังคงมีการตรวจสอบข้อมูลใหม่จาก Firestore อยู่เบื้องหลังเสมอ เพื่อให้มั่นใจว่าข้อมูลมีความสดใหม่โดยไม่ขัดจังหวะผู้ใช้งาน",
            "[System] Stability Guard: ใช้กลไก Caching แบบปลอดภัยสูงสุด ไม่กระทบ Logic ระบบการเงินหลัก"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.72 (Adaptive Icons)",
        date: "5 เม.ย. 2569",
        changes: [
            "[PWA] Android Icon Fix: แก้ไขปัญหาไอคอนแอปบน Android มีขอบขาว โดยการจัดลำดับ Maskable Icons ใหม่ใน manifest.json ให้ Android สามารถขยายรูปได้เต็มพื้นที่ (Full Bleed)",
            "[Sync] Icon Assets: ซิงค์พาธไอคอน maskable-192 และ maskable-512 ให้ตรงกับระบบ Android Adaptive Icons อัตโนมัติ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.71 (Performance L1)",
        date: "5 เม.ย. 2569",
        changes: [
            "[Speed] Flat Skeleton Loading: เพิ่มระบบ Skeleton UI ในหน้าโปรไฟล์และหน้าเลือกซื้อแพ็กเกจ เพื่อลดอาการ 'หน้าขาว' ตอนรอโหลดข้อมูล ช่วยให้สลับหน้าได้ลื่นไหลทันที",
            "[UX] Minimalist Design: ใช้โทนสี Gray-Zinc และอะนิเมชัน Pulse แบบแบน (Flat) สบายตาแทนการใช้ Loading Spinner แบบดั้งเดิม",
            "[System] Version Sync v4.9.71: เปิดตัวขั้นที่ 1 ของแผนการพัดนาความเร็วระบบ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.70 (Localization Sync)",
        date: "5 เม.ย. 2569",
        changes: [
            "[UI] Shop Badge Localization: ลบข้อความภาษาเกาหลี (추천) ออกจากป้ายยอดนิยมในหน้าเลือกซื้อแพ็กเกจ เพื่อความสวยงานและเป็นไทย 100%",
            "[System] Version Unified Lock: ซิงค์เลขเวอร์ชัน v4.9.70 เพื่อบันทึกการแก้ไขตำแหน่ง UI"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.69 (Global Sync)",
        date: "5 เม.ย. 2569",
        changes: [
            "[Fix] Purchase Shop Visibility: อัปเดตหน้าซื้อแพ็กเกจ (หน้าใหญ่) ให้ซ่อนรายการที่ถูก Disable (isActive: false) ออกอย่างสมบูรณ์แบบเดียวกับหน้าเครื่องคาราโอเกะ",
            "[System] Component Unified Filtering: ยืนยันการใช้ระบบกรองข้อมูลแบบเดียวขัดกันทั้งระบบ เพื่อความแม่นยำ 100% ในการแสดงผลข้อมูลจาก Firestore"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.68 (Database Alignment)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Fix] True Package Hiding: แก้ไขตัวแปรสถานะให้ตรงกับ Database ('isActive' แทน 'active') ทำให้สามารถซ่อนแพ็กเกจที่เกิดจากการกด Disable ที่หน้าบ้านได้อย่างแม่นยำ 100% โดยไม่กระทบรายการอื่น",
            "[System] Component Sync: ประสานงาน Logic ระหว่างหน้า Admin และ PackageStore ให้ใช้ชื่อตัวแปรที่ตรงกันเด๊ะๆ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.67 (Simple Hide)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Fix] Strict Package Filter: บังคับใช้การกรองเฉพาะแพ็กเกจที่ตั้งค่า 'active: true' ใน Firestore เท่านั้น เพื่อซ่อนรายการที่ถูก Disable 100%",
            "[System] Version Lock Sync: ยืนยันการซิงค์เลขเวอร์ชัน v4.9.66 ทั้งระบบ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.65 (Robust Filtering)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Fix] Package Store Engine: เปลี่ยนระบบดึงแพ็กเกจเป็น Client-side Filtering เพื่อแก้ปัญหาฟิลด์ Active ไม่ตรงกันหรือขาดหาย",
            "[Sync] Real-time Visibility: การเปิด/ปิดแพ็กเกจจากหลังบ้านจะสะท้อนผลทันทีและแม่นยำ 100% โดยไม่ติดปัญหา Query Index"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.64 (Visibility Patch)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Fix] Disabled Package Hiding: กู้คืน Logic การกรองสถานะ 'Active' ใน Package Store เพื่อซ่อนแพ็กเกจที่ถูกปิดการใช้งาน (Disable) ออกจากหน้าหลัก",
            "[System] Data Integrity: ปรับจูน Query Firestore ให้มีความแม่นยำตามการตั้งค่าจากแผงควบคุมแอดมิน"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.63 (Membership Unity)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Membership] Package Store Restoration: กู้คืนการแสดงผลแพ็กเกจสมาชิกทั้งหมด (รวมส่วนลดและทดลองใช้ฟรี) ให้กลับมาแสดงผล 100%",
            "[Quota] Global Playback Gatekeeper: บังคับใช้โควตาการเล่นเพลงรายวันในระดับ Store เพื่อป้องกันการข้ามระบบสำหรับ Guest และสมาชิกฟรี",
            "[Gatekeeper] Music Station Restriction: ล็อกระบบสถานีเพลง (Music Station) สำหรับสมาชิกพรีเมียมเท่านั้น พร้อมหน้าจออัปเกรดที่สวยงาม",
            "[UI] Search & Chart Direct Play: ปรับปรุงการกดเล่นเพลงจากหน้าค้นหาและชาร์ตเพลงให้รองรับการตรวจสอบโควตาแบบ Real-time",
            "[UX] Free 1-Day Trial Bridge: ยืนยัน Logic การเปิดใช้งานพรีเมียมฟรี 1 วันสำหรับผู้ใช้ใหม่ ให้ทำงานได้ราบรื่นไร้รอยต่อ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.59 (Emergency Restore Baseline)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Critical] Emergency System Restoration: กู้คืนระบบสู่สถานะเสถียรที่สุด (Hard Reset to v4.9.54) เพื่อแก้ปัญหา Login และสิทธิ์แอดมิน",
            "[Login] Authentication Fix: แก้ไขปัญหาหน้า Login ค้างและขึ้น Error 100% หลังการ Revert",
            "[System] Manual Version Lock: ปรับเลขเวอร์ชันเป็น v4.9.59 แบบแมนนวลเพื่อความชัดเจนและถูกต้องในการแสดงผล",
            "[UI] Dashboard Stability: คืนชีพแผงควบคุมแอดมินแบบดั้งเดิมที่เสถียรและแม่นยำที่สุด"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.54 (Admin BI Harmony)",
        date: "4 เม.ย. 2569",
        changes: [
            "[BI] Dashboard Refinement: ปรับปรุง Stat Card ให้แสดงผลในแถวเดียวแบบไฮเดนซิตี้ (High-Density Row) เพื่อความกระชับ",
            "[Localization] Thai Language Mastery: ปรับระดับสมาชิกและเมนูสถิติให้เป็นภาษาไทย 100% (รายเดือน, รายปี, ตลอดชีพ)",
            "[System] Permanent Version Lock: เปลี่ยนระบบแสดงผลเวอร์ชันให้ผูกกับ package.json อัตโนมัติ เพื่อแก้ปัญหาเลขไม่ตรงถาวร",
            "[User] Membership Guard: สมาชิกเดิม (Legacy) จะยังคงสิทธิการใช้งานได้ปกติแม้ยังไม่ได้ระบุวันหมดอายุ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.43 (Intuitive UI Sync)",
        date: "4 เม.ย. 2569",
        changes: [
            "[UI] Manual Queue Control: ยกเลิกการเปิดคิวเพลงอัตโนมัติเมื่อเพิ่มเพลงแรก เพื่อความเป็นส่วนตัวและลดการรบกวนบนมือถือ",
            "[UX] Seamless Navigation: ผู้ใช้สามารถเลือกเพลงต่อเนื่องได้โดยไม่มีหน้ารายการคิวขึ้นมาบังหน้าจอ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.42 (Search Integrity Update)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Station] De-duplication: เพิ่มระบบกรองวิดีโอซ้ำในผลลัพธ์การค้นหาสถานีเพลง (Music Station) เพื่อคุณภาพคลังเพลงที่ดียิ่งขึ้น",
            "[Search] Optimized Processing: ใช้เทคนิค Map-based Filtering เพื่อจัดการข้อมูลจำนวนมหาศาลได้อย่างรวดเร็วและแม่นยำ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.41 (Infinite Station Expansion)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Station] Infinite Expansion: ปรับปรุงระบบค้นหาสถานีเพลง (Music Station) ให้รองรับการดึงข้อมูลแบบไม่จำกัดหน้า (Infinite Search)",
            "[Station] Content Booster: เพิ่มปุ่ม 'ค้นหาชุดเพลงยาวเพิ่มเติม' เพื่อให้สมาชิกเข้าถึงคลังเพลงรวมยาวได้มากกว่าเดิมหลายเท่าตัว",
            "[Station] UI Optimization: ปรับปรุงตารางแสดงผลสถานีเพลงให้รองรับข้อมูลปริมาณมากได้ไหลลื่นยิ่งขึ้น"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.40 (Cast Resilience Update)",
        date: "4 เม.ย. 2569",
        changes: [
            "[Cast] Session Recovery: เพิ่มระบบกู้คืนการเชื่อมต่อ Chromecast อัตโนมัติเมื่อมือถือตื่นจากโหมดประหยัดพลังงาน (Sleep Mode Recovery)",
            "[Cast] Dynamic Message Sync: ปรับปรุงการส่งข้อมูลคำสั่ง (Control Message) ให้ดึงข้อมูล Session ล่าสุดจาก SDK โดยตรง เพื่อลดปัญหาคำสั่งไม่ทำงานหลังจอดับ",
            "[Cast] Re-handshake Logic: เพิ่มระบบถามสถานะจากทีวีทันทีที่เชื่อมต่อใหม่ เพื่อให้คิวเพลงในมือถือและทีวีตรงกัน 100%"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.34 (Visual Stability Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[UX] Transition Smoothing: นำแอนิเมชันแบบขยาย (Scaling) และการเลื่อน (Sliding) ออกจากการสลับหน้าจอภายในโปรไฟล์ เพื่อความนิ่งและสบายตา",
            "[UI] Snappy Feel: ปรับปรุงความเร็วในการตอบสนอง (Transition Duration) ให้ทันใจสมาชิกมากขึ้น ลดอาการ 'ภาพบวม' ขณะเปลี่ยนหน้า",
            "[Logic] Content Persistence: รักษาความต่อเนื่องของข้อมูลในทุกมุมมอง (Views) ให้มีความเสถียรสูงสุด"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.33 (The Trial Bridge Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Marketing] 1-Day Premium Trial: เพิ่มระบบมอบสิทธิ์ทดลองใช้งานพรีเมียมฟรี 1 วัน (Full Options) เพื่อแก้ปัญหา Guest ติดขัดเรื่องการเล่นเพลงยาวหรือสถานีเพลง",
            "[Navigation] Seamless Back Link: เพิ่มปุ่ม 'กลับสู่หน้าเครื่องคาราโอเกะ' ในหน้าเลือกแพ็กเกจ เพื่อลดขั้นตอนการสลับหน้าและเพิ่มความสะดวกในการใช้งาน",
            "[UI] Trial Hero Spotlight: ออกแบบการ์ดรับสิทธิ์ทดลองใช้แบบ Emerald Gradient ที่โดดเด่นและจูงใจให้กดสมัครมากที่สุด"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.32 (Compact Premium Shop Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[UI/UX] High-Density Layout: ปรับดีไซน์รายการแพ็กเกจให้เป็นแนวราบ (Horizontal) ประหยัดพื้นที่และอ่านง่าย สบายตากว่าเดิม",
            "[Design] Multi-Color Indicators: นำระบบสีระบุตัวตน (Standard Blue, VIP Purple, Premium Gold) กลับมาใช้เพื่อให้สมาชิกแยกแยะประเภทแพ็กเกจได้ทันที",
            "[Visibility] Accessibility Reboot: ปรับปรุงความชัดเจนของปุ่มนำทาง 'ดูฟีเจอร์พรีเมียม' ให้โดดเด่นและอ่านง่ายที่สุด แม้ในหน้าจอที่มีแสงจ้า"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.31 (Integrated Shop Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[UX] Seamless Package Selection: รวมระบบเลือกแพ็กเกจ (Shop) เข้ากับหน้าต่างโปรไฟล์หลัก สมาชิสามารถเลือกสมัครสมาชิกได้ทันทีโดยไม่ต้องโหลดหน้าใหม่",
            "[Navigation] Internal Flow Controller: เพิ่มระบบนำทางย่อยภายในโปรไฟล์ (Profile <-> Shop) พร้อมปุ่มย้อนกลับอัจฉริยะ เพื่อรักษาความต่อเนื่องในการใช้งาน",
            "[UI] Premium Shop Drawer: สไลด์รายการแพ็กเกจแบบพรีเมียมในพื้นที่ Drawer ช่วยลดขั้นตอนการคลิก (Click-to-Buy) และแก้ปัญหาผู้ใช้งานสับสนเมื่อสลับหน้า"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.30 (Mobile Bottom Sheet Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Mobile UX] Bottom Sheet Navigation: เปลี่ยนรูปแบบการแสดงผลโปรไฟล์ในมือถือ จากการเลื่อนข้างเป็นแบบ 'เลื่อนจากล่างขึ้นบน' (Bottom Sheet) ตามมาตรฐานแอป Apple/Spotify",
            "[UI] Grab Handle & Rounded Corners: เพิ่มสัญลักษณ์ขีดเพื่อการปัดปิด และปรับความโค้งมนของมุมด้านบน (Rounded Top) เพื่อความสวยงามพรีเมียม",
            "[Layout] Viewport Optimization: ปรับความสูงของหน้านำทางมือถือให้เหลือพื้นที่ด้านบนเล็กน้อย เพื่อรักษาความต่อเนื่องของแอปเดิม"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.29 (Clean Dashboard Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Admin UI] Modal Layout Refinement: ปรับการแสดงผลหน้าต่างตรวจสอบยอดเงิน โดยซ่อนส่วนรูปภาพสำหรับรายการที่ส่งผ่าน LINE เพื่อลดพื้นที่ว่าง",
            "[Design] Smart Centering: ปรับการ์ดสรุปข้อมูลให้แสดงผลกึ่งกลางหน้าจอ (Minimal Look) เมื่อไม่มีรูปภาพสลิป ช่วยให้แอดมินโฟกัสข้อมูลได้ดีขึ้น",
            "[UX] Proactive Cleanup: ล้างส่วนติดต่อผู้ใช้ (Component) ที่ซ้ำซ้อนออก เพื่อความรวดเร็วในการโหลดหน้า Dashboard"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.28 (Full Flex Premium Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[UX/UI] Premium Flex Cards: อัปเกรดการแจ้งเตือนเป็นแบบการ์ด (Flex Message) ทั้งฝั่งแอดมินและสมาชิก ให้ความรู้สึกพรีเมียมระดับสากล",
            "[Payment] QR Direct Image: ฝังรูป QR Code PromptPay ลงในบัตรแจ้งหนี้สมาชิกโดยตรง เพื่อให้แคปหน้าจอไปโอนเงินได้ทันที",
            "[System] Tracking Reference: เพิ่มรหัสอ้างอิงชำระเงิน (REF ID) 8 หลัก เพื่อความแม่นยำในการตรวจสอบรายการสั่งซื้อ",
            "[Stability] ID Integration: เชื่อมโยงรหัส Admin LINE ID และ Magic Link เข้ากับระบบการ์ดแบบไร้รอยต่อ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.27 (Admin ID Verification Patch)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Notification] Admin ID Sync: อัปเดตรหัส LINE Admin ID ให้ตรงกับค่าจริงที่ยืนยันจากหน้า Developers Console (Ub8ea2b...)",
            "[Fix] Route Directing: ปรับปรุง Magic Link ในการแจ้งเตือนแอดมินให้ชี้ไปยังหน้าจัดการผู้ใช้ที่ถูกต้องพร้อมข้อมูลเบื้องต้น",
            "[Stability] ID Integrity: ล้างข้อมูล Hardcode เก่าที่อาจทำให้การแจ้งเตือนส่งไม่ถึงมือแอดมินตัวจริง"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.26 (Independent Notification Patch)",
        date: "3 เม.ย. 2569",
        changes: [
            "[System] Notification Isolation: แยก Try-Catch ของการแจ้งเตือน Admin และ User ออกจากกัน เพื่อป้องกันความผิดพลาดแบบ Domino Effect",
            "[Stability] Fail-Safe Flow: เพิ่มระบบสำรองข้อมูลให้ชัวร์ว่าถึงแม้ LINE API ฝั่งใดฝั่งหนึ่งขัดข้อง แต่อีกฝั่งหนึ่งจะยังได้รับข้อความและบันทึกลงระบบปกติ",
            "[Fix] Messaging Logic: ปรับปรุงการส่งข้อความสรุปยอด (Bill Summary) ให้แม่นยำขึ้นสำหรับระบบพร้อมเพย์ใหม่"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.25 (PromptPay Details Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Payment] Update Provider: เปลี่ยนช่องทางการรับชำระเงินหลักเป็นบัญชีพร้อมเพย์ (PromptPay) หมายเลข 0864653950 อย่างเป็นทางการ",
            "[UX] Easy Copy: ปรับปรุงปุ่มคัดลอกให้คัดลอกเลขพร้อมเพย์ได้อย่างถูกต้องและรวดเร็ว",
            "[System] Type Debt Clear: แก้ไขโครงสร้าง Type ของ Payment ให้รองรับ LINE Direct Model อย่างสมบูรณ์ ไร้บั๊กแอบแฝง"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.24 (Backend & QR Stability Patch)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Admin] Data Visibility Fix: ปรับปรุงระบบหลังบ้านให้แสดงรายการสั่งซื้อแบบ LINE Manual ได้อย่างถูกต้อง พร้อมไอคอนแจ้งเตือนชัดเจน",
            "[Fix] QR Imaging: ปรับปรุง Logic การแสดงผลรูปภาพ QR PromptPay ให้เสถียร 100% แม้การตั้งค่า Config จะเป็นค่าว่าง (Empty String)",
            "[UX] Backend Feedback: เพิ่มข้อความแนะนำในหน้าตรวจสอบสลิปสำหรับรายการที่ส่งผ่าน LINE เพื่อให้แอดมินทำงานง่ายขึ้น"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.23 (LINE-Centric Payment Experience)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Payment] LINE-Only Flow: ตัดระบบอัปโหลดสลิปหน้าเว็บออก เพื่อความง่ายและลดความสับสน สมาชิกจะแจ้งโอนผ่าน LINE 100%",
            "[UX] Instant Billing: เมื่อกดสมัคร สมาชิกจะได้รับรายละเอียดเลขบัญชีและยอดโอนเข้า LINE ส่วนตัวทันทีโดยอัตโนมัติ",
            "[Admin] Instant Dual Alert: แก้ไขระบบแจ้งเตือนแอดมินให้ทำงานทันทีผ่าน LINE เมื่อมีการกดสั่งซื้อ (Lead) เพื่อแก้ปัญหาแจ้งเตือนล่าช้า",
            "[Fix] QR Code Visibility: ปรับปรุง Logic การดึงรูปภาพ QR PromptPay ให้เสถียรขึ้น (Fallback to Local)"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.22 (Stealth Frame Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Profile] Stealth Frame Logic: เปลี่ยนพื้นหลังไอคอน (Icon Frame) เป็นสีดำกึ่งโปร่งแสงเมื่อยังไม่เชื่อมต่อ เพื่อสร้างมิติและความลึกของสถานะ 'Inactive'",
            "[UI] Balanced Contrast: คืนค่าไอคอน LINE เป็นสีขาวเพื่อให้ตัดกับกรอบสีดำ บ่งบอกถึงศักยภาพที่พร้อมจะเชื่อมต่อ",
            "[System] Version Integrity: ยืนยันความเสถียรของระบบ Version Sync จาก package.json"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.21 (Stealth Indicator Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Profile] Stealth Icon Logic: เปลี่ยนไอคอน LINE เป็นสีดำเข้ม (Zinc-900) เมื่อยังไม่เชื่อมต่อ เพื่อแสดงสถานะ 'Inactive' ให้ชัดเจนขึ้น",
            "[UX] High-Contrast Pulse: ปรับเพิ่มความสว่างของจุดกะพริบ (White Pulse) ให้เด่นชัดบนพื้นไอคอนสีดำ เพื่อเรียกความสนใจอย่างพรีเมียม",
            "[Layout] Text Alignment: ปรับจูนระยะข้อความ 'ศูนย์รวมข่าวสาร' ให้สมดุลกับ Card ทั้งระบบ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.20 (Indicator Dot Clarity Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Profile] Actionless UI: ถอดป้ายกำกับ [ACTION] ที่รกตาออก เพื่อความคลีนสูงสุดตามคำแนะนำของแอดมิน",
            "[UX] Pulse Indicator System: เปลี่ยนมาใช้ระบบ 'จุดไฟสถานะ' (Indicator Dot) ที่กะพริบแจ้งเตือนเหนือไอคอน LINE แทนการใช้ตัวอักษร",
            "[Layout] Text Fit Optimization: ปรับปรุงขนาดปุ่มและตัวหนังสือให้พอดีกับหน้าจอ ไม่ล้นขอบ และดูสมมาตร 100%"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.19 (Solid Green Clarity Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Profile] Solid Green Branding: ปรับชุดสี Card LINE ให้เป็นสีเขียวมาตรฐาน (#06C755) ทั้งกรณีที่เชื่อมต่อแล้วและยังไม่เชื่อม เพื่อความมั่นคงของแบรนด์",
            "[UX] High-Contrast Badges: เพิ่มระบบป้ายกำกับ [SUCCESS] และ [ACTION] ที่ชัดเจน พร้อมระบบ Pulsing แจ้งเตือนจุดที่ต้องดำเนินการ เพื่อแก้ปัญหาความสับสนของสมาชิก"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.17 (Premium UI Alignment)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Profile] Card Alignment: ปรับขนาดความกว้าง (Width), ความโค้ง (Border Radius), และ Padding ของ Card สมาชิกและ Card LINE ให้เท่ากันเป๊ะเพื่อความสมมาตร",
            "[System] Version Lock: แก้ไขปัญหาตัวเลขเวอร์ชันค้าง โดยการล็อกการดึงข้อมูลจาก package.json เป็นหลัก"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.11 (Payment Flow Optimization)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Admin] Real-time Lead Notification: แจ้งเตือนแอดมินทันทีที่ลูกค้าเปิดดูยอดโอน เพื่อให้เตรียมอนุมัติได้ทันท่วงที",
            "[Admin] Smart Approval Link: ปรับปรุงข้อความแจ้งโอนให้มีลิงก์ทางลัดที่อนุมัติได้ง่ายขึ้นจากมือถือ",
            "[User] Interactive Experience: เพิ่มการส่งรายละเอียดการโอนเข้า LINE อัตโนมัติ และข้อความขอบคุณหลังจากได้รับสลิป"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.10 (Clarity Update)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Admin] Dashboard Intelligence: ปรับให้รายชื่อแขก (Guest) ซ่อนเป็นค่าเริ่มต้น และเพิ่ม LINE Linked Badge ให้เห็นชัดเจนในตาราง",
            "[User] Identity Branding: ปรับดีไซน์ส่วนเชื่อมต่อ LINE ในหน้าโปรไฟล์ให้เป็น Flat & Premium แสดงสถานะสีเขียวเรืองแสง"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.8 (Live Messaging)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Admin] Live Messaging: เปิดใช้งานปุ่มส่งข้อความ LINE รายบุคคลในหน้าจัดการสมาชิก (Surgical Fix)",
            "[System] UI Sync: อัปเดต UI ของ Modal ให้ส่งข้อมูลไปยัง API line-push ได้จริง"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.6 (Force Handshake)",
        date: "3 เม.ย. 2569",
        changes: [
            "[Messaging] Force Bot Prompt: บังคับส่ง parameter &bot_prompt=aggressive ผ่านโค้ด เพื่อความชัวร์ในการเชื่อมต่อกับ LINE@"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.4 (LINE Handshake)",
        date: "2 เม.ย. 2569",
        changes: [
            "[Messaging] Welcome Handshake: ระบบจะส่งข้อความต้อนรับและยืนยันการผูกบัญชีเข้า LINE อัตโนมัติทันทีที่ผู้ใช้ผูกบัญชีสำเร็จ"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.2 (LINE Smart Pulse)",
        date: "2 เม.ย. 2569",
        changes: [
            "[Admin] Smart Assignment Notify: ระบบส่ง LINE แจ้งเตือนลูกค้าอัตโนมัติทันที เมื่อแอดมินกดต่ออายุหรือปลดล็อกตลอดชีพจากหน้า Dashboard",
            "[UX] Instant Confirmation: เพิ่มปุ่มทางลัดเข้าแอปในข้อความแจ้งเตือน เพื่อให้ลูกค้าใช้งานต่อได้ทันที"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.1 (LINE Direct Gateway)",
        date: "2 เม.ย. 2569",
        changes: [
            "[Messaging] Line Exclusivity: สลับระบบทั้งหมดไปใช้ LINE เป็นช่องทางส่งข้อความส่วนตัว (ซ่อน OneSignal ไว้ในเบื้องหลัง)",
            "[System] Cron Automation: เปิดใช้งานระบบตั้งเวลาใน Vercel ให้ตรวจสอบและแจ้งเตือนวันหมดอายุอัตโนมัติ (9 โมงเช้าทุกวัน)",
            "[UX] Quick Access Button: เพิ่มปุ่ม 'เข้าสู่แอป YouOKE' ในบับเบิ้ล LINE เมื่อการอนุมัติพรีเมียมเสร็จสิ้น"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.9.0 (LINE Messaging Bridge)",
        date: "2 เม.ย. 2569",
        changes: [
            "[Messaging] LINE Private Push: แอดมินส่งข้อความ LINE ส่วนตัวหาสมาชิกที่ผูกบัญชีแล้วได้โดยตรงจากหน้าจัดการ",
            "[System] Smart Expiry Notify: แจ้งเตือนหมดอายุเข้า LINE ของสมาชิกทุกคนที่ผูกบัญชีแล้ว (ไม่จำกัดวิธีล็อกอิน)",
            "[System] Payment Approval Notify: แจ้งอนุมัติพรีเมียมเข้า LINE อัตโนมัติสำหรับทุกคนที่ผูกบัญชี",
            "[Admin] LINE Badge: แสดงไอคอน LINE สีเขียวในรายชื่อสมาชิกเพื่อให้แอดมินเห็นว่าใครส่งได้"
        ]
    },
    {
        version: "4.8.7 (Compact Status Achievement)",
        date: "2 เม.ย. 2569",
        changes: [
            "[UI/UX] Compact Status Master Plan: ปรับขนาดปุ่มให้กะทัดรัด (Py-2.5) เพื่อลดความหนาแน่นของหน้าจอ",
            "[UI/UX] Color as Status: คืนค่าสีพื้นหลัง 'เขียวมรกต' ให้กับสถานะเชื่อมต่อแล้ว เพื่อความชัดเจนในการสื่อสารสูงสุด",
            "[UI/UX] Neutral Minimalism: ใช้สี Slate/Black สำหรับปุ่มที่ยังไม่เชื่อมต่อ เพื่อคงความเรียบง่ายตามคอนเซปต์ YouOKE"
        ],
        recent_updates: process.env.NEXT_PUBLIC_LATEST_UPDATES || ""
    },
    {
        version: "4.8.6 (Flat Aesthetic Achievement)",
        date: "2 เม.ย. 2569",
        changes: [
            "[UI/UX] Flat Aesthetic Mastery: ปรับโฉมปุ่มสถานะ LINE ให้เป็นแบบ Flat Design (ขาวสะอ้าน/เส้นขอบบาง) เพื่อความเป็นพรีเมียม",
            "[UI/UX] UI Softening: แก้ไขความเเข็งกระด้างของส่วนต่อประสาน ลดเงาที่ไม่จำเป็นออกเพื่อให้ดูนิ่งและสะอาดตาขึ้น"
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
