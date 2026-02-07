import {
    CircleStackIcon,
    WifiIcon,
    PlayIcon,
    ServerIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { cn } from "../../../utils/cn";
import React from "react";

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
        icon: CircleStackIcon,
        status: "online",
        latency: "12ms",
        description: "การเชื่อมต่อ Firestore ปกติ"
    },
    {
        name: "YouTube API",
        icon: PlayIcon,
        status: "online",
        latency: "145ms",
        description: "Quota ใช้งานไป 67%"
    },
    {
        name: "CDN",
        icon: ServerIcon,
        status: "online",
        latency: "8ms",
        description: "เซิร์ฟเวอร์ทำงานปกติทุกโซน"
    },
    {
        name: "WebSocket",
        icon: WifiIcon,
        status: "online",
        latency: "5ms",
        description: "ระบบ Real-time ทำงาน"
    },
];

const statusConfig = {
    online: {
        icon: CheckCircleIcon,
        color: "text-green-500",
        bg: "bg-green-100",
    },
    offline: {
        icon: XCircleIcon,
        color: "text-red-500",
        bg: "bg-red-100",
    },
    warning: {
        icon: ExclamationCircleIcon,
        color: "text-yellow-500",
        bg: "bg-yellow-100",
    },
};

export const ServiceHealth = () => {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">สถานะเซิร์ฟเวอร์</h3>
                    <p className="text-sm text-gray-500">ตรวจสอบความพร้อมของระบบ</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600">ระบบทำงานปกติ</span>
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
                                "bg-gray-50 hover:bg-gray-100 border border-gray-100"
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
                                    <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                                    {service.latency && (
                                        <span className="text-xs text-gray-400">{service.latency}</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{service.description}</p>
                            </div>
                            <StatusIcon className={cn("h-4 w-4", statusConfig[service.status].color)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
