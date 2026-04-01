import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ProfileDrawer from "@/components/profile/ProfileDrawer";
import { SYSTEM_VERSION } from "@/core/version";

/**
 * Account Redirect Page (v4.4.0 Drawer-First Focus)
 * ทำหน้าที่เป็นหน้าทางผ่านเพื่อเปิด Profile Drawer ทันที เพื่อความคงเส้นคงวาของระบบ
 */
export default function ProfilePage() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // เมื่อปิด Drawer ให้ย้อนกลับไปหน้า Dashboard หลักทันที
  const handleClose = () => {
    setIsDrawerOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col pt-[20vh] items-center px-4">
      <Head>
        <title>Account Settings - YouOKE v{SYSTEM_VERSION}</title>
      </Head>

      {/* Profile Drawer ที่เป็นหัวใจหลักตัวเดียวของระบบ */}
      <ProfileDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleClose} 
      />

      {/* Loading Placeholder ระหว่างที่หน้า Dashboard จริงกำลังทำงานข้างหลัง */}
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 bg-primary/10 rounded-[24px] mx-auto mb-4 flex items-center justify-center text-primary">
            <span className="loading loading-spinner text-primary"></span>
        </div>
        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] dark:text-zinc-600">
            YouOKE Identity System
        </p>
      </div>
    </div>
  );
}
