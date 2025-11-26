import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiMail, FiUser, FiCalendar, FiCheck, FiStar } from "react-icons/fi";

import Icon from "../../components/Icon";
import ProfileLayout from "../../components/profile/ProfileLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";

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

const ProfilePage: React.FC = () => {
  const { user, logOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Check cache first (5 minutes TTL)
      const cacheKey = `profile_${user!.uid}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < 5 * 60 * 1000) { // 5 minutes
          setProfile(data.profile);
          setPlan(data.plan);
          setLoading(false);
          return;
        }
      }

      // Parallel fetch (much faster!)
      const [userDoc, tierData] = await Promise.all([
        getDoc(doc(db, "users", user!.uid)),
        user?.tier ? getDoc(doc(db, "plans", user.tier)) : Promise.resolve(null),
      ]);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);

        let planData = null;

        // If tier changed, fetch new plan
        if (userData.tier && (!user?.tier || userData.tier !== user.tier)) {
          const planDoc = await getDoc(doc(db, "plans", userData.tier));
          if (planDoc.exists()) {
            planData = planDoc.data() as Plan;
            setPlan(planData);
          }
        } else if (tierData?.exists()) {
          planData = tierData.data() as Plan;
          setPlan(planData);
        }

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: { profile: userData, plan: planData },
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTierBadge = (tier: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      free: { label: "Free", color: "bg-gray-100 text-gray-800" },
      monthly: { label: "รายเดือน", color: "bg-blue-100 text-blue-800" },
      yearly: { label: "รายปี", color: "bg-green-100 text-green-800" },
      lifetime: { label: "ตลอดชีพ", color: "bg-purple-100 text-purple-800" },
    };

    const badge = badges[tier] || badges.free;
    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">ข้อมูลส่วนตัว</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Icon icon={FiUser} size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ชื่อผู้ใช้</p>
                <p className="font-medium text-gray-900">
                  {profile?.displayName || "ไม่ได้ระบุ"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon icon={FiMail} size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">อีเมล</p>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Icon icon={FiCalendar} size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">สมาชิกเมื่อ</p>
                <p className="font-medium text-gray-900">
                  {formatDate(profile?.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            สถานะสมาชิก
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <Icon icon={FiStar} size={32} className="text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">แพ็คเกจปัจจุบัน</p>
              <div className="mt-1">
                {profile?.tier && getTierBadge(profile.tier)}
              </div>
            </div>
          </div>

          {profile?.isPremium && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-800">
                <Icon icon={FiCheck} />
                <span className="font-medium">สมาชิกพรีเมียม</span>
              </div>
              {profile.subscriptionExpiry && (
                <p className="text-sm text-green-700 mt-2">
                  หมดอายุ: {formatDate(profile.subscriptionExpiry)}
                </p>
              )}
              {profile.tier === "lifetime" && (
                <p className="text-sm text-green-700 mt-2">
                  สมาชิกตลอดชีพ - ไม่มีวันหมดอายุ
                </p>
              )}
            </div>
          )}

          {/* Plan Features */}
          {plan && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                สิทธิประโยชน์
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">ห้องสูงสุด</span>
                  <span className="font-bold text-gray-900">
                    {plan.maxRooms} ห้อง
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">เพลงในคิวสูงสุด</span>
                  <span className="font-bold text-gray-900">
                    {plan.maxSongsInQueue} เพลง
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">ฟีเจอร์</h3>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Icon
                      icon={FiCheck}
                      className="text-green-500 mt-1 flex-shrink-0"
                    />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upgrade Button for Free Users */}
          {profile?.tier === "free" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href="/pricing"
                className="block w-full bg-red-500 text-white text-center px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                อัปเกรดเป็นสมาชิกพรีเมียม
              </a>
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfilePage;
