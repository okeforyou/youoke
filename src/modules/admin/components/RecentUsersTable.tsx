import { cn } from "@/lib/utils";
import React from "react";

// Simple Badge component to replace the missing UI component
const Badge = ({ variant, className, children }: any) => {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
        )}>
            {children}
        </span>
    );
};

export interface RecentUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    membershipType: "free" | "pro" | "vip";
    registeredAt: string;
}

interface RecentUsersTableProps {
    users: RecentUser[];
}

const membershipStyles = {
    free: { bg: "bg-muted", text: "text-muted-foreground", label: "Free" },
    pro: { bg: "bg-primary/15", text: "text-primary", label: "Pro" },
    vip: { bg: "bg-accent/15", text: "text-accent", label: "VIP" },
};

export const RecentUsersTable = ({ users = [] }: RecentUsersTableProps) => {
    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">ผู้สมัครล่าสุด</h3>
                        <p className="text-sm text-muted-foreground">ผู้ใช้งานที่เพิ่งลงทะเบียนเข้ามา</p>
                    </div>
                    <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                        ดูทั้งหมด →
                    </button>
                </div>
            </div>

            <div className="divide-y divide-border/30">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-medium border border-border/30 overflow-hidden">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "border-0 font-normal",
                                    membershipStyles[user.membershipType]?.bg || membershipStyles.free.bg,
                                    membershipStyles[user.membershipType]?.text || membershipStyles.free.text
                                )}
                            >
                                {membershipStyles[user.membershipType]?.label || "Free"}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {user.registeredAt}
                            </span>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground text-sm">ไม่พบผู้ใช้งานล่าสุด</div>
                )}
            </div>
        </div>
    );
};
