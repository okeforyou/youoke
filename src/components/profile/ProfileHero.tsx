import { Edit2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeroProps {
    user: any;
    isPremium: boolean;
    role?: string;
    onEdit?: () => void;
}

export const ProfileHero = ({ user, isPremium, role, onEdit }: ProfileHeroProps) => {
    const isAdmin = role === 'admin' || role === 'owner';
    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-card border border-border/50 shadow-2xl">
            {/* Background Gradient / Cover - Apple Music Style */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background opacity-80 z-0"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

            <div className="relative z-10 flex flex-col items-center justify-center py-8 px-6 text-center">
                {/* Avatar with Glow */}
                <div className="relative mb-4 group cursor-pointer">
                    <div className={cn(
                        "absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity duration-500",
                        isAdmin ? "bg-gradient-to-r from-red-500 via-red-600 to-black" : (isPremium ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" : "bg-gray-400")
                    )}></div>
                    <div className="relative w-24 h-24 rounded-full ring-4 ring-background overflow-hidden bg-muted flex items-center justify-center">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="text-3xl font-bold text-muted-foreground">{user.displayName?.charAt(0).toUpperCase() || 'U'}</div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Camera className="w-6 h-6 text-white/90" />
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-red-600 to-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border-2 border-background flex items-center gap-1">
                            ADMIN
                        </div>
                    )}
                    {!isAdmin && isPremium && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border-2 border-background flex items-center gap-1">
                            PRO
                        </div>
                    )}
                </div>

                {/* Name & Email */}
                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
                    {user.displayName || 'No Name'}
                </h1>
                <p className="text-sm text-muted-foreground font-medium mb-4 flex items-center gap-2">
                    {user.email}
                    <button onClick={onEdit} className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground/50 hover:text-foreground">
                        <Edit2 className="w-3 h-3" />
                    </button>
                </p>

                {/* Quick Stats (Compact) */}
                <div className="flex items-center gap-8 py-3 px-6 border border-white/5 bg-white/5 rounded-full backdrop-blur-md">
                    <div className="text-center">
                        <div className="text-lg font-bold text-foreground leading-none">128</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Sungs</div>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-foreground leading-none">14</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Playlists</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
