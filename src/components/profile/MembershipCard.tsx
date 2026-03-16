import { Crown, Zap, Clock, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembershipCardProps {
    membership: {
        type: string;
        status: string;
        expiresAt: any;
        quota?: {
            used: number;
            daily_limit: number;
        }
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
    const isTrial = safeMembership.status === 'trial' || safeMembership.type === 'trial' || (safeMembership.type === 'free' && safeMembership.status === 'active');
    const hasActivePlan = safeMembership.type !== 'free' || safeMembership.status === 'active' || safeMembership.status === 'trial'; 
    const isPremium = hasActivePlan;
    const isExpired = !isLifetime && daysRemaining !== null && daysRemaining < 0;
    const isAdmin = role === 'admin' || role === 'owner';

    // 🏷️ Display Logic
    const getPlanName = () => {
        if (isAdmin) return "ผู้ดูแลระบบ (ADMIN)";
        if (isLifetime) return "พรีเมียมตลอดชีพ (LIFETIME)";
        if (!isPremium && safeMembership.status !== 'active' && safeMembership.status !== 'trial') return "ยังไม่ได้เลือกแพ็กเกจ";
        
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

    // 🎨 Color Palette (Matched to PackageStore)
    const colors = {
        admin: "bg-rose-600",
        lifetime: "bg-amber-500",
        yearly: "bg-purple-600",
        monthly: "bg-blue-600",
        free: "bg-slate-500",
        none: "bg-zinc-800"
    };

    let activeColor = colors.none;
    if (isAdmin) activeColor = colors.admin;
    else if (isLifetime) activeColor = colors.lifetime;
    else if (safeMembership.type === 'yearly') activeColor = colors.yearly;
    else if (safeMembership.type === 'monthly') activeColor = colors.monthly;
    else if (isPremium) activeColor = colors.free;

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            {/* Flat Card Content */}
            <div className={cn(
                "relative rounded-2xl overflow-hidden shadow-xl p-4 flex flex-col justify-between min-h-[140px] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-primary/20",
                activeColor,
                "text-white border border-white/10"
            )}>
                {/* Subtle Grain Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md shadow-inner">
                            {isAdmin ? <Crown className="w-5 h-5" /> : (isLifetime ? <Crown className="w-5 h-5" /> : (isPremium ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />))}
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                                {labelMembership}
                            </div>
                            <h3 className="text-base font-black tracking-tight mt-0.5">
                                {planName}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Footer Center Section (Quota) */}
                <div className="relative z-10 mt-4 mb-2">
                    {!isAdmin && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] uppercase font-black tracking-widest text-white/60">โควต้าเพลงวันนี้</span>
                                <span className="text-[10px] font-black">
                                    {membership?.quota?.daily_limit === 0 || isLifetime 
                                        ? "ไม่จำกัด" 
                                        : `${membership?.quota?.used || 0} / ${membership?.quota?.daily_limit || 0}`
                                    }
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden p-[1px]">
                                <div 
                                    className="h-full rounded-full bg-white transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    style={{ 
                                        width: (membership?.quota?.daily_limit === 0 || isLifetime) 
                                            ? '100%' 
                                            : `${Math.min(((membership?.quota?.used || 0) / (membership?.quota?.daily_limit || 1)) * 100, 100)}%` 
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="text-[9px] uppercase tracking-widest font-black text-white/50 mb-0.5">วันหมดอายุ</div>
                        <div className="text-xs font-black tracking-tight">
                            {isAdmin ? "สิทธิ์เจ้าของระบบ" : (isLifetime ? "ใช้งานได้ตลอดชีพ" : (safeMembership.expiresAt ? formatDate(safeMembership.expiresAt) : "กรุณาเลือกแพ็กเกจ"))}
                        </div>
                    </div>
                    
                    {!isAdmin && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl backdrop-blur-md",
                            isPremium
                                ? "bg-white/90 text-zinc-900 hover:bg-white"
                                : "bg-zinc-900/40 text-white hover:bg-zinc-900/60 ring-1 ring-white/20 animate-pulse"
                        )}>
                            {isExpired ? "ต่ออายุ" : (hasActivePlan ? "อัปเกรด" : "เลือกแพ็กเกจ")} <ChevronRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
