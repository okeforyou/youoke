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
  HardDrive,
  Image as ImageIcon
} from "lucide-react";
import { SYSTEM_VERSION, COMMIT_ID } from "@/core/version";
import AdminLayout from "../layouts/AdminLayout";
import { StatCard } from "../components/StatCard";
import ChartOne from "../components/ChartOne";
import { ServiceHealth } from "../components/ServiceHealth";
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
              freeUsers: dashboardStats.totalUsers - dashboardStats.activeSubs,
              premiumUsers: dashboardStats.activeSubs,
              monthlySubscribers: 0,
              yearlySubscribers: 0,
              lifetimeSubscribers: 0,
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

  const mapMembershipType = (type: string): "free" | "premium" | "vip" => {
    if (type === 'monthly' || type === 'yearly' || type === 'lifetime') return 'vip';
    if (type === 'day_pass' || type === 'trial') return 'premium';
    return 'free';
  };

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
              className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium active:scale-95"
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
        <div className="p-6 bg-white rounded-[24px] border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-primary rounded-full"></div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">ภาพรวมระบบ</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">ติดตามสถานะและความเคลื่อนไหวล่าสุด (v{SYSTEM_VERSION} {COMMIT_ID})</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 font-bold">
               <Clock className="w-4 h-4" />
               <span>ข้อมูลล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
             </div>
          </div>
        </div>

        {/* 🛡️ Billboard: Admin System Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-[24px] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Megaphone className="w-32 h-32 rotate-12" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-black uppercase tracking-widest">System Alerts</span>
                   <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
                <h2 className="text-xl font-bold mb-2">สิ่งที่ควรจัดการในวันนี้</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                   <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
                         <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase">รออนุมัติ</div>
                         <div className="text-lg font-bold">{stats.pendingPayments || 0} รายการ</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
                         <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase">รายได้เดือนนี้</div>
                         <div className="text-lg font-bold">฿{stats.totalRevenue.toLocaleString()}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 flex flex-col justify-center">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Announcement Quick-Post</div>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">ต้องการประกาศแจ้งสมาชิกด่วนหรือไม่?</p>
             <Link href="/admin/broadcast" className="w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm text-slate-700">
                <Megaphone className="w-4 h-4" />
                ไปหน้าประกาศข่าวสาร
             </Link>
          </div>
        </div>

        {/* เมนูจัดการด่วน Section */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-bold text-lg text-gray-900">เมนูจัดการด่วน (v{SYSTEM_VERSION})</h3>
          </div>

          {/* Quick Action Cards - Corrected to 5 Columns Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Marketing & Upsell */}
            <Link href="/admin/config"
              className="group bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 p-5 rounded-2xl border border-pink-200 transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ring-1 ring-pink-100">
                <Megaphone className="w-5 h-5 text-pink-500" />
              </div>
              <div className="text-sm font-bold text-gray-900 group-hover:text-pink-700 transition-colors leading-tight">Admin & Marketing</div>
              <div className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-medium">จัดการโปรโมชั่นต่างๆ</div>
            </Link>

            {/* Users & Roles */}
            <Link href="/admin/users"
              className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 p-5 rounded-2xl border border-green-200 transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ring-1 ring-green-100">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors leading-tight">Users & Roles</div>
              <div className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-medium">จัดการสิทธิ์สมาชิก PRO</div>
            </Link>

            {/* System Setup */}
            <Link href="/admin/config"
              className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 p-5 rounded-2xl border border-blue-200 transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ring-1 ring-blue-100">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">System Setup</div>
              <div className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-medium">ตั้งค่ารูปแบบระบบ</div>
            </Link>

            {/* Artist Management */}
            <Link href="/admin/artists"
              className="group bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 p-5 rounded-2xl border border-amber-200 transition-all duration-300 cursor-pointer hover:-translate-y-1">
              <div className="flex items-center justify-center w-10 h-10 bg-white rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 ring-1 ring-amber-100">
                <ImageIcon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors leading-tight">Artist Library</div>
              <div className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-medium">จัดการรูปศิลปิน/หน้าปก</div>
            </Link>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-primary to-purple-600 p-5 rounded-2xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl mb-4 backdrop-blur-md group-hover:rotate-12 transition-transform duration-500">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-bold relative z-10 leading-tight">Monthly Revenue</div>
              <div className="text-[10px] opacity-80 mt-1.5 relative z-10 font-bold uppercase tracking-tighter">฿{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-xl font-bold mt-2 relative z-10 tracking-tight leading-none italic animate-pulse">LIVE</div>
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
          <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-gray-100 text-slate-900 font-bold">
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
