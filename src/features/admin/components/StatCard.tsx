import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/solid";
import { cn } from "../../../utils/cn";
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: "increase" | "decrease" | "neutral";
    };
    icon: React.ElementType; // Heroicon type
    iconColor?: "primary" | "accent" | "success" | "warning" | "info" | "secondary";
    className?: string;
}

const iconColorClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    accent: "bg-accent text-accent-content",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    info: "bg-info/20 text-info",
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
            "rounded-lg border border-gray-200 bg-white p-6 shadow-sm",
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
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                change.type === "increase"
                                    ? "bg-green-100 text-green-700"
                                    : change.type === "decrease"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-600"
                            )}>
                                {change.type === "increase" ? (
                                    <ArrowTrendingUpIcon className="h-3 w-3" />
                                ) : change.type === "decrease" ? (
                                    <ArrowTrendingDownIcon className="h-3 w-3" />
                                ) : (
                                    <span>-</span>
                                )}
                                {Math.abs(change.value)}%
                            </span>
                            <span className="text-xs text-gray-400">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    iconColorClasses[iconColor]
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};
