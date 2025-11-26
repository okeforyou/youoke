import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  UserCircleIcon,
  CalendarIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { updateProfile, updatePassword } from "firebase/auth";

import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase";

interface UserProfile {
  email: string;
  displayName: string;
  role: string;
  tier: string;
  isPremium: boolean;
  isActive: boolean;
  createdAt: any;
  subscriptionExpiry?: any;
}

interface Plan {
  displayName: string;
  maxRooms: number;
  maxSongsInQueue: number;
  features: string[];
}

interface Payment {
  id: string;
  amount: number;
  planId: string;
  planName?: string;
  status: "pending" | "approved" | "rejected";
  slipUrl?: string;
  note?: string;
  createdAt: any;
  approvedAt?: any;
  rejectedAt?: any;
  rejectionReason?: string;
}

const ProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form states
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchAllData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch user profile first (fast)
      const userDoc = await getDoc(doc(db, "users", user!.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);

        // Fetch plan details
        if (userData.tier) {
          const planDoc = await getDoc(doc(db, "plans", userData.tier));
          if (planDoc.exists()) {
            setPlan(planDoc.data() as Plan);
          }
        }
      }

      setLoading(false);

      // Fetch payments in background (lazy load)
      try {
        const paymentsQuery = query(
          collection(db, "payments"),
          where("userId", "==", user!.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(paymentsQuery);
        const paymentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Payment[];
        setPayments(paymentsData);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTierBadge = (tier: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      free: { label: "Free", color: "bg-gray-500" },
      monthly: { label: "รายเดือน", color: "bg-blue-500" },
      yearly: { label: "รายปี", color: "bg-green-500" },
      lifetime: { label: "ตลอดชีพ", color: "bg-purple-500" },
    };

    const badge = badges[tier] || badges.free;
    return (
      <span
        className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            <ClockIcon className="w-3 h-3" />
            รอตรวจสอบ
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircleIcon className="w-3 h-3" />
            อนุมัติ
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircleIcon className="w-3 h-3" />
            ปฏิเสธ
          </span>
        );
      default:
        return null;
    }
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !auth.currentUser) return;

    try {
      setSavingName(true);
      await updateProfile(auth.currentUser, { displayName });
      await updateDoc(doc(db, "users", user.uid), { displayName });
      alert("อัปเดตชื่อสำเร็จ!");
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setSavingPassword(true);
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      alert("เปลี่ยนรหัสผ่านสำเร็จ!");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        alert("กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ เพื่อเปลี่ยนรหัสผ่าน");
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-3 space-y-3">
      {/* Profile Info */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <UserCircleIcon className="w-8 h-8 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">
            {profile?.displayName || "ผู้ใช้"}
          </h2>
          <p className="text-xs text-gray-600 truncate">{user?.email}</p>
        </div>
        {profile?.tier && getTierBadge(profile.tier)}
      </div>

      {/* Stats */}
      {plan && (
        <div className="grid grid-cols-2 gap-2 text-xs pb-3 border-b border-gray-200">
          <div className="text-gray-700">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            {formatDate(profile?.createdAt)}
          </div>
          <div className="text-gray-700">
            <span className="font-semibold">{plan.maxRooms}</span> ห้อง / <span className="font-semibold">{plan.maxSongsInQueue}</span> เพลง
          </div>
        </div>
      )}

      {profile?.tier === "free" && (
        <a
          href="/pricing"
          className="block w-full bg-red-500 text-white text-center px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
        >
          ⭐ อัปเกรดเป็นพรีเมียม
        </a>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="pb-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            ประวัติการชำระเงิน ({payments.length})
          </h3>
          <div className="space-y-2">
            {payments.slice(0, 3).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-medium text-gray-900 truncate">
                    {payment.planName || payment.planId}
                  </p>
                  <p className="text-gray-600">
                    ฿{payment.amount.toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(payment.status)}
              </div>
            ))}
            {payments.length > 3 && (
              <a
                href="/profile/history"
                className="block text-center text-xs text-blue-600 hover:text-blue-800"
              >
                ดูทั้งหมด
              </a>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2">การตั้งค่า</h3>

        {/* Update Name */}
        <form onSubmit={handleUpdateDisplayName} className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            เปลี่ยนชื่อผู้ใช้
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
              placeholder="ชื่อผู้ใช้"
              required
            />
            <button
              type="submit"
              disabled={savingName || !displayName}
              className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {savingName ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>

        {/* Update Password */}
        <form onSubmit={handleUpdatePassword}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            เปลี่ยนรหัสผ่าน
          </label>
          <div className="space-y-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              minLength={6}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
              placeholder="ยืนยันรหัสผ่านใหม่"
              minLength={6}
            />
            {newPassword &&
              confirmPassword &&
              newPassword !== confirmPassword && (
                <p className="text-xs text-red-600">รหัสผ่านไม่ตรงกัน</p>
              )}
            <button
              type="submit"
              disabled={
                savingPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="w-full px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {savingPassword ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
