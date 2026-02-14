import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../layouts/AdminLayout";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  duration: number | null;
  features: string[];
  maxRooms: number;
  maxSongsInQueue: number;
  isActive: boolean;
  isVisible: boolean;
}

const SubscriptionsPage: React.FC = () => {
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState<Omit<Plan, "id">>({
    name: "",
    displayName: "",
    price: 0,
    currency: "THB",
    duration: 30,
    features: [],
    maxRooms: 1,
    maxSongsInQueue: 10,
    isActive: true,
    isVisible: true,
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, "plans"));
        const querySnapshot = await getDocs(q);
        const fetchedPlans = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];

        // Sort: Core plans first
        const corePlans = ["free", "monthly", "yearly", "lifetime"];
        fetchedPlans.sort((a, b) => {
          const indexA = corePlans.indexOf(a.id);
          const indexB = corePlans.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });

        setPlans(fetchedPlans);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load plans. Please try again.");
        toast?.error("Failed to load plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);


  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    setIsSaving(true);
    try {
      const planRef = doc(db, "plans", editingPlan.id);
      await updateDoc(planRef, {
        displayName: editingPlan.displayName,
        price: editingPlan.price,
        duration: editingPlan.duration,
        features: editingPlan.features,
        maxRooms: editingPlan.maxRooms,
        maxSongsInQueue: editingPlan.maxSongsInQueue,
        isActive: editingPlan.isActive,
        isVisible: editingPlan.isVisible,
        updatedAt: Timestamp.now(),
      });

      toast?.success("อัปเดตแผนเรียบร้อยแล้ว!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast?.error("เกิดข้อผิดพลาดในการอัปเดตแผน");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlanStatus = async (plan: Plan, field: "isActive" | "isVisible") => {
    setTogglingPlanId(plan.id);
    try {
      const planRef = doc(db, "plans", plan.id);
      const newValue = !plan[field];
      await updateDoc(planRef, {
        [field]: newValue,
        updatedAt: Timestamp.now(),
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast?.error("เกิดข้อผิดพลาดในการอัปเดตแผน");
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    // Prevent deletion of core plans
    const corePlans = ["free", "monthly", "yearly", "lifetime"];
    if (corePlans.includes(plan.id)) {
      toast?.warning(`ไม่สามารถลบ Plan "${plan.displayName}" ได้ - นี่คือ Plan หลักของระบบ`);
      return;
    }

    if (!confirm(`ยืนยันการลบ Plan "${plan.displayName}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const planRef = doc(db, "plans", plan.id);
      await deleteDoc(planRef);

      toast?.success("ลบ Plan เรียบร้อยแล้ว");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast?.error("เกิดข้อผิดพลาดในการลบ Plan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.displayName) {
      toast?.warning("กรุณากรอก Plan ID และชื่อแสดงผล");
      return;
    }

    setIsCreating(true);
    try {
      const planRef = doc(db, "plans", newPlan.name);
      await setDoc(planRef, {
        ...newPlan,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast?.success("สร้างแผนใหม่เรียบร้อยแล้ว!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error creating plan:", error);
      toast?.error("เกิดข้อผิดพลาดในการสร้างแผน");
    } finally {
      setIsCreating(false);
    }
  };

  const addFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({
      ...editingPlan,
      features: newFeatures,
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    });
  };

  const addNewPlanFeature = () => {
    setNewPlan({
      ...newPlan,
      features: [...newPlan.features, ""],
    });
  };

  const updateNewPlanFeature = (index: number, value: string) => {
    const newFeatures = [...newPlan.features];
    newFeatures[index] = value;
    setNewPlan({
      ...newPlan,
      features: newFeatures,
    });
  };

  const removeNewPlanFeature = (index: number) => {
    setNewPlan({
      ...newPlan,
      features: newPlan.features.filter((_, i) => i !== index),
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <ArrowPathIcon className="w-8 h-8 text-red-500 animate-spin" />
            <p className="text-gray-500 animate-pulse">Loading plans...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              จัดการแผนสมาชิก (Subscription Plans)
            </h1>
            <p className="text-gray-600 mt-1">
              จัดการแพ็คเกจสมาชิกทั้งหมด ({plans.length} แผน)
            </p>
          </div>
          <button
            onClick={() => setCreatingPlan(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            สร้างแผนใหม่
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${plan.id === "yearly"
                ? "border-green-500"
                : plan.id === "lifetime"
                  ? "border-purple-500"
                  : "border-gray-200"
                }`}
            >
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <h3 className="text-2xl font-bold">{plan.displayName}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg ml-2">{plan.currency}</span>
                </div>
                {plan.duration && (
                  <p className="text-sm mt-1 opacity-90">
                    / {plan.duration} {plan.duration === 30 ? "วัน" : "วัน"}
                  </p>
                )}
                {!plan.duration && plan.id === "lifetime" && (
                  <p className="text-sm mt-1 opacity-90">ตลอดชีพ</p>
                )}
              </div>

              {/* Plan Features */}
              <div className="p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckIcon className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">ห้องสูงสุด (Rooms):</span>
                    <span className="font-bold">{plan.maxRooms}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">คิวเพลงสูงสุด (Queue):</span>
                    <span className="font-bold">{plan.maxSongsInQueue}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => togglePlanStatus(plan, "isActive")}
                    disabled={togglingPlanId === plan.id}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${plan.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {togglingPlanId === plan.id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin inline" />
                    ) : (
                      plan.isActive ? "เปิดขาย" : "ปิด"
                    )}
                  </button>
                  <button
                    onClick={() => togglePlanStatus(plan, "isVisible")}
                    disabled={togglingPlanId === plan.id}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${plan.isVisible
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {togglingPlanId === plan.id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin inline" />
                    ) : (
                      plan.isVisible ? <EyeIcon className="w-5 h-5 inline" /> : <EyeSlashIcon className="w-5 h-5 inline" />
                    )}
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="w-full mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <PencilIcon className="w-5 h-5" />
                  แก้ไขแผน
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              แก้ไขแผน: {editingPlan.displayName}
            </h2>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแสดงผล (Display Name - Thai)
                </label>
                <input
                  type="text"
                  value={editingPlan.displayName}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา (THB)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระยะเวลา (วัน)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.duration || ""}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        duration: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="ว่างไว้ = ตลอดชีพ"
                  />
                </div>
              </div>

              {/* Max Rooms & Songs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนห้องสูงสุด (Max Rooms)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.maxRooms}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxRooms: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คิวเพลงสูงสุด (Max Queue)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.maxSongsInQueue}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxSongsInQueue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ฟีเจอร์ (Features)
                </label>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => removeFeature(idx)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    + เพิ่มฟีเจอร์
                  </button>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">เปิดขาย (Active)</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlan.isVisible}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        isVisible: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">แสดงผล (Visible)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleSavePlan}
                  disabled={isSaving}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึกการเปลี่ยนแปลง"
                  )}
                </button>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
              {!["free", "monthly", "yearly", "lifetime"].includes(editingPlan.id) && (
                <button
                  onClick={() => handleDeletePlan(editingPlan)}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-5 h-5" />
                      ลบแผนนี้
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {creatingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              สร้างแผนใหม่ (Create New Plan)
            </h2>

            <div className="space-y-4">
              {/* Plan ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan ID (English, lowercase, no spaces)
                </label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value.toLowerCase().replace(/\s/g, "_") })
                  }
                  placeholder="e.g., weekly, premium, vip"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ใช้สำหรับอ้างอิงในระบบ (ห้ามซ้ำ)
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแสดงผล (Display Name - Thai)
                </label>
                <input
                  type="text"
                  value={newPlan.displayName}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, displayName: e.target.value })
                  }
                  placeholder="e.g., แพ็คเกจสัปดาห์"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา (THB)
                  </label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระยะเวลา (วัน)
                  </label>
                  <input
                    type="number"
                    value={newPlan.duration || ""}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        duration: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="ว่างไว้ = ตลอดชีพ"
                  />
                </div>
              </div>

              {/* Max Rooms & Songs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนห้องสูงสุด (Max Rooms)
                  </label>
                  <input
                    type="number"
                    value={newPlan.maxRooms}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        maxRooms: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คิวเพลงสูงสุด (Max Queue)
                  </label>
                  <input
                    type="number"
                    value={newPlan.maxSongsInQueue}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        maxSongsInQueue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ฟีเจอร์ (Features)
                </label>
                <div className="space-y-2">
                  {newPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateNewPlanFeature(idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => removeNewPlanFeature(idx)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addNewPlanFeature}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    + เพิ่มฟีเจอร์
                  </button>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.isActive}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">เปิดขาย (Active)</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.isVisible}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        isVisible: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">แสดงผล (Visible)</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreatePlan}
                disabled={isCreating}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  "สร้างแผน"
                )}
              </button>
              <button
                onClick={() => setCreatingPlan(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// Server-Side Props
// getServerSideProps removed (handled in wrapper)


export default SubscriptionsPage;
