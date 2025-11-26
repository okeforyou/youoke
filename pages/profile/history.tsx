import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FiClock, FiCheck, FiX, FiFileText } from "react-icons/fi";

import Icon from "../../components/Icon";
import ProfileLayout from "../../components/profile/ProfileLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";

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

const PaymentHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
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
    } finally {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            <Icon icon={FiClock} size={14} />
            รอตรวจสอบ
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <Icon icon={FiCheck} size={14} />
            อนุมัติแล้ว
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <Icon icon={FiX} size={14} />
            ถูกปฏิเสธ
          </span>
        );
      default:
        return null;
    }
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
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ประวัติการชำระเงิน
          </h2>
          <p className="text-gray-600 mt-1">
            รายการชำระเงินทั้งหมด ({payments.length} รายการ)
          </p>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Icon icon={FiFileText} size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ยังไม่มีประวัติการชำระเงิน
            </h3>
            <p className="text-gray-600 mb-6">
              คุณยังไม่เคยทำการชำระเงินในระบบ
            </p>
            <a
              href="/pricing"
              className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              ดูแพ็คเกจ
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {payment.planName || payment.planId}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        จำนวนเงิน:{" "}
                        <span className="font-medium text-gray-900">
                          {payment.amount.toLocaleString()} บาท
                        </span>
                      </p>
                      <p className="text-gray-600">
                        วันที่: {formatDate(payment.createdAt)}
                      </p>
                      {payment.note && (
                        <p className="text-gray-600">
                          หมายเหตุ: {payment.note}
                        </p>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {payment.status === "rejected" &&
                      payment.rejectionReason && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">เหตุผลที่ปฏิเสธ:</span>{" "}
                            {payment.rejectionReason}
                          </p>
                        </div>
                      )}

                    {/* Approved Date */}
                    {payment.status === "approved" && payment.approvedAt && (
                      <p className="text-sm text-green-700 mt-2">
                        อนุมัติเมื่อ: {formatDate(payment.approvedAt)}
                      </p>
                    )}
                  </div>

                  {/* View Slip Button */}
                  {payment.slipUrl && (
                    <a
                      href={payment.slipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      ดูสลิป
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
};

export default PaymentHistoryPage;
