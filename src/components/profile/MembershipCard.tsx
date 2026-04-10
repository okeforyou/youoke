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
            if (typeof date === 'string') return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
            if (date.toDate) return date.toDate().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
            if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
            return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch (e) { return "-"; }
    };

    const isAdmin = role === 'admin' || role === 'owner';
    const isLifetime = safeMembership.type === 'lifetime';
    const isTrial = safeMembership.type === 'trial';
    const isPremium = safeMembership.type !== 'free' || safeMembership.status === 'active' || safeMembership.status === 'trial';

    const getPlanName = () => {
        if (isAdmin) return "ผู้ดูแลระบบ (ADMIN)";
        if (isLifetime) return "ตลอดชีพ (PRO)";
        switch (safeMembership.type) {
            case 'day_pass': return "สมาชิกรายวัน";
            case 'yearly': return "สมาชิกรายปี";
            case 'monthly': return "สมาชิกรายเดือน";
            case 'trial': return "ได้รับสิทธิ์ใช้งานฟรี 1 วัน";
            case 'free': return "ใช้งานฟรี";
            default: return "สมาชิกพรีเมียม";
        }
    };

    const planName = getPlanName();

    const config = {
        admin: { color: "text-rose-600", bg: "bg-rose-500/5", border: "border-rose-500/20", iconBg: "bg-rose-600", iconColor: "text-white" },
        lifetime: { color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/20", iconBg: "bg-amber-600", iconColor: "text-white" },
        premium: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", iconBg: "bg-primary", iconColor: "text-white" },
        trial: { color: "text-red-600", bg: "bg-red-500/5", border: "border-red-500/20", iconBg: "bg-red-600", iconColor: "text-white" },
        free: { color: "text-zinc-950", bg: "bg-zinc-50 dark:bg-zinc-900/50", border: "border-zinc-200 dark:border-zinc-800", iconBg: "bg-zinc-100 dark:bg-zinc-800", iconColor: "text-zinc-950" },
    };

    let style = config.free;
    if (isAdmin) style = config.admin;
    else if (isLifetime) style = config.lifetime;
    else if (isTrial) style = config.trial;
    else if (isPremium) style = config.premium;

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            <div className={cn(
                "relative rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 active:scale-[0.98] border shadow-none",
                style.bg, style.border
            )}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Ultra Compact Icon */}
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-none border border-zinc-200 dark:border-zinc-800", style.iconBg)}>
                            {isAdmin || isLifetime ? (
                                <Crown className={cn("w-5 h-5", style.iconColor)} />
                            ) : (
                                isPremium ? <Zap className={cn("w-5 h-5", style.iconColor)} /> : <Clock className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {isAdmin ? "ตำแหน่ง" : "สิทธิ์เข้าใช้งาน"}
                            </div>
                            <h3 className={cn("text-sm font-black tracking-tight leading-none", style.color)}>
                                {planName}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Action Hint */}
                    {!isAdmin && (
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[9px] font-black uppercase", isPremium ? "text-amber-500" : "text-primary")}>
                                {isPremium ? "จัดการ" : "อัปเกรด"}
                            </span>
                             <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-white",
                                isPremium ? "bg-amber-500" : "bg-primary"
                             )}>
                                <ArrowRight className="w-4 h-4" strokeWidth={3} />
                             </div>
                        </div>
                    )}
                </div>

                <div className="mt-2.5 pt-2 flex justify-between items-center border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {isAdmin ? "ADMIN PRIVILEGE" : (isLifetime ? "PREMIUM FOREVER" : `หมดอายุ: ${formatDate(safeMembership.expiresAt)}`)}
                    </div>
                </div>
            </div>
        </div>
    );
};
