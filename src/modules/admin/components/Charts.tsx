import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const revenueData = [
    { name: "Jan", revenue: 45000, users: 120 },
    { name: "Feb", revenue: 52000, users: 145 },
    { name: "Mar", revenue: 48000, users: 132 },
    { name: "Apr", revenue: 61000, users: 178 },
    { name: "May", revenue: 55000, users: 160 },
    { name: "Jun", revenue: 67000, users: 195 },
    { name: "Jul", revenue: 72000, users: 210 },
];

const userActivityData = [
    { name: "Mon", active: 1200, new: 45 },
    { name: "Tue", active: 1350, new: 52 },
    { name: "Wed", active: 1100, new: 38 },
    { name: "Thu", active: 1480, new: 61 },
    { name: "Fri", active: 1560, new: 75 },
    { name: "Sat", active: 1890, new: 89 },
    { name: "Sun", active: 2100, new: 102 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card p-3 border border-border/50 rounded shadow-md">
                <p className="text-sm font-medium text-foreground mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

interface RevenueChartProps {
    data: { name: string; revenue: number }[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
    // Calculate total and growth logic could be moved to parent or computed here
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

    return (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">แนวโน้มรายได้</h3>
                    <p className="text-sm text-muted-foreground">ภาพรวมรายได้ 6 เดือนล่าสุด</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">฿{totalRevenue.toLocaleString()}</span>
                    {/* Growth badge is static for now or can be calculated if we passed previous period */}
                </div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                            tickFormatter={(value) => `฿${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(0, 72%, 51%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="Revenue"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

interface UserActivityChartProps {
    data: { name: string; active: number; new: number }[];
}

export const UserActivityChart = ({ data }: UserActivityChartProps) => {
    return (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">การใช้งานของผู้ใช้</h3>
                    <p className="text-sm text-muted-foreground">ผู้ใช้งานใหม่ในสัปดาห์นี้</p>
                </div>
                <div className="flex gap-4">
                    {/* 
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    */}
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-info" />
                        <span className="text-xs text-muted-foreground">New Users</span>
                    </div>
                </div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* 
                        <Bar
                            dataKey="active"
                            fill="hsl(0, 72%, 51%)"
                            radius={[4, 4, 0, 0]}
                            name="ผู้ใช้ Active"
                        />
                        */}
                        <Bar
                            dataKey="new"
                            fill="hsl(199, 89%, 48%)"
                            radius={[4, 4, 0, 0]}
                            name="ผู้ใช้ใหม่"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const PlayChart = RevenueChart;
export const CategoryChart = UserActivityChart;
