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
    primary: "bg-primary/10 text-primary ring-1 ring-primary/20",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent/10 text-accent ring-1 ring-accent/20",
    success: "bg-success/10 text-success ring-1 ring-success/20",
    warning: "bg-warning/10 text-warning ring-1 ring-warning/20",
    info: "bg-info/10 text-info ring-1 ring-info/20",
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
            "rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 card-hover",
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </h3>
                    {change && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                                change.type === "increase"
                                    ? "bg-success/10 text-success"
                                    : change.type === "decrease"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-secondary text-muted-foreground"
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
                            <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 duration-300",
                    iconColorClasses[iconColor]
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};
