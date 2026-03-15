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
        if (!date) return "ไม่มีวันหมดอายุ";
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
    const isPremium = safeMembership.type !== 'free';
    const isExpired = !isLifetime && daysRemaining !== null && daysRemaining < 0;
    const isAdmin = role === 'admin' || role === 'owner';

    return (
        <div className="relative group cursor-pointer w-full" onClick={onUpgrade}>
            {/* Glow Effect */}
            <div className={cn(
                "absolute -inset-1 rounded-2xl blur opacity-25 transition duration-500 group-hover:opacity-75",
                isAdmin ? "bg-gradient-to-r from-red-600 to-black" : (isPremium ? "bg-gradient-to-r from-yellow-600 to-red-600" : "bg-gradient-to-r from-gray-600 to-gray-400")
            )}></div>

            {/* Card Content */}
            <div className={cn(
                "relative rounded-xl overflow-hidden shadow-xl border border-white/10 p-5 flex flex-col justify-between min-h-[160px] transition-transform duration-300 group-hover:-translate-y-1",
                isAdmin
                    ? "bg-gradient-to-br from-red-900 via-neutral-950 to-black text-white"
                    : (isPremium
                        ? "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white"
                        : "bg-gradient-to-br from-gray-100 via-white to-gray-50 border-gray-200 text-gray-900")
            )}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shadow-md",
                            isAdmin
                                ? "bg-gradient-to-br from-red-500 to-red-800 text-white"
                                : (isPremium ? "bg-gradient-to-br from-yellow-400 to-orange-600 text-white" : "bg-gray-200 text-gray-500")
                        )}>
                            {isAdmin ? <Crown className="w-5 h-5" /> : (isLifetime ? <Crown className="w-5 h-5" /> : (isPremium ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />))}
                        </div>
                        <div>
                            <div className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", isAdmin ? "text-red-500" : (isPremium ? "text-yellow-500" : "text-gray-500"))}>
                                {isAdmin ? "SYSTEM ACCESS" : "MEMBERSHIP"}
                            </div>
                            <h3 className="text-lg font-bold tracking-tight leading-none mt-0.5">
                                {isAdmin ? "ADMINISTRATOR" : (isPremium ? "YOUOKE PRO" : "Standard Plan")}
                            </h3>
                        </div>
                    </div>
                    {isPremium && !isAdmin && <Sparkles className="w-5 h-5 text-yellow-400/80" />}
                    {isAdmin && <Crown className="w-5 h-5 text-red-500" />}
                </div>

                {/* Footer */}
                <div className="relative z-10 flex flex-col gap-3 mt-4">
                    {/* Usage Progress (Only for limited plans) */}
                    {safeMembership.type !== 'lifetime' && !isAdmin && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Song Usage</span>
                                <span className="text-[10px] font-black">{membership?.quota?.used || 0} / {membership?.quota?.daily_limit || 20}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200/20 rounded-full overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full transition-all duration-500",
                                        safeMembership.type === 'day_pass' ? "bg-green-400" : 
                                        safeMembership.type === 'monthly' ? "bg-blue-400" :
                                        safeMembership.type === 'yearly' ? "bg-purple-400" :
                                        isPremium ? "bg-yellow-400" : "bg-primary"
                                    )}
                                    style={{ width: `${Math.min(((membership?.quota?.used || 0) / (membership?.quota?.daily_limit || 20)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-50 mb-0.5">Valid Until</div>
                            <div className="text-sm font-mono font-bold tracking-tight">
                                {isAdmin ? "SYSTEM OWNER" : (isLifetime ? "LIFETIME" : formatDate(safeMembership.expiresAt))}
                            </div>
                        </div>
                        {!isAdmin && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all shadow-sm",
                                isPremium
                                    ? "bg-white text-black hover:bg-white/90"
                                    : "bg-black text-white hover:bg-black/80"
                            )}>
                                {isExpired ? "ต่ออายุ" : "อัพเกรด"} <ChevronRight className="w-3 h-3" />
                            </div>
                        )}
                        {isAdmin && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all shadow-sm bg-red-600 text-white">
                                FULL CONTROL
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
