import { useRef } from "react";
import { Settings, LogOut, Bell, ChevronRight, HelpCircle, Shield, FileText } from "lucide-react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { MembershipCard } from "./MembershipCard";
import { PackageStore } from "./PackageStore";
import { ProfileHero } from "./ProfileHero";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils";

// Reusable Settings Row Component
const SettingsRow = ({ icon: Icon, label, onClick, className, destructive = false }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group",
            className
        )}
    >
        <div className="flex items-center gap-4">
            <div className={cn("p-2 rounded-lg bg-muted group-hover:bg-background transition-colors", destructive ? "text-destructive bg-destructive/10" : "text-primary")}>
                <Icon className="w-5 h-5" />
            </div>
            <span className={cn("font-medium", destructive ? "text-destructive" : "text-foreground")}>{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:translate-x-1 transition-transform" />
    </button>
);

export const ProfileContent = () => {
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const { setProfileOpen, showConfirm } = useUIStore();
    const packageSectionRef = useRef<HTMLDivElement>(null);

    const handleScrollToPackages = () => {
        packageSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLogout = () => {
        showConfirm({
            title: 'ออกจากระบบ',
            message: 'คุณต้องการออกจากระบบใช่หรือไม่? คุณจะยังสามารถฟังเพลงฟรีได้ตามโควต้าที่มี',
            confirmText: 'ออกจากระบบ',
            cancelText: 'ยกเลิก',
            type: 'danger',
            onConfirm: async () => {
                setProfileOpen(false);
                await signOut();
                router.push('/login');
            }
        });
    };

    if (!user) return null;

    const isPremium = user.membership?.type !== 'free';

    return (
        <div className="w-full min-h-full bg-background animate-in fade-in duration-300 pb-24">
            {/* Centered Container - Wider for Grid */}
            <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                    {/* Left Column: Identity & Settings (Sticky on Desktop) */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                        <ProfileHero user={user} isPremium={isPremium} role={user.role} />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground px-1 flex items-center gap-2 uppercase tracking-wider">
                                ⚙️ ตั้งค่าบัญชี
                            </h3>
                            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border/50">
                                <SettingsRow icon={Settings} label="ตั้งค่าทั่วไป" />
                                <SettingsRow icon={Bell} label="การแจ้งเตือน" />
                                <SettingsRow icon={HelpCircle} label="ช่วยเหลือ & สนับสนุน" />
                                <SettingsRow icon={FileText} label="เงื่อนไขการใช้งาน" />
                                <SettingsRow icon={Shield} label="นโยบายความเป็นส่วนตัว" />
                                <SettingsRow icon={LogOut} label="ออกจากระบบ" destructive onClick={handleLogout} />
                            </div>
                        </div>

                        <div className="text-center py-4 lg:hidden">
                            <p className="text-xs text-muted-foreground font-mono">YouOke v2.0.0</p>
                        </div>
                    </div>

                    {/* Right Column: Commercial & Status */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Membership Card */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground px-1 flex items-center gap-2 uppercase tracking-wider">
                                💳 สถานะสมาชิก
                            </h3>
                            <MembershipCard
                                membership={user.membership || { type: 'free', status: 'active', expiresAt: null }}
                                role={user.role}
                                onUpgrade={handleScrollToPackages}
                            />
                        </div>

                        {/* Package Store */}
                        <section ref={packageSectionRef} className="scroll-mt-24 space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground px-1 flex items-center gap-2 uppercase tracking-wider">
                                🛍️ แพ็กเกจแนะนำ
                            </h3>
                            <PackageStore />
                        </section>

                        <div className="text-center py-4 hidden lg:block">
                            <p className="text-xs text-muted-foreground font-mono opacity-50">YouOke v2.0.0 (Build 2026)</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
