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
        admin: { color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20", iconBg: "bg-rose-600" },
        lifetime: { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", iconBg: "bg-amber-600" },
        premium: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", iconBg: "bg-primary" },
        free: { color: "text-zinc-950", bg: "bg-zinc-100/50 dark:bg-zinc-900", border: "border-zinc-200 dark:border-zinc-800", iconBg: "bg-zinc-800 dark:bg-zinc-700" },
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
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ring-4", style.iconBg, style.bg === "bg-zinc-100/50 dark:bg-zinc-900" ? "ring-zinc-100 dark:ring-zinc-800" : "ring-white/50 dark:ring-black/20")}>
                            {isAdmin || isLifetime ? <Crown className="w-6 h-6" /> : (isPremium ? <Zap className="w-6 h-6" /> : <Clock className="w-6 h-6" />)}
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {isAdmin ? "ตำแหน่งในระบบ" : "สิทธิ์การใช้งาน"}
                            </div>
                            <h3 className={cn("text-lg font-black tracking-tight leading-tight mt-0.5", style.color)}>
                                {planName}
                            </h3>
                        </div>
                    </div>
                    
                    {!isAdmin && (
                        <div className="mt-1 flex flex-col items-center">
                             <div className="w-8 h-8 rounded-full bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
                                <ArrowRight className="w-4 h-4" strokeWidth={4} />
                             </div>
                             <span className="text-[8px] font-black uppercase mt-1 text-zinc-900 dark:text-white">อัปเกรด</span>
                        </div>
                    )}
                </div>

                <div className="mt-5 pt-4 flex justify-between items-center border-t-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col">
                        <div className="text-[10px] uppercase tracking-widest font-black text-zinc-900 dark:text-white mb-0.5">
                            {isAdmin ? "ความปลอดภัย" : (isLifetime ? "สิทธิพิเศษ" : "วันหมดอายุ")}
                        </div>
                        <div className="text-[12px] font-black text-zinc-600 dark:text-zinc-400">
                             {isAdmin ? "ป้องกันข้อมูลระดับสูงสุด" : (isLifetime ? "สมาชิกถาวร ไม่ติดโฆษณา" : formatDate(safeMembership.expiresAt))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
