import { useRouter } from "next/router";
import React, { useEffect } from "react";

import { useAuth } from "../context/AuthContext";

interface UserRouteProps {
  children: React.ReactNode;
}

/**
 * UserRoute - Protect routes that require authentication
 * Only allows access to logged-in users (any role)
 */
const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user?.uid) {
      router.push("/login?redirect=" + router.pathname);
      return;
    }
  }, [router, user]);

  // Show loading while checking authentication
  if (!user?.uid) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserRoute;
