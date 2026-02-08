import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useSystemConfig } from "../../hooks/useSystemConfig";
import { Users, Shield, Activity, DollarSign, Settings2, Wallet, CreditCard, PartyPopper, Settings, UserCheck } from "lucide-react";
import React from 'react';
import Link from 'next/link'; // Added Link import
import { StatCard } from "@/modules/admin/components/StatCard";
// import { RevenueChart, UserActivityChart } from "../../components/admin/Charts"; // Removed
import ChartOne from "@/modules/admin/components/ChartOne";
import ChartTwo from "@/modules/admin/components/ChartTwo";
import { ServiceHealth } from "@/modules/admin/components/ServiceHealth";
import { RecentUsersTable } from "@/modules/admin/components/RecentUsersTable";
import { AdminService } from "@/modules/admin/services/adminService"; // Import Service
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminDashboard() {
    const { config } = useSystemConfig();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubs: 0,
        revenue: 0,
        loading: true
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [userGrowthData, setUserGrowthData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Stats via Service
                const dashboardStats = await AdminService.getDashboardStats();
                setStats(dashboardStats);

                // 2. Fetch Chart Data
                const revHistory = await AdminService.getRevenueHistory();
                setRevenueData(revHistory);

                const growthStats = await AdminService.getUserGrowthStats();
                setUserGrowthData(growthStats);

                // 3. Fetch Recent Users
                if (db) {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, orderBy("createdAt", "desc"), limit(5));
                    const snapshot = await getDocs(q);

                    const users = snapshot.docs.map(doc => ({
                        uid: doc.id,
                        ...doc.data()
                    }));

                    setRecentUsers(users);
                }

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();
    }, []);

    const mapMembershipType = (type: string): "free" | "pro" | "vip" => {
        if (type === 'monthly' || type === 'yearly' || type === 'lifetime') return 'vip';
        if (type === 'day_pass') return 'pro';
        return 'free';
    };

    const mappedUsers = recentUsers.map(u => ({
        id: u.uid,
        name: u.displayName || 'Guest User',
        email: u.email || 'No Email',
        avatar: u.photoURL,
        membershipType: mapMembershipType(u.membership?.type),
        registeredAt: u.createdAt?.seconds
            ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('th-TH', { hour: 'numeric', minute: 'numeric' })
            : 'Unknown'
    }));

    // Data Transformation for Charts
    const revenueSeries = [{
        name: 'Revenue',
        data: revenueData.map(d => d.revenue)
    }];
    const revenueCategories = revenueData.map(d => d.name);

    const userGrowthSeries = [{
        name: 'New Users',
        data: userGrowthData.map(d => d.new)
    }];
    const userGrowthCategories = userGrowthData.map(d => d.name);


    return (
        <AdminLayout headerTitle="Dashboard">
            <Head>
                <title>YouOke Admin | Dashboard</title>
            </Head>

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">ภาพรวมระบบ (Dashboard)</h1>
                <p className="mt-1 text-muted-foreground">ยินดีต้อนรับกลับ, แอดมิน นี่คือข้อมูลสรุปของระบบวันนี้</p>
            </div>

            {/* Premium Control Center */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1 bg-primary rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-800">เมนูจัดการด่วน</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Marketing Card */}
                    <Link href="/admin/config?tab=marketing" className="group relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <PartyPopper size={80} className="text-rose-500 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <PartyPopper size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Marketing & Upsell</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">ตั้งค่าข้อความแจ้งเตือนเมื่อหมดโควต้า และโปรโมชั่นต่างๆ</p>
                            <div className="mt-4 flex items-center text-rose-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                จัดการเลย <Settings2 size={16} className="ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Users Card */}
                    <Link href="/admin/users" className="group relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={80} className="text-indigo-500 -rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Users & Roles</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">ดูรายชื่อผู้ใช้งาน จัดการสิทธิ์แอดมินและสมาชิก Premium</p>
                        </div>
                    </Link>

                    {/* Setup Card */}
                    <Link href="/admin/config" className="group relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Settings size={80} className="text-slate-500 rotate-45" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Settings size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">System Setup</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">ตั้งค่าระบบทั่วไป การเงิน และแพ็กเกจสมาชิก</p>
                        </div>
                    </Link>

                    {/* Revenue Card (Concept) */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-primary to-rose-600 rounded-3xl p-6 shadow-lg shadow-primary/20 text-white">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Wallet size={80} className="text-white rotate-12" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                                    <DollarSign size={24} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Revenue</h3>
                                <p className="text-sm text-white/80">ยอดขายรวมเดือนนี้</p>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold tracking-tight">฿{stats.revenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="ผู้ใช้งานทั้งหมด"
                    value={stats.loading ? "..." : stats.totalUsers}
                    change={{ value: 0, type: "neutral" }}
                    icon={Users}
                    iconColor="primary"
                />
                <StatCard
                    title="รายได้รวม (ประมาณการ)"
                    value={stats.loading ? "..." : `฿${stats.revenue.toLocaleString()}`}
                    change={{ value: 0, type: "neutral" }}
                    icon={Wallet}
                    iconColor="success"
                />
                <StatCard
                    title="สมาชิก Active"
                    value={stats.loading ? "..." : stats.activeSubs}
                    change={{ value: 0, type: "neutral" }}
                    icon={CreditCard}
                    iconColor="secondary"
                />
                <StatCard
                    title="สถานะระบบ"
                    value={config?.maintenanceMode ? "ปิดปรับปรุง" : "ปกติ (Online)"}
                    icon={Settings2}
                    iconColor={config?.maintenanceMode ? "warning" : "info"}
                />
            </div>



            {/* Charts Row */}
            <div className="mb-8 grid gap-6 lg:grid-cols-12">
                <ChartOne
                    title="แนวโน้มรายได้"
                    subtitle="ภาพรวมรายได้ 6 เดือนล่าสุด"
                    series={revenueSeries}
                    categories={revenueCategories}
                />
                <ChartTwo
                    title="ผู้ใช้งานใหม่"
                    subtitle="สถิติ 7 วันล่าสุด"
                    series={userGrowthSeries}
                    categories={userGrowthCategories}
                />
            </div>

            {/* Content Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentUsersTable users={mappedUsers} />
                </div>
                <div>
                    <ServiceHealth />
                </div>
            </div>

        </AdminLayout >
    );
}
