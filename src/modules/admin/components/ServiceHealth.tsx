import { Database, Wifi, Youtube, Server, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
    name: string;
    icon: React.ElementType;
    status: "online" | "offline" | "warning";
    latency?: string;
    description: string;
}

const services: ServiceStatus[] = [
    {
        name: "Database",
        icon: Database,
        status: "online",
        latency: "12ms",
        description: "การเชื่อมต่อ Firestore ปกติ"
    },
    {
        name: "YouTube API",
        icon: Youtube,
        status: "online",
        latency: "145ms",
        description: "Quota ใช้งานไป 67%"
    },
    {
        name: "CDN",
        icon: Server,
        status: "online",
        latency: "8ms",
        description: "เซิร์ฟเวอร์ทำงานปกติทุกโซน"
    },
    {
        name: "WebSocket",
        icon: Wifi,
        status: "online",
        latency: "5ms",
        description: "ระบบ Real-time ทำงาน"
    },
];

const statusConfig = {
    online: {
        icon: CheckCircle2,
        color: "text-success",
        bg: "bg-success/15",
        glow: "shadow-[0_0_10px_hsl(155,100%,45%,0.3)]"
    },
    offline: {
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/15",
        glow: ""
    },
    warning: {
        icon: AlertCircle,
        color: "text-warning",
        bg: "bg-warning/15",
        glow: ""
    },
};

export const ServiceHealth = () => {
    return (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">สถานะเซิร์ฟเวอร์</h3>
                    <p className="text-sm text-muted-foreground">ตรวจสอบความพร้อมของระบบ</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success">ระบบทำงานปกติ</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {services.map((service) => {
                    const StatusIcon = statusConfig[service.status].icon;
                    return (
                        <div
                            key={service.name}
                            className={cn(
                                "flex items-center gap-3 rounded-lg p-3 transition-all",
                                "bg-muted/30 hover:bg-muted/50 border border-border/30"
                            )}
                        >
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                statusConfig[service.status].bg
                            )}>
                                <service.icon className={cn("h-5 w-5", statusConfig[service.status].color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground text-sm">{service.name}</span>
                                    {service.latency && (
                                        <span className="text-xs text-muted-foreground">{service.latency}</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                            </div>
                            <StatusIcon className={cn("h-4 w-4", statusConfig[service.status].color)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
