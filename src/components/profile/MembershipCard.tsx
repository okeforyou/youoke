import { Crown, Zap, Clock, ChevronRight, Sparkles } from "lucide-react";
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
        if (!date) return "ไม่มีกำหนดหมดอายุ";
        try {
            if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
            return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch (e) { return "-"; }
    };

    const getDaysRemaining = () => {
        if (!safeMembership.expiresAt) return null;
        try {
            const now = new Date();
            const expiry = safeMembership.expiresAt.seconds ? new Date(safeMembership.expiresAt.seconds * 1000) : new Date(safeMembership.expiresAt);
            return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } catch (e) { return null; }
    };

    const daysRemaining = getDaysRemaining();
    const isLifetime = safeMembership.type === 'lifetime';
    const isPremium = safeMembership.type !== 'free' || safeMembership.status === 'active' || safeMembership.status === 'trial';
    const isAdmin = role === 'admin' || role === 'owner';

    const getPlanName = () => {
        if (isAdmin) return "ผู้ดูแลระบบ (ADMIN)";
        if (isLifetime || safeMembership.type === 'lifetime') return "ตลอดชีพ (LIFETIME)";
        switch (safeMembership.type) {
            case 'day_pass': return "แพ็กเกจ 1 วัน (DAY PASS)";
            case 'yearly': return "พรีเมียมรายปี (YEARLY)";
            case 'monthly': return "พรีเมียมรายเดือน (MONTHLY)";
            case 'trial': return "ทดลองใช้งานฟรี (FREE TRIAL)";
            case 'free': return "ใช้งานฟรี (FREE)";
            default: return "สมาชิกพรีเมียม";
        }
    };

    const planName = getPlanName();
    const labelMembership = isAdmin ? "สิทธิ์ผู้ดูแลระบบ" : "สิทธิ์การใช้งาน";

    const accents = {
        admin: "bg-rose-500 text-white shadow-sm",
        lifetime: "bg-amber-500 text-white shadow-sm",
        yearly: "bg-purple-600 text-white shadow-sm",
        monthly: "bg-blue-600 text-white shadow-sm",
        free: "bg-slate-100 text-slate-500 shadow-sm",
    };

    let activeAccent = accents.free;
    if (isAdmin) activeAccent = accents.admin;
    else if (isLifetime) activeAccent = accents.lifetime;
    else if (safeMembership.type === 'yearly') activeAccent = accents.yearly;
    else if (safeMembership.type === 'monthly') activeAccent = accents.monthly;

    const isLightBg = !isAdmin && !isLifetime && safeMembership.type !== 'yearly' && safeMembership.type !== 'monthly';

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            <div className={cn(
                "relative rounded-3xl overflow-hidden p-5 flex flex-col justify-between min-h-[110px] transition-all duration-300 active:scale-[0.98] border-none",
                activeAccent
            )}>
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                            isLightBg ? "bg-slate-200 text-slate-500" : "bg-white/20 text-white"
                        )}>
                            {isAdmin || isLifetime ? <Crown className="w-5 h-5" /> : (isPremium ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />)}
                        </div>
                        <div>
                            <div className={cn("text-[9px] font-black uppercase tracking-widest", isLightBg ? "opacity-40" : "opacity-60")}>{labelMembership}</div>
                            <h3 className={cn("text-base font-black tracking-tight mt-0.5 leading-none", isLightBg ? "text-slate-900" : "text-white")}>{planName}</h3>
                        </div>
                    </div>
                </div>


                <div className={cn(
                    "mt-4 pt-3 flex justify-between items-center border-t border-dashed",
                    isLightBg ? "border-slate-200" : "border-white/20",
                    isAdmin && "mt-2"
                )}>
                    <div className="flex flex-col">
                        <div className={cn("text-[8px] uppercase tracking-widest font-black mb-0.5", isLightBg ? "opacity-40" : "opacity-60")}>
                            {isAdmin ? "สถานะการใช้งาน" : (isLifetime ? "ระดับสมาชิก" : "เริ่ม - หมดอายุ")}
                        </div>
                        <div className={cn("text-[11px] font-black tracking-tight", isLightBg ? "text-slate-600" : "text-white/95")}>
                            {isAdmin ? "ผู้ดูแลระบบ YouOke" : (isLifetime ? "สมาชิก ถาวร" : (
                                (safeMembership.expiresAt && safeMembership.type !== 'free')
                                    ? `${formatDate(safeMembership.createdAt)} - ${formatDate(safeMembership.expiresAt)}` 
                                    : "ยังไม่ได้เลือกแพ็กเกจ"
                            ))}
                        </div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4", isLightBg ? "opacity-30" : "opacity-60")} />
                </div>
            </div>
        </div>
    );
};
