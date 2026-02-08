import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, User, LogOut, Settings, Bell } from "lucide-react";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import BottomNavigation from "../components/BottomNavigation";
import { MembershipCard } from "../components/profile/MembershipCard";
import { PackageStore } from "../components/profile/PackageStore";
import { NotificationList } from "../components/profile/NotificationList";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuthStore();
  const packageSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleScrollToPackages = () => {
    packageSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24 font-sans text-foreground">
      <Head>
        <title>โปรไฟล์ - YouOke</title>
      </Head>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between lg:hidden">
        <h1 className="text-lg font-bold text-foreground">โปรไฟล์ของฉัน</h1>
      </div>

      <main className="p-4 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Profile & Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-8 text-center">
              <div className="relative mx-auto mb-4 w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-muted text-2xl font-bold ring-4 ring-card">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="rounded-full w-full h-full object-cover" />
                  ) : (
                    user.displayName?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground">{user.displayName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>

              <div className="my-6 border-t border-border"></div>

              <div className="space-y-3">
                <button className="inline-flex items-center justify-start w-full whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
                  <Settings className="w-4 h-4" /> ตั้งค่าบัญชี
                </button>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center justify-start w-full whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-10 px-4 py-2 gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" /> ออกจากระบบ
                </button>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="rounded-xl border border-border bg-card shadow-sm p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
                <Bell className="w-5 h-5 text-primary" />
                การแจ้งเตือนล่าสุด
              </h3>
              <NotificationList />
            </div>
          </div>

          {/* Right Column: Membership & Store */}
          <div className="lg:col-span-8 space-y-8">
            {/* Membership Status */}
            <section>
              <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                ข้อมูลสมาชิก
              </h3>
              <MembershipCard
                membership={user.membership || { type: 'free', status: 'active', expiresAt: null }}
                onUpgrade={handleScrollToPackages}
              />
            </section>

            <div className="divider"></div>

            {/* Package Store */}
            <section ref={packageSectionRef} className="scroll-mt-20">
              <PackageStore />
            </section>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
