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
    const isPremium = safeMembership.type !== 'free' || safeMembership.status === 'active' || safeMembership.status === 'trial';
    const isAdmin = role === 'admin' || role === 'owner';

    const getPlanName = () => {
        if (isAdmin) return "ผู้ดูแลระบบ (ADMIN)";
        if (isLifetime) return "พรีเมียมตลาดชีพ (LIFETIME)";
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
        admin: "border-rose-500 text-rose-500 bg-rose-50/30",
        lifetime: "border-amber-500 text-amber-500 bg-amber-50/30",
        yearly: "border-purple-500 text-purple-500 bg-purple-50/30",
        monthly: "border-blue-500 text-blue-500 bg-blue-50/30",
        free: "border-slate-200 text-slate-400 bg-slate-50/10",
    };

    let activeAccent = accents.free;
    if (isAdmin) activeAccent = accents.admin;
    else if (isLifetime) activeAccent = accents.lifetime;
    else if (safeMembership.type === 'yearly') activeAccent = accents.yearly;
    else if (safeMembership.type === 'monthly') activeAccent = accents.monthly;

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            <div className={cn(
                "relative rounded-[32px] overflow-hidden border p-6 flex flex-col justify-between min-h-[140px] transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1 bg-white dark:bg-zinc-950",
                activeAccent
            )}>
                {/* Visual Accent Top Line */}
                <div className={cn("absolute top-0 left-8 right-8 h-1 rounded-b-full opacity-40", 
                    isAdmin ? "bg-rose-500" : (isPremium ? "bg-primary" : "bg-slate-200")
                )}></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", 
                            isAdmin ? "bg-rose-100 text-rose-600" : (isPremium ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400")
                        )}>
                            {isAdmin || isLifetime ? <Crown className="w-6 h-6" /> : (isPremium ? <Zap className="w-6 h-6" /> : <Clock className="w-6 h-6" />)}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{labelMembership}</div>
                            <h3 className="text-lg font-black tracking-tight mt-0.5 text-slate-900 dark:text-white">{planName}</h3>
                        </div>
                    </div>
                </div>

                {!isAdmin && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-30">โควต้าเพลงวันนี้</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-zinc-300">
                                {membership?.quota?.daily_limit === 0 || isLifetime 
                                    ? "ใช้งานได้ไม่จำกัด" 
                                    : `${membership?.quota?.used || 0} / ${membership?.quota?.daily_limit || 0}`
                                }
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden p-[1px]">
                            <div 
                                className={cn("h-full rounded-full transition-all duration-1000", isPremium ? "bg-primary" : "bg-slate-300")}
                                style={{ 
                                    width: (membership?.quota?.daily_limit === 0 || isLifetime) 
                                        ? '100%' 
                                        : `${Math.min(((membership?.quota?.used || 0) / (membership?.quota?.daily_limit || 1)) * 100, 100)}%` 
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-zinc-900 flex justify-between items-end">
                    <div>
                        <div className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-0.5">หมดอายุวันที่</div>
                        <div className="text-xs font-bold text-slate-500 dark:text-zinc-500">
                            {isAdmin ? "สิทธิ์ผู้ดูแลระบบ" : (isLifetime ? "ใช้งานได้ตลอดชีพ" : (safeMembership.expiresAt ? formatDate(safeMembership.expiresAt) : "ยังไม่ได้เลือกแพ็กเกจ"))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl group-hover:bg-primary/5 transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
};
