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
import { db } from "../../../../firebase";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, adminUsers: 0, freeUsers: 0, premiumUsers: 0,
    monthlySubscribers: 0, yearlySubscribers: 0, lifetimeSubscribers: 0,
    pendingPayments: 0, approvedPayments: 0, rejectedPayments: 0,
    totalRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<SerializedActivity[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<{ name: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetching
        const [
          totalUsersSnap,
          recentUsersSnap,
          paymentsSnap,
          revenueHistoryData
        ] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10))),
          getDocs(query(collection(db, "payment_proofs"), orderBy("createdAt", "desc"), limit(100))), // Limit for performance? Or fetch all if needed
          AdminService.getRevenueHistory().catch(() => [])
        ]);

        // Process Users
        const totalUsers = totalUsersSnap.data().count;

        // Process Recent Users for Activity
        const recentUsers = recentUsersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Process Payments for Stats
        let pendingPayments = 0;
        let approvedPayments = 0;
        let rejectedPayments = 0;
        let totalRevenue = 0;
        const recentPayments: any[] = [];

        paymentsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'pending') pendingPayments++;
          else if (data.status === 'approved') {
            approvedPayments++;
            totalRevenue += Number(data.amount) || 0;
            recentPayments.push({ id: doc.id, ...data });
          } else if (data.status === 'rejected') rejectedPayments++;
        });

        // Combine Activities
        const activities: SerializedActivity[] = [];
        recentPayments.slice(0, 10).forEach((p: any) => activities.push({
          id: p.id, type: "payment", action: "Payment Approved",
          timestamp: p.approvedAt?.toDate?.()?.toISOString() || null,
          details: `${p.amount} THB - Plan: ${p.planId}`,
        }));
        recentUsers.forEach((u: any) => activities.push({
          id: u.id, type: "user", action: "New User Registered",
          timestamp: u.createdAt ? new Date(u.createdAt.seconds * 1000).toISOString() : null,
          details: `${u.displayName || u.email} - ${u.tier || 'free'}`,
        }));
        activities.sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0));

        // Update State
        setStats(prev => ({
          ...prev,
          totalUsers,
          pendingPayments,
          approvedPayments,
          rejectedPayments,
          totalRevenue,
          // Rough estimates or placeholders for now to avoid fetching ALL users
          adminUsers: 0,
          freeUsers: totalUsers,
          premiumUsers: 0,
          monthlySubscribers: 0,
          yearlySubscribers: 0,
          lifetimeSubscribers: 0
        }));
        setRecentActivities(activities.slice(0, 10));
        setRevenueHistory(revenueHistoryData);

      } catch (err: any) {
        console.error("Dashboard data fetch failed:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Map SerializedActivities to RecentUser for the table (Partial mapping)
  // Note: ideally we fetch real recent users with avatar etc from AdminService
  const tableUsers: RecentUser[] = recentActivities
    .filter(a => a.type === 'user')
    .map(a => ({
      id: a.id,
      name: a.details.split(' - ')[0] || 'User',
      email: 'hidden@email.com', // Info not passed in simple activity prop
      membershipType: a.details.includes('monthly') ? 'monthly' : a.details.includes('yearly') ? 'yearly' : 'free',
      registeredAt: a.timestamp ? new Date(a.timestamp).toLocaleDateString('th-TH') : '-'
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">แดชบอร์ด</h1>
            <p className="text-sm text-muted-foreground mt-1">ภาพรวมและข้อมูลเชิงลึกของระบบ YouOke</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/config" className="btn btn-sm btn-outline border-border text-foreground hover:bg-secondary hover:text-foreground no-animation shadow-sm">
              <span className="font-normal">⚙️ ตั้งค่าระบบ</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            icon={UsersIcon}
            iconColor="primary"
            change={{ value: 12, type: "increase" }} // Mock change
          />
          <StatCard
            title="รายได้รวม"
            value={`฿${stats.totalRevenue.toLocaleString()}`}
            icon={CurrencyDollarIcon}
            iconColor="success"
            change={{ value: 5.4, type: "increase" }}
          />
          <StatCard
            title="รอตรวจสอบ"
            value={stats.pendingPayments}
            icon={ClockIcon}
            iconColor="warning"
          />
          <StatCard
            title="อนุมัติแล้ว"
            value={stats.approvedPayments}
            icon={CheckCircleIcon}
            iconColor="info"
          />
        </div>

        {/* Charts & Health */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="lg:col-span-2 xl:col-span-8 bg-card border border-border rounded-xl shadow-sm p-1">
            {/* Chart Wrapper - Note: ChartOne needs internal update too, passing generic style for now */}
            <ChartOne
              title="ภาพรวมรายได้"
              subtitle="รายรับ 6 เดือนย้อนหลัง"
              categories={revenueHistory.map(r => r.name)}
              series={[{
                name: "ยอดขาย",
                data: revenueHistory.map(r => r.revenue)
              }]}
            />
          </div>
          <div className="lg:col-span-1 xl:col-span-4">
            <ServiceHealth />
          </div>
        </div>

        {/* Recent Users & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Recent Users Table Wrapper */}
            <RecentUsersTable users={tableUsers} />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 h-fit sticky top-24">
            <h3 className="text-lg font-bold text-foreground mb-4">เมนูลัด</h3>
            <div className="space-y-3">
              <Link href="/admin/users" className="flex items-center justify-between w-full py-3 px-4 bg-primary/5 border border-primary/20 text-primary rounded-lg hover:bg-primary/10 transition-colors group">
                <span className="font-medium">จัดการผู้ใช้</span>
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full group-hover:scale-110 transition-transform">{stats.totalUsers}</span>
              </Link>
              <Link href="/admin/payments" className="flex items-center justify-between w-full py-3 px-4 bg-warning/5 border border-warning/20 text-warning rounded-lg hover:bg-warning/10 transition-colors group">
                <span className="font-medium">ตรวจสอบสลิป</span>
                {stats.pendingPayments > 0 && <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full animate-pulse">{stats.pendingPayments}</span>}
              </Link>
              <Link href="/admin/packages" className="flex items-center justify-between w-full py-3 px-4 bg-success/5 border border-success/20 text-success rounded-lg hover:bg-success/10 transition-colors group">
                <span className="font-medium">จัดการแพ็กเกจ</span>
                <span className="text-xs text-success/70">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
