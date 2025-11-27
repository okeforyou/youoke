import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiX,
  FiClock,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";

import Icon from "../../components/Icon";

import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";
import { exportToCSV, flattenForCSV } from "../../utils/exportCSV";

interface Payment {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  planId: string;
  planName?: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  paymentMethod: string;
  transactionId?: string;
  slipUrl?: string;
  note?: string;
  createdAt: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  rejectionReason?: string;
}

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, filterStatus]);

  const fetchPayments = async (skipCache = false) => {
    try {
      setLoading(true);

      // Check cache first (5 minutes TTL)
      const cacheKey = "admin_payments";
      if (!skipCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < 5 * 60 * 1000) {
            // Cache is fresh
            setPayments(data);
            setLoading(false);

            // Refresh in background
            setTimeout(() => fetchPayments(true), 100);
            return;
          }
        }
      }

      // Fetch from Firestore
      const paymentsQuery = query(
        collection(db, "payments"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(paymentsQuery);

      const paymentsData = await Promise.all(
        snapshot.docs.map(async (paymentDoc) => {
          const data = paymentDoc.data();

          // Fetch user and plan data in parallel
          const [userDoc, planDoc] = await Promise.all([
            data.userId ? getDoc(doc(db, "users", data.userId)).catch(() => null) : Promise.resolve(null),
            data.planId ? getDoc(doc(db, "plans", data.planId)).catch(() => null) : Promise.resolve(null),
          ]);

          // Extract user data
          let userEmail = "Unknown";
          let userName = "Unknown";
          if (userDoc?.exists()) {
            const userData = userDoc.data();
            userEmail = userData.email || "Unknown";
            userName = userData.displayName || userData.email || "Unknown";
          }

          // Extract plan name
          let planName = data.planId;
          if (planDoc?.exists()) {
            planName = planDoc.data().displayName || data.planId;
          }

          return {
            id: paymentDoc.id,
            ...data,
            userEmail,
            userName,
            planName,
          } as Payment;
        })
      );

      setPayments(paymentsData);

      // Cache the result
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: paymentsData,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error fetching payments:", error);
      // If payments collection doesn't exist yet, just set empty array
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    setFilteredPayments(filtered);
  };

  const handleApprovePayment = async (payment: Payment) => {
    if (!confirm("ยืนยันการอนุมัติการชำระเงินนี้?")) return;

    try {
      // Update payment status
      const paymentRef = doc(db, "payments", payment.id);
      await updateDoc(paymentRef, {
        status: "approved",
        approvedAt: Timestamp.now(),
        approvedBy: "admin", // TODO: Use actual admin user ID
        updatedAt: Timestamp.now(),
      });

      // Update user subscription
      const userRef = doc(db, "users", payment.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const planDoc = await getDoc(doc(db, "plans", payment.planId));
        const planData = planDoc.data();

        let subscriptionExpiry = null;
        if (planData?.duration) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + planData.duration);
          subscriptionExpiry = Timestamp.fromDate(expiryDate);
        }

        await updateDoc(userRef, {
          tier: payment.planId,
          isPremium: true,
          isActive: true,
          subscriptionStart: Timestamp.now(),
          subscriptionExpiry,
          updatedAt: Timestamp.now(),
        });
      }

      // Clear cache and refresh payments
      localStorage.removeItem("admin_payments");
      await fetchPayments(true);
      setViewingPayment(null);
      alert("Payment approved successfully!");
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("Error approving payment");
    }
  };

  const handleRejectPayment = async (payment: Payment) => {
    if (!rejectionReason.trim()) {
      alert("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    if (!confirm("ยืนยันการปฏิเสธการชำระเงินนี้?")) return;

    try {
      const paymentRef = doc(db, "payments", payment.id);
      await updateDoc(paymentRef, {
        status: "rejected",
        rejectedAt: Timestamp.now(),
        rejectedBy: "admin", // TODO: Use actual admin user ID
        rejectionReason,
        updatedAt: Timestamp.now(),
      });

      // Clear cache and refresh payments
      localStorage.removeItem("admin_payments");
      await fetchPayments(true);
      setViewingPayment(null);
      setRejectionReason("");
      alert("Payment rejected");
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("Error rejecting payment");
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (payment.status === "approved") {
      if (!confirm("การชำระเงินนี้ได้รับการอนุมัติแล้ว\n\nยืนยันที่จะลบ?")) {
        return;
      }
    }

    if (!confirm(`ยืนยันการลบรายการชำระเงินของ "${payment.userName}"?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
      return;
    }

    try {
      const paymentRef = doc(db, "payments", payment.id);
      await deleteDoc(paymentRef);

      // Update local state
      setPayments((prev) => prev.filter((p) => p.id !== payment.id));

      // Clear cache to force refresh on next load
      localStorage.removeItem("admin_payments");

      // Close modal if viewing this payment
      if (viewingPayment?.id === payment.id) {
        setViewingPayment(null);
      }

      alert("ลบรายการชำระเงินเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("เกิดข้อผิดพลาดในการลบรายการชำระเงิน");
    }
  };

  const handleExportCSV = () => {
    // Use filtered payments for export
    const dataToExport = filteredPayments.map((payment) => {
      // Remove slipUrl from export (it's a URL, not useful in CSV)
      const { slipUrl, ...paymentData } = payment;
      return flattenForCSV(paymentData);
    });
    exportToCSV(dataToExport, "payments");
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            <Icon icon={FiClock} /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <Icon icon={FiCheck} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <Icon icon={FiX} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
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
              Payment Verification
            </h1>
            <p className="text-gray-600 mt-1">
              ตรวจสอบและอนุมัติการชำระเงิน ({filteredPayments.length} /{" "}
              {payments.length})
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Icon icon={FiDownload} />
              Export CSV
            </button>
            <button
              onClick={() => fetchPayments(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Icon icon={FiRefreshCw} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-900">
                  {payments.filter((p) => p.status === "pending").length}
                </p>
              </div>
              <Icon icon={FiClock} size={32} className="text-orange-500" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900">
                  {payments.filter((p) => p.status === "approved").length}
                </p>
              </div>
              <Icon icon={FiCheck} size={32} className="text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">
                  {payments.filter((p) => p.status === "rejected").length}
                </p>
              </div>
              <Icon icon={FiX} size={32} className="text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <Icon icon={FiFilter} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">ไม่มีรายการชำระเงิน</p>
            <p className="text-sm text-gray-400 mt-2">
              รายการจะแสดงที่นี่เมื่อมีผู้ใช้ส่งหลักฐานการชำระเงิน
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {payment.planName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {payment.amount} {payment.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setViewingPayment(payment)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Icon icon={FiEye} size={18} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Payment Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Payment Details
              </h2>
              {getStatusBadge(viewingPayment.status)}
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">User Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">{viewingPayment.userName}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="font-medium">{viewingPayment.userEmail}</span>
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">
                  Payment Information
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600">Plan:</span>{" "}
                    <span className="font-medium">{viewingPayment.planName}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Amount:</span>{" "}
                    <span className="font-bold text-lg">
                      {viewingPayment.amount} {viewingPayment.currency}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Method:</span>{" "}
                    <span className="font-medium">
                      {viewingPayment.paymentMethod}
                    </span>
                  </p>
                  {viewingPayment.transactionId && (
                    <p>
                      <span className="text-gray-600">Transaction ID:</span>{" "}
                      <span className="font-mono text-xs">
                        {viewingPayment.transactionId}
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="text-gray-600">Submitted:</span>{" "}
                    <span className="font-medium">
                      {formatDate(viewingPayment.createdAt)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Slip */}
              {viewingPayment.slipUrl && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Payment Slip</h3>
                  <img
                    src={viewingPayment.slipUrl}
                    alt="Payment Slip"
                    className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {/* Note */}
              {viewingPayment.note && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-bold text-gray-900 mb-2">Note</h3>
                  <p className="text-sm text-gray-700">{viewingPayment.note}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {viewingPayment.status === "rejected" &&
                viewingPayment.rejectionReason && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h3 className="font-bold text-red-900 mb-2">
                      Rejection Reason
                    </h3>
                    <p className="text-sm text-red-700">
                      {viewingPayment.rejectionReason}
                    </p>
                  </div>
                )}

              {/* Actions for Pending Payments */}
              {viewingPayment.status === "pending" && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (ถ้าปฏิเสธ)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="ระบุเหตุผลในการปฏิเสธ..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprovePayment(viewingPayment)}
                      className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Icon icon={FiCheck} size={20} />
                      Approve Payment
                    </button>
                    <button
                      onClick={() => handleRejectPayment(viewingPayment)}
                      className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Icon icon={FiX} size={20} />
                      Reject Payment
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Close and Delete Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setViewingPayment(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDeletePayment(viewingPayment)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Icon icon={FiTrash2} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PaymentsPage;
