import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiSettings,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import { IconType } from "react-icons";

import { useAuth } from "../../context/AuthContext";
import Icon from "../Icon";

interface MenuItem {
  label: string;
  href: string;
  icon: IconType;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: FiHome,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: FiUsers,
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: FiDollarSign,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: FiCheckCircle,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: FiSettings,
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const router = useRouter();
  const { user, logOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Link href="/admin">
            <span className="text-xl font-bold text-red-500 cursor-pointer">
              YouOke Admin
            </span>
          </Link>
          <button
            onClick={onToggle}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Icon icon={FiX} size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <p className="text-sm text-gray-400">ผู้ดูแลระบบ</p>
          <p className="font-medium truncate">{user?.displayName || user?.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            {user?.role} • {user?.tier}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${
                    isActive(item.href)
                      ? "bg-red-500 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                <Icon icon={item.icon} size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
          >
            <Icon icon={FiLogOut} size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
