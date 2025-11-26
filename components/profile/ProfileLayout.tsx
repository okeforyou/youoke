import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { FiUser, FiClock, FiSettings } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import Icon from "../Icon";
import UserRoute from "../UserRoute";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

interface TabItem {
  label: string;
  href: string;
  icon: typeof FiUser;
}

const tabs: TabItem[] = [
  {
    label: "ข้อมูลส่วนตัว",
    href: "/profile",
    icon: FiUser,
  },
  {
    label: "ประวัติการชำระเงิน",
    href: "/profile/history",
    icon: FiClock,
  },
  {
    label: "ตั้งค่า",
    href: "/profile/settings",
    icon: FiSettings,
  },
];

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/profile") {
      return router.pathname === "/profile";
    }
    return router.pathname.startsWith(href);
  };

  return (
    <UserRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            <h1 className="text-3xl font-bold text-gray-900">บัญชีของฉัน</h1>
            <p className="text-gray-600 mt-1">
              {user?.displayName || user?.email}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 max-w-5xl">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <Link key={tab.href} href={tab.href}>
                    <div
                      className={`
                        flex items-center gap-2 px-4 py-4 border-b-2 font-medium whitespace-nowrap cursor-pointer
                        transition-colors duration-200
                        ${
                          active
                            ? "border-red-500 text-red-600"
                            : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                        }
                      `}
                    >
                      <Icon icon={tab.icon} size={18} />
                      <span>{tab.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {children}
        </div>
      </div>
    </UserRoute>
  );
};

export default ProfileLayout;
