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
        admin: { color: "text-rose-600", bg: "bg-rose-500/5", border: "border-rose-500/10", iconBg: "bg-rose-600" },
        lifetime: { color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/10", iconBg: "bg-amber-600" },
        premium: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/10", iconBg: "bg-primary" },
        free: { color: "text-zinc-950", bg: "bg-zinc-50 dark:bg-zinc-900/50", border: "border-zinc-200 dark:border-zinc-800", iconBg: "bg-zinc-800 dark:bg-zinc-700" },
    };

    let style = config.free;
    if (isAdmin) style = config.admin;
    else if (isLifetime) style = config.lifetime;
    else if (isPremium) style = config.premium;

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            <div className={cn(
                "relative rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 active:scale-[0.98] border shadow-none",
                style.bg, style.border
            )}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {/* Compact Icon */}
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-zinc-800", style.iconBg)}>
                            {isAdmin || isLifetime ? <Crown className="w-5 h-5" /> : (isPremium ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />)}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {isAdmin ? "ตำแหน่งในระบบ" : "สิทธิ์การใช้งาน"}
                            </div>
                            <h3 className={cn("text-base font-black tracking-tight leading-tight", style.color)}>
                                {planName}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Colored Action Button */}
                    {!isAdmin && (
                        <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                             <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg",
                                isPremium ? "bg-amber-500 shadow-amber-500/20" : "bg-primary shadow-primary/20"
                             )}>
                                <ArrowRight className="w-4 h-4" strokeWidth={4} />
                             </div>
                             <span className={cn("text-[8px] font-black uppercase", isPremium ? "text-amber-600" : "text-primary")}>
                                {isPremium ? "จัดการ" : "อัปเกรด"}
                             </span>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-3 flex justify-between items-center border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col">
                        <div className="text-[9px] uppercase tracking-widest font-black text-zinc-950 dark:text-white mb-0.5">
                            {isAdmin ? "ความปลอดภัย" : (isLifetime ? "สิทธิพิเศษ" : "วันหมดอายุ")}
                        </div>
                        <div className="text-[11px] font-black text-zinc-500 dark:text-zinc-400">
                             {isAdmin ? "ป้องกันข้อมูลระดับสูง" : (isLifetime ? "สมาชิกถาวร ไม่ติดโฆษณา" : formatDate(safeMembership.expiresAt))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
