import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: "increase" | "decrease" | "neutral";
    };
    icon: LucideIcon;
    iconColor?: "primary" | "accent" | "success" | "warning" | "info" | "secondary";
    className?: string;
}

const iconColorClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
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
            "rounded-lg border border-border bg-card p-6 shadow-sm",
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
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                change.type === "increase"
                                    ? "bg-success/15 text-success"
                                    : change.type === "decrease"
                                        ? "bg-destructive/15 text-destructive"
                                        : "bg-muted text-muted-foreground"
                            )}>
                                {change.type === "increase" ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : change.type === "decrease" ? (
                                    <TrendingDown className="h-3 w-3" />
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
                    "flex h-14 w-14 items-center justify-center rounded-xl",
                    iconColorClasses[iconColor]
                )}>
                    <Icon className="h-7 w-7" />
                </div>
            </div>
        </div>
    );
};
