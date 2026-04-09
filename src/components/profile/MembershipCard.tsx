import { Crown, Zap, Clock, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipCardProps {
    membership: {
        type: string;
        status: string;
        createdAt?: any;
        expiresAt: any;
    };
    role?: string;
    onUpgrade: () => void;
}

export const MembershipCard = ({ membership, role, onUpgrade }: MembershipCardProps) => {

    const safeMembership = membership || { type: 'free', status: 'active', expiresAt: null };

    const formatDate = (date: any) => {
        if (!date) return "ไม่มีวันหมดอายุ";
        try {
            if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
            return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch (e) { return "-"; }
    };

    const isAdmin = role === 'admin' || role === 'owner';
    const isLifetime = safeMembership.type === 'lifetime';
    const isPremium = safeMembership.type !== 'free' || safeMembership.status === 'active' || safeMembership.status === 'trial';

    const getPlanName = () => {
        if (isAdmin) return "ผู้ดูแลระบบ (ADMIN)";
        if (isLifetime) return "ตลอดชีพ (PRO)";
        switch (safeMembership.type) {
            case 'day_pass': return "แพ็กเกจรายวัน";
            case 'yearly': return "พรีเมียมรายปี";
            case 'monthly': return "พรีเมียมรายเดือน";
            case 'trial': return "ทดลองใช้งานฟรี";
            case 'free': return "ใช้งานฟรี";
            default: return "สมาชิกพรีเมียม";
        }
    };

    const planName = getPlanName();

    const config = {
        admin: { color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/10", iconBg: "bg-rose-500" },
        lifetime: { color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10", iconBg: "bg-amber-500" },
        premium: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/10", iconBg: "bg-primary" },
        free: { color: "text-zinc-400", bg: "bg-zinc-50 dark:bg-zinc-900", border: "border-zinc-100 dark:border-zinc-800", iconBg: "bg-zinc-200 dark:bg-zinc-800" },
    };

    let style = config.free;
    if (isAdmin) style = config.admin;
    else if (isLifetime) style = config.lifetime;
    else if (isPremium) style = config.premium;

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            <div className={cn(
                "relative rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 active:scale-[0.98] border shadow-none",
                style.bg, style.border
            )}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white", style.iconBg)}>
                            {isAdmin || isLifetime ? <Crown className="w-5 h-5" /> : (isPremium ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />)}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                {isAdmin ? "ตำแหน่งในระบบ" : "สิทธิ์การใช้งาน"}
                            </div>
                            <h3 className={cn("text-[15px] font-black tracking-tight leading-tight", isAdmin || isPremium ? style.color : "text-zinc-900 dark:text-white")}>
                                {planName}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Action Hint: Only for non-admins */}
                    {!isAdmin && (
                        <div className={cn(
                           "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all",
                            isPremium ? "bg-primary/10 text-primary" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        )}>
                            <span>{isPremium ? "เปลี่ยนแพ็กเกจ" : "อัปเกรด VIP"}</span>
                            <ArrowRight className="w-2.5 h-2.5" strokeWidth={4} />
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 flex justify-between items-center border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col">
                        <div className="text-[8px] uppercase tracking-widest font-black text-zinc-300 dark:text-zinc-700 mb-0.5">
                            {isAdmin ? "ความปลอดภัย" : (isLifetime ? "สิทธิพิเศษ" : "วันหมดอายุ")}
                        </div>
                        <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                             {isAdmin ? "ป้องกันข้อมูลระดับสูง" : (isLifetime ? "สมาชิกถาวร ไม่ติดโฆษณา" : formatDate(safeMembership.expiresAt))}
                        </div>
                    </div>
                    {isAdmin && <Crown className="w-3 h-3 text-rose-500 opacity-20" />}
                </div>
            </div>
        </div>
    );
};
