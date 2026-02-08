import { cn } from "../../../utils/cn";
import React from "react";

// Simple Badge component
const Badge = ({ variant, className, children }: any) => {
    const variants: any = {
        outline: "border border-gray-200",
        default: "bg-primary text-white"
    };
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
            variants[variant] || variants.default,
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
    membershipType: "free" | "pro" | "vip" | "monthly" | "yearly" | "lifetime"; // Added more types
    registeredAt: string;
}

interface RecentUsersTableProps {
    users: RecentUser[];
}

const membershipStyles: any = {
    free: { bg: "bg-gray-100", text: "text-gray-600", label: "ทั่วไป" },
    pro: { bg: "bg-blue-50", text: "text-blue-700", label: "โปร" },
    vip: { bg: "bg-purple-50", text: "text-purple-700", label: "VIP" },
    monthly: { bg: "bg-green-50", text: "text-green-700", label: "รายเดือน" },
    yearly: { bg: "bg-orange-50", text: "text-orange-700", label: "รายปี" },
    lifetime: { bg: "bg-indigo-50", text: "text-indigo-700", label: "ตลอดชีพ" },
};

export const RecentUsersTable = ({ users = [] }: RecentUsersTableProps) => {
    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">ผู้สมัครล่าสุด</h3>
                        <p className="text-sm text-gray-500">ผู้ใช้งานที่เพิ่งลงทะเบียนเข้ามา</p>
                    </div>
                    <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                        ดูทั้งหมด →
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-medium border border-gray-100 overflow-hidden shrink-0">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
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
                            <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline-block">
                                {user.registeredAt}
                            </span>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm">ไม่พบผู้ใช้งานล่าสุด</div>
                )}
            </div>
        </div>
    );
};
