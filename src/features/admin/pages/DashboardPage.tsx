import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
  Megaphone,
  UserCheck,
  Settings,
  HardDrive
} from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import { StatCard } from "../components/StatCard";
import ChartOne from "../components/ChartOne";
import { ServiceHealth } from "../components/ServiceHealth";
import { RecentUsersTable, RecentUser } from "../components/RecentUsersTable";
import { AdminService } from "../services/adminService";
// DatabaseHealth component moved to UsersPage


interface Stats {
  totalUsers: number;
  adminUsers: number;
  freeUsers: number;
  premiumUsers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
  lifetimeSubscribers: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
}

interface SerializedActivity {
  id: string;
  type: "user" | "payment";
  action: string;
  timestamp: string | null;
  details: string;
}

import { collection, query, where, getDocs, limit, orderBy, getCountFromServer, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";

const withTimeout = <T,>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, adminUsers: 0, freeUsers: 0, premiumUsers: 0,
    monthlySubscribers: 0, yearlySubscribers: 0, lifetimeSubscribers: 0,
    pendingPayments: 0, approvedPayments: 0, rejectedPayments: 0,
    totalRevenue: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<{ name: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🚀 DashboardPage.fetchData: Starting...");
      setLoading(true);
      setError(null);

      try {
        console.log("🚀 DashboardPage: Starting Parallel Promises...");
        const results = await Promise.allSettled([
          // 1. Stats
          (async () => {
            console.log("🚀 DashboardPage: Calling AdminService.getDashboardStats()...");
            const dashboardStats = await AdminService.getDashboardStats();
            console.log("🚀 DashboardPage: Processing dashboardStats:", dashboardStats);
            setStats({
              ...dashboardStats,
              adminUsers: 0,
              freeUsers: dashboardStats.totalUsers,
              premiumUsers: dashboardStats.activeSubs,
              monthlySubscribers: 0,
              yearlySubscribers: 0,
              lifetimeSubscribers: 0,
              pendingPayments: 0,
              approvedPayments: 0,
              rejectedPayments: 0,
              totalRevenue: dashboardStats.revenue,
            });
            console.log("🚀 DashboardPage: Stats Load Complete");
          })(),

          // 2. Revenue History
          (async () => {
            console.log("🚀 DashboardPage: Calling AdminService.getRevenueHistory()...");
            const history = await AdminService.getRevenueHistory();
            setRevenueHistory(history);
            console.log("🚀 DashboardPage: History Load Complete");
          })(),

          // 3. Recent Users
          (async () => {
            if (!db) {
              console.warn("🚀 DashboardPage: db is null, skipping users fetch");
              return;
            }
            console.log("🚀 DashboardPage: Fetching Recent Users from Firestore...");
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("createdAt", "desc"), limit(5));
            const snapshot = await withTimeout(getDocs(q), 10000); // 10s timeout
            const usersList = snapshot.docs.map(doc => ({
              uid: doc.id,
              ...doc.data()
            }));
            setRecentUsers(usersList);
            console.log("🚀 DashboardPage: Users Load Complete");
          })()
        ]);

        console.log("🚀 DashboardPage: All promises settled:", results);

      } catch (err: any) {
        console.error("❌ DashboardPage: General fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        console.log("🚀 DashboardPage: Fetching sequence finished. Setting loading to FALSE.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mapMembershipType = (type: string): "free" | "pro" | "vip" => {
    if (type === 'monthly' || type === 'yearly' || type === 'lifetime') return 'vip';
    if (type === 'day_pass') return 'pro';
    return 'free';
  };

  const tableUsers: RecentUser[] = recentUsers.map(u => ({
    id: u.uid,
    name: u.displayName || u.email?.split('@')[0] || 'Guest User',
    email: u.email || 'No Email',
    avatar: u.photoURL,
    membershipType: mapMembershipType(u.membership?.type),
    registeredAt: u.createdAt?.seconds
      ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('th-TH')
      : 'Unknown'
  }));

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-gray-500 animate-pulse font-medium">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-600 text-lg font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium shadow-sm active:scale-95"
            >
              รีโหลดหน้า
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-sm text-gray-500 mt-1">ภาพรวมและสถานะของระบบ YouOke</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Clock className="w-4 h-4" />
            <span>ข้อมูลล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
          </div>
        </div>

        {/* เมนูจัดการด่วน Section */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm shadow-gray-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-bold text-lg text-gray-900">เมนูจัดการด่วน</h3>
          </div>

          {/* Quick Action Cards - Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Marketing & Upsell */}
            <Link href="/admin/config"
              className="group bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 p-6 rounded-2xl border border-pink-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-pink-100">
                <Megaphone className="w-6 h-6 text-pink-500" />
              </div>
              <div className="text-base font-bold text-gray-900 group-hover:text-pink-700 transition-colors">Marketing & Upsell</div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">จัดการโปรโมชั่นและเส้นทางนำเสนอสินค้า</div>
            </Link>

            {/* Users & Roles */}
            <Link href="/admin/users"
              className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 p-6 rounded-2xl border border-green-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors">Users & Roles</div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ Premium</div>
            </Link>

            {/* System Setup */}
            <Link href="/admin/config"
              className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 p-6 rounded-2xl border border-blue-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-blue-100">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">System Setup</div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">ตั้งค่าระบบ รูปแบบ การกำหนดค่า</div>
            </Link>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-primary to-purple-600 p-6 rounded-2xl text-white shadow-lg shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 backdrop-blur-md group-hover:rotate-12 transition-transform duration-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-base font-bold relative z-10">Revenue (Monthly)</div>
              <div className="text-xs opacity-80 mt-1.5 relative z-10">ภาพรวมรายได้ทั้งหมด</div>
              <div className="text-3xl font-bold mt-3 relative z-10 tracking-tight">฿{stats.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            icon={Users}
            iconColor="primary"
            change={{ value: 12, type: "increase" }}
          />

          <StatCard
            title="งวดชำระ (ประมาณการ)"
            value={`฿${stats.totalRevenue.toLocaleString()}`}
            icon={CreditCard}
            iconColor="success"
            change={{ value: 0, type: "neutral" }}
          />

          <StatCard
            title="สมาชิก Active"
            value={stats.approvedPayments || 8}
            icon={UserCheck}
            iconColor="warning"
            change={{ value: 5, type: "increase" }}
          />

          <StatCard
            title="Online Users"
            value={0}
            icon={Activity}
            iconColor="info"
            change={{ value: 0, type: "neutral" }}
          />
        </div>

        {/* Chart & Service Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">ภาพรวมรายได้</h3>
                <p className="text-sm text-gray-500">รายรับ 6 เดือนย้อนหลัง</p>
              </div>
              <div className="p-2 bg-red-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
            </div>

            <div className="h-80 w-full">
              {revenueHistory.length > 0 ? (
                <ChartOne
                  title=""
                  subtitle=""
                  categories={revenueHistory.map(r => r.name)}
                  series={[{
                    name: "Total Revenue",
                    data: revenueHistory.map(r => r.revenue)
                  }]}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <HardDrive className="w-8 h-8 opacity-50" />
                  <span>No revenue data available</span>
                </div>
              )}
            </div>
          </div>

          {/* Service Health (1 col) */}
          <div className="lg:col-span-1">
            <ServiceHealth />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
