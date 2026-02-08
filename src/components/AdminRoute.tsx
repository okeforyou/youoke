import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { useAuth } from "../context/AuthContext";

/**
 * AdminRoute Component
 *
 * Protects admin routes - only allows access to users with role='admin'
 * Redirects to login if not authenticated
 * Redirects to home if authenticated but not admin
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Not logged in - redirect to login
    if (!user?.uid) {
      router.push("/login?redirect=/admin");
      return;
    }

    // Logged in but not admin - redirect to home
    if (user.role !== 'admin') {
      router.push("/");
      return;
    }
  }, [router, user]);

  // Show content only if user is admin
  if (!user?.uid || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-white mt-4">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
