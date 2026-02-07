import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../layouts/AdminLayout';
import { AdminService } from '../services/adminService';
import { cn } from '../../../utils/cn';

interface PaymentSlip {
  id: string;
  userId: string;
  userDisplayName?: string;
  packageName: string;
  packageId: string;
  amount: number;
  slipUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  rejectionReason?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSlip, setSelectedSlip] = useState<PaymentSlip | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getPaymentProofs();
      setPayments(data as PaymentSlip[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSlip) return;
    if (!confirm(`Approve payment for ${selectedSlip.userDisplayName || 'User'}?`)) return;

    try {
      await AdminService.approvePayment(selectedSlip.id, selectedSlip.userId, selectedSlip.packageId, 'admin');
      alert("Payment Approved!");
      setSelectedSlip(null);
      fetchPayments();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedSlip) return;
    const reason = prompt("Rejection Reason:");
    if (!reason) return;

    try {
      await AdminService.rejectPayment(selectedSlip.id, selectedSlip.userId, reason, 'admin');
      alert("Payment Rejected");
      setSelectedSlip(null);
      fetchPayments();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const filterPayments = payments.filter(p => filter === 'all' || p.status === filter);

  return (
    <AdminLayout>
      <Head>
        <title>Payments - Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
            <p className="text-sm text-gray-500">Verify slips and approve subscriptions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs uppercase font-bold">Total</div>
            <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100">
            <div className="text-orange-600 text-xs uppercase font-bold">Pending</div>
            <div className="text-2xl font-bold text-orange-700">{payments.filter(p => p.status === 'pending').length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100">
            <div className="text-green-600 text-xs uppercase font-bold">Approved</div>
            <div className="text-2xl font-bold text-green-700">{payments.filter(p => p.status === 'approved').length}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
            <div className="text-red-600 text-xs uppercase font-bold">Rejected</div>
            <div className="text-2xl font-bold text-red-700">{payments.filter(p => p.status === 'rejected').length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-transparent p-0 gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <a
              key={tab}
              className={cn("tab tab-md rounded-lg", filter === tab ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-100")}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </a>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filterPayments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No payments found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filterPayments.map(payment => (
              <div key={payment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                      {payment.userDisplayName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 truncate max-w-[100px]">{payment.userDisplayName || 'User'}</div>
                      <div className="text-xs text-gray-500 font-mono">{payment.amount.toLocaleString()} ฿</div>
                    </div>
                  </div>
                  <div className={cn("badge badge-sm border-0",
                    payment.status === 'pending' ? "bg-orange-100 text-orange-700" :
                      payment.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {payment.status}
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Package</span>
                      <span className="font-medium text-gray-900">{payment.packageName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-900">{payment.createdAt?.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedSlip(payment)}
                    className="btn btn-sm w-full btn-outline border-gray-300 text-gray-700 hover:bg-white hover:text-primary hover:border-primary"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" /> View Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedSlip(null)}>
          <div className="bg-white max-w-4xl w-full rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex-1 bg-black flex items-center justify-center p-4">
              <img src={selectedSlip.slipUrl} alt="Slip" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="w-full md:w-80 p-6 flex flex-col border-l border-gray-200 bg-white">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Payment Details</h3>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">User</label>
                  <div className="text-gray-900 font-medium">{selectedSlip.userDisplayName || 'Unknown'}</div>
                  <div className="text-xs text-gray-400 font-mono">{selectedSlip.userId}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Package</label>
                  <div className="text-gray-900 font-medium">{selectedSlip.packageName}</div>
                  <div className="text-primary font-bold text-lg">{selectedSlip.amount.toLocaleString()} ฿</div>
                </div>
                {selectedSlip.status === 'rejected' && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="text-red-700 text-xs font-bold mb-1">Rejection Reason</div>
                    <div className="text-red-600 text-sm">{selectedSlip.rejectionReason}</div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                {selectedSlip.status === 'pending' ? (
                  <>
                    <button onClick={handleApprove} className="btn btn-primary w-full text-white">
                      <CheckCircleIcon className="w-5 h-5 mr-2" /> Approve
                    </button>
                    <button onClick={handleReject} className="btn btn-outline btn-error w-full">
                      <XCircleIcon className="w-5 h-5 mr-2" /> Reject
                    </button>
                  </>
                ) : (
                  <button onClick={() => setSelectedSlip(null)} className="btn btn-ghost w-full">
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
