import React from "react";
import Link from "next/link";
import {
  UsersIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  XMarkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { GetServerSideProps } from "next";
import nookies from "nookies";
import AdminLayout from "../layouts/AdminLayout";
import { adminAuth, adminDb, adminFirestore } from "../../../../firebase-admin";

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

interface RecentActivity {
  id: string;
  type: "user" | "payment";
  action: string;
  timestamp: any;
  details: string;
}

// Serialized version for SSR
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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  </div>
);

const AdminDashboard: React.FC<Props> = ({ stats, recentActivities: serializedActivities, error }) => {
  // Convert serialized activities back to objects with proper dates
  const recentActivities = serializedActivities.map(a => ({
    ...a,
    timestamp: a.timestamp ? new Date(a.timestamp) : null,
  }));

  // Show error if any
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมระบบ YouOke</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            icon={<UsersIcon className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            subtitle={`${stats.adminUsers} admins, ${stats.freeUsers} free`}
          />
          <StatCard
            title="Premium Users"
            value={stats.premiumUsers}
            icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
            color="bg-green-500"
            subtitle={`${stats.monthlySubscribers}M + ${stats.yearlySubscribers}Y + ${stats.lifetimeSubscribers}L`}
          />
          <StatCard
            title="Total Revenue"
            value={`${stats.totalRevenue.toLocaleString()} ฿`}
            icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
            color="bg-purple-500"
            subtitle={`${stats.approvedPayments} approved payments`}
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={<ClockIcon className="w-6 h-6 text-white" />}
            color="bg-orange-500"
            subtitle={`${stats.rejectedPayments} rejected`}
          />
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats.approvedPayments}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg shadow p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-900">{stats.pendingPayments}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejectedPayments}</p>
              </div>
              <XMarkIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Subscription Breakdown
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Monthly Subscribers</span>
              <span className="font-bold text-blue-600">{stats.monthlySubscribers}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Yearly Subscribers</span>
              <span className="font-bold text-green-600">{stats.yearlySubscribers}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-700">Lifetime Members</span>
              <span className="font-bold text-purple-600">{stats.lifetimeSubscribers}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 font-bold">Total Premium</span>
              <span className="font-bold text-red-600">{stats.premiumUsers}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${activity.type === "payment"
                      ? "bg-green-100"
                      : "bg-blue-100"
                      }`}
                  >
                    {activity.type === "payment" ? (
                      <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <UsersIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.timestamp
                        ? activity.timestamp.toLocaleString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <UsersIcon className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-700">Manage Users</span>
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-700">Verify Payments</span>
            </Link>
            <Link
              href="/admin/subscriptions"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-700">Manage Plans</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};


// Logic moved to component
// getServerSideProps removed (handled in page wrapper)

export default AdminDashboard;
