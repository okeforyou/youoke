import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { UserCircleIcon, CalendarIcon, CreditCardIcon, CogIcon } from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

interface UserProfile {
  displayName: string;
  tier: string;
  isPremium: boolean;
  createdAt: any;
}

const ProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user!.uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-10 h-10 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {profile?.displayName || "ผู้ใช้"}
            </h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-700">
            สมาชิกเมื่อ: {profile?.createdAt?.toDate?.().toLocaleDateString("th-TH") || "N/A"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-700 mr-2">แพ็คเกจ:</span>
          {profile?.tier && getTierBadge(profile.tier)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/profile"
          className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors text-center"
        >
          <UserCircleIcon className="w-6 h-6 mx-auto mb-2" />
          <span className="text-sm font-medium">ข้อมูลส่วนตัว</span>
        </a>
        <a
          href="/profile/history"
          className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors text-center"
        >
          <CreditCardIcon className="w-6 h-6 mx-auto mb-2" />
          <span className="text-sm font-medium">ประวัติการชำระเงิน</span>
        </a>
        <a
          href="/profile/settings"
          className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors text-center"
        >
          <CogIcon className="w-6 h-6 mx-auto mb-2" />
          <span className="text-sm font-medium">ตั้งค่า</span>
        </a>
        {profile?.tier === "free" && (
          <a
            href="/pricing"
            className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors text-center"
          >
            <span className="text-lg mb-1 block">⭐</span>
            <span className="text-sm font-medium">อัปเกรด</span>
          </a>
        )}
      </div>

      {/* Info */}
      {profile?.isPremium && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✅ คุณเป็นสมาชิกพรีเมียม - ขอบคุณที่สนับสนุน!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
