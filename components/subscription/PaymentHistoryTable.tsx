import React, { useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Payment, PaymentStatus } from '../../types/subscription';

/**
 * PaymentHistoryTable Component
 *
 * Display user's payment history with:
 * - Sortable columns
 * - Status filtering
 * - Payment slip preview
 * - Pagination
 *
 * @example
 * ```tsx
 * <PaymentHistoryTable
 *   payments={userPayments}
 *   loading={isLoading}
 *   onViewSlip={(payment) => setSelectedPayment(payment)}
 * />
 * ```
 */

export interface PaymentHistoryTableProps {
  /** Payment records */
  payments: Payment[];
  /** Loading state */
  loading?: boolean;
  /** Callback to view payment slip */
  onViewSlip?: (payment: Payment) => void;
  /** Show pagination */
  showPagination?: boolean;
  /** Items per page */
  itemsPerPage?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function PaymentHistoryTable({
  payments,
  loading = false,
  onViewSlip,
  showPagination = true,
  itemsPerPage = 10,
  className = '',
}: PaymentHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'transactionDate' | 'amount'>('transactionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === 'all') return true;
    return payment.status === filterStatus;
  });

  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let compareValue = 0;

    if (sortField === 'transactionDate') {
      const dateA = a.transactionDate instanceof Date ? a.transactionDate : new Date(a.transactionDate);
      const dateB = b.transactionDate instanceof Date ? b.transactionDate : new Date(b.transactionDate);
      compareValue = dateA.getTime() - dateB.getTime();
    } else if (sortField === 'amount') {
      compareValue = a.amount - b.amount;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
  const paginatedPayments = showPagination
    ? sortedPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedPayments;

  // Format date
  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  // Status badge
  const getStatusBadge = (status: PaymentStatus) => {
    const statusMap = {
      pending: { variant: 'warning' as const, label: 'รอการอนุมัติ' },
      approved: { variant: 'success' as const, label: 'อนุมัติแล้ว' },
      rejected: { variant: 'error' as const, label: 'ปฏิเสธ' },
    };

    const config = statusMap[status];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  // Handle sort
  const handleSort = (field: 'transactionDate' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle view slip
  const handleViewSlip = (payment: Payment) => {
    setSelectedPayment(payment);
    if (onViewSlip) {
      onViewSlip(payment);
    }
  };

  return (
    <div className={className}>
      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-semibold self-center">กรอง:</span>
        <Button
          variant={filterStatus === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          ทั้งหมด ({payments.length})
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'warning' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
        >
          รอดำเนินการ ({payments.filter(p => p.status === 'pending').length})
        </Button>
        <Button
          variant={filterStatus === 'approved' ? 'success' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('approved')}
        >
          อนุมัติแล้ว ({payments.filter(p => p.status === 'approved').length})
        </Button>
        <Button
          variant={filterStatus === 'rejected' ? 'error' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('rejected')}
        >
          ปฏิเสธ ({payments.filter(p => p.status === 'rejected').length})
        </Button>
      </div>

      {/* Table */}
      <Table zebra hover responsive pinHeader>
        <Table.Header>
          <Table.Row>
            <Table.Head
              sortable
              sortDirection={sortField === 'transactionDate' ? sortDirection : null}
              onSort={() => handleSort('transactionDate')}
            >
              วันที่
            </Table.Head>
            <Table.Head>แพ็กเกจ</Table.Head>
            <Table.Head
              align="right"
              sortable
              sortDirection={sortField === 'amount' ? sortDirection : null}
              onSort={() => handleSort('amount')}
            >
              จำนวนเงิน
            </Table.Head>
            <Table.Head align="center">สถานะ</Table.Head>
            <Table.Head align="center">หมายเหตุ</Table.Head>
            <Table.Head align="center">สลิป</Table.Head>
          </Table.Row>
        </Table.Header>

        {loading && <Table.Loading rows={itemsPerPage} columns={6} />}

        {!loading && paginatedPayments.length === 0 && (
          <Table.Empty
            columns={6}
            message={filterStatus === 'all' ? 'ไม่มีประวัติการชำระเงิน' : `ไม่มีรายการที่${filterStatus === 'pending' ? 'รอดำเนินการ' : filterStatus === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}`}
          />
        )}

        {!loading && paginatedPayments.length > 0 && (
          <Table.Body>
            {paginatedPayments.map((payment) => (
              <Table.Row key={payment.id}>
                {/* Date */}
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {formatDate(payment.transactionDate)}
                    </span>
                    {payment.transferTime && (
                      <span className="text-xs text-gray-500">
                        เวลาโอน: {payment.transferTime}
                      </span>
                    )}
                  </div>
                </Table.Cell>

                {/* Plan */}
                <Table.Cell>
                  <span className="font-medium">{payment.plan}</span>
                  {payment.bankName && (
                    <div className="text-xs text-gray-500">{payment.bankName}</div>
                  )}
                </Table.Cell>

                {/* Amount */}
                <Table.Cell align="right">
                  <span className="text-lg font-semibold text-primary">
                    {formatAmount(payment.amount)}
                  </span>
                </Table.Cell>

                {/* Status */}
                <Table.Cell align="center">
                  {getStatusBadge(payment.status)}
                  {payment.status === 'approved' && payment.approvedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(payment.approvedAt)}
                    </div>
                  )}
                </Table.Cell>

                {/* Note/Reason */}
                <Table.Cell align="center">
                  {payment.status === 'rejected' && payment.rejectedReason ? (
                    <span className="text-sm text-error">{payment.rejectedReason}</span>
                  ) : payment.note ? (
                    <span className="text-sm text-gray-600">{payment.note}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </Table.Cell>

                {/* Slip */}
                <Table.Cell align="center">
                  {payment.paymentProof ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-hover"
                      onClick={() => handleViewSlip(payment)}
                      aria-label="ดูสลิป"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table>

      {/* Pagination */}
      {showPagination && !loading && paginatedPayments.length > 0 && (
        <Table.Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={sortedPayments.length}
        />
      )}

      {/* Payment Slip Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`สลิปการชำระเงิน - ${selectedPayment.plan}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Payment Info */}
            <div className="bg-base-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">วันที่ทำรายการ</p>
                  <p className="font-semibold">{formatDate(selectedPayment.transactionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">จำนวนเงิน</p>
                  <p className="font-semibold text-primary text-lg">
                    {formatAmount(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">แพ็กเกจ</p>
                  <p className="font-semibold">{selectedPayment.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">สถานะ</p>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>
            </div>

            {/* Payment Slip Image */}
            {selectedPayment.paymentProof && (
              <div className="border-2 border-base-300 rounded-lg overflow-hidden">
                <img
                  src={selectedPayment.paymentProof}
                  alt="สลิปการชำระเงิน"
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Rejection Reason */}
            {selectedPayment.status === 'rejected' && selectedPayment.rejectedReason && (
              <div className="alert alert-error">
                <p className="text-sm">
                  <strong>เหตุผลที่ปฏิเสธ:</strong> {selectedPayment.rejectedReason}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
