import React, { useState } from "react";
import { FiMenu } from "react-icons/fi";

import AdminRoute from "../AdminRoute";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AdminRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiMenu size={24} />
            </button>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminLayout;
