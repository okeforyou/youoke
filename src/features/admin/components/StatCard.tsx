import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../../utils/cn";
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: "increase" | "decrease" | "neutral";
    };
    icon: React.ElementType; // Lucide or Heroicon type
    iconColor?: "primary" | "accent" | "success" | "warning" | "info" | "secondary";
    className?: string;
}

const iconColorClasses = {
    primary: "bg-primary/10 text-primary ring-1 ring-primary/20",
    secondary: "bg-gray-100 text-gray-500",
    accent: "bg-purple-100 text-purple-600 ring-1 ring-purple-200",
    success: "bg-green-100 text-green-600 ring-1 ring-green-200",
    warning: "bg-orange-100 text-orange-600 ring-1 ring-orange-200",
    info: "bg-blue-100 text-blue-600 ring-1 ring-blue-200",
};

export const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    iconColor = "primary",
    className
}: StatCardProps) => {
    return (
        <div className={cn(
            "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 group",
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </h3>
                    {change && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                                change.type === "increase"
                                    ? "bg-green-100 text-green-700"
                                    : change.type === "decrease"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-600"
                            )}>
                                {change.type === "increase" ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : change.type === "decrease" ? (
                                    <TrendingDown className="h-3 w-3" />
                                ) : (
                                    <Minus className="h-3 w-3" />
                                )}
                                {Math.abs(change.value)}%
                            </span>
                            <span className="text-xs text-gray-400">เทียบกับเดือนก่อน</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-300 shadow-sm",
                    iconColorClasses[iconColor]
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};
