import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
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

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, adminUsers: 0, freeUsers: 0, premiumUsers: 0,
    monthlySubscribers: 0, yearlySubscribers: 0, lifetimeSubscribers: 0,
    pendingPayments: 0, approvedPayments: 0, rejectedPayments: 0,
    totalRevenue: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Stats via Service
        const dashboardStats = await AdminService.getDashboardStats();
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

        // 2. Fetch Recent Users (Directly from Firestore like play.youoke)
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
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please check your connection.");
      } finally {
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
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-sm text-gray-600 mt-1">ภาพรวมและข้อมูลเชิงลึกของระบบ YouOke</p>
        </div>

        {/* เมนูจัดการด่วน Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-red-500 rounded-full"></div>
            <h3 className="font-bold text-gray-900">เมนูจัดการด่วน</h3>
          </div>

          {/* Quick Action Cards - Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Marketing & Upsell */}
            <Link href="/admin/config"
              className="group bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 p-6 rounded-xl border border-pink-200/50 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-3 shadow-sm">
                <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="text-base font-bold text-gray-900">Marketing & Upsell</div>
              <div className="text-xs text-gray-500 mt-1">จัดการโปรโมชั่นและเส้นทางนำเสนอสินค้า</div>
            </Link>

            {/* Users & Roles */}
            <Link href="/admin/users"
              className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 p-6 rounded-xl border border-green-200/50 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-3 shadow-sm">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-base font-bold text-gray-900">Users & Roles</div>
              <div className="text-xs text-gray-500 mt-1">จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ Premium</div>
            </Link>

            {/* System Setup */}
            <Link href="/admin/config"
              className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 p-6 rounded-xl border border-blue-200/50 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-3 shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-base font-bold text-gray-900">System Setup</div>
              <div className="text-xs text-gray-500 mt-1">ตั้งค่าระบบ รูปแบบ การกำหนดค่า</div>
            </Link>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-xl border border-red-300 text-white shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-3 backdrop-blur-sm">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-base font-bold">Revenue</div>
              <div className="text-xs opacity-90 mt-1">ภาพรวมรายได้ทั้งหมด</div>
              <div className="text-3xl font-bold mt-3">฿{stats.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">ผู้ใช้ทั้งหมด</div>
            <div className="text-4xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <span className="text-red-600 font-medium">+12%</span> เทียบกับเดือนที่แล้ว
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">งวดชำระ (ประมาณการ)</div>
            <div className="text-4xl font-bold text-gray-900">฿{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <span className="text-green-600 font-medium">+0%</span> vs last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">สมาชิก Active</div>
            <div className="text-4xl font-bold text-gray-900">{stats.approvedPayments || 8}</div>
            <div className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <span className="text-yellow-600 font-medium">+0%</span> vs 1 month
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">ปลาคลี (Online)</div>
            <div className="text-4xl font-bold text-gray-900">0</div>
          </div>
        </div>

        {/* System Health & Maintenance (Moved to Users Page) */}

        {/* Chart & Service Health Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-red-600 mb-1">ภาพรวมรายได้</h3>
            <p className="text-sm text-gray-500 mb-4">รายรับ 6 เดือนย้อนหลัง</p>
            <div className="h-80">
              {revenueHistory.length > 0 ? (
                <ChartOne
                  title=""
                  subtitle=""
                  categories={revenueHistory.map(r => r.name)}
                  series={[{
                    name: "Total: 80",
                    data: revenueHistory.map(r => r.revenue)
                  }]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No revenue data available
                </div>
              )}
            </div>
          </div>

          {/* Service Health */}
          <div>
            <ServiceHealth />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
