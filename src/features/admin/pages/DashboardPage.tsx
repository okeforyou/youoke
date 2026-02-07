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

interface Props {
  stats: Stats;
  recentActivities: SerializedActivity[];
  error?: string;
}

const AdminDashboard: React.FC<Props> = ({ stats, recentActivities, error }) => {
  const [revenueHistory, setRevenueHistory] = useState<{ name: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const history = await AdminService.getRevenueHistory();
        setRevenueHistory(history);
      } catch (e) {
        console.error("Failed to fetch dashboard extra data", e);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">ภาพรวมระบบ YouOke</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/config" className="btn btn-sm btn-outline">
              ตั้งค่าระบบ
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
          <ChartOne
            title="Revenue Overview"
            subtitle="รายรับ 6 เดือนย้อนหลัง"
            categories={revenueHistory.map(r => r.name)}
            series={[{
              name: "Revenue",
              data: revenueHistory.map(r => r.revenue)
            }]}
          />
          <div className="col-span-12 xl:col-span-4">
            <ServiceHealth />
          </div>
        </div>

        {/* Recent Users & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentUsersTable users={tableUsers} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/admin/users" className="block w-full text-center py-2 px-4 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition">
                จัดการผู้ใช้
              </Link>
              <Link href="/admin/payments" className="block w-full text-center py-2 px-4 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition">
                ตรวจสอบสลิป ({stats.pendingPayments})
              </Link>
              <Link href="/admin/packages" className="block w-full text-center py-2 px-4 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition">
                จัดการแพ็กเกจ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
