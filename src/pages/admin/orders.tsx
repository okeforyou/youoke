import Head from "next/head";
import { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import {
    Search,
    CreditCard,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    Calendar,
    DollarSign,
    ZoomIn,
    ZoomOut,
    X,
    CreditCard as IconCard
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp, getDoc, addDoc, where } from "firebase/firestore";
import { db } from "../../firebase";
import { PaymentSlip } from "@/modules/billing/types";
import { cn } from "@/lib/utils";


export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<PaymentSlip[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedOrder, setSelectedOrder] = useState<PaymentSlip | null>(null);
    const [processing, setProcessing] = useState(false);

    // Fetch Orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            if (db) {
                let q = query(collection(db, "payment_proofs"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const orderList: PaymentSlip[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    orderList.push({ id: doc.id, ...data } as PaymentSlip);
                });
                setOrders(orderList);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter Logic
    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    // Stats Logic
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        approved: orders.filter(o => o.status === 'approved').length,
        rejected: orders.filter(o => o.status === 'rejected').length,
    };

    // Format Timestamp
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "-";
        if (timestamp.toDate) return timestamp.toDate().toLocaleString('th-TH');
        return new Date(timestamp.seconds * 1000).toLocaleString('th-TH');
    };

    const handleApprove = async () => {
        if (!selectedOrder) return;
        if (!confirm(`คุณยืนยันที่จะ "อนุมัติ" รายการแจ้งโอนของ ${selectedOrder.userDisplayName || 'User'} หรือไม่?`)) return;

        setProcessing(true);
        try {
            const { useAuthStore } = await import('@/modules/auth/useAuthStore');
            const adminUid = useAuthStore.getState().user?.uid || 'admin';

            const { approvePayment } = await import('@/modules/billing/services/paymentService');
            await approvePayment(selectedOrder.id, selectedOrder.userId, selectedOrder.packageId, adminUid);

            alert("อนุมัติรายการและเปิดใช้งานสมาชิกเรียบร้อยแล้ว!");
            setSelectedOrder(null);
            fetchOrders();

        } catch (error) {
            console.error("Approval failed:", error);
            alert("เกิดข้อผิดพลาดในการอนุมัติ");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOrder) return;
        const reason = prompt("ระบุเหตุผลที่ปฏิเสธ (ไม่บังคับ):", "หลักฐานไม่ถูกต้อง / ไม่พบยอดเงิน");
        if (reason === null) return;

        setProcessing(true);
        try {
            const { useAuthStore } = await import('@/modules/auth/useAuthStore');
            const adminUid = useAuthStore.getState().user?.uid || 'admin';

            const { rejectPayment } = await import('@/modules/billing/services/paymentService');
            await rejectPayment(selectedOrder.id, selectedOrder.userId, reason, adminUid);

            alert("ปฏิเสธรายการเรียบร้อยแล้ว");
            setSelectedOrder(null);
            fetchOrders();

        } catch (error) {
            console.error("Rejection failed:", error);
            alert("เกิดข้อผิดพลาดในการปฏิเสธรายการ");
        } finally {
            setProcessing(false);
        }
    };

    const statusConfig = {
        pending: { icon: Clock, color: "text-warning", bg: "bg-warning/15", label: "รอตรวจสอบ" },
        approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/15", label: "อนุมัติแล้ว" },
        rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15", label: "ปฏิเสธแล้ว" },
    };

    const statusLabels: Record<string, string> = {
        all: "ทั้งหมด",
        pending: "รอตรวจสอบ",
        approved: "อนุมัติแล้ว",
        rejected: "ปฏิเสธแล้ว"
    };

    return (
        <AdminLayout headerTitle="ตรวจสอบการชำระเงิน">
            <Head>
                <title>รายการสั่งซื้อ (Orders) - YouOke Admin</title>
            </Head>

            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">ตรวจสอบการชำระเงิน</h1>
                    <p className="mt-1 text-muted-foreground">ตรวจสอบสลิปและอนุมัติการสมัครสมาชิก</p>
                </div>
                <button className="btn btn-ghost btn-sm text-primary hover:bg-primary/10" onClick={fetchOrders}>
                    รีเฟรชข้อมูล
                </button>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <IconCard className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                        <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                        <p className="text-sm text-muted-foreground">รอตรวจสอบ</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                        <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                        <p className="text-sm text-muted-foreground">อนุมัติแล้ว</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20">
                        <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                        <p className="text-sm text-muted-foreground">ปฏิเสธแล้ว</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 flex overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <div className="flex p-1 gap-1 bg-muted/30 rounded-xl border border-border/50">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize",
                                statusFilter === status
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            onClick={() => setStatusFilter(status)}
                        >
                            {statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Layout */}
            {loading ? (
                <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
            ) : filteredOrders.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">ไม่พบรายการสั่งซื้อ</h3>
                    <p className="text-muted-foreground">ลองปรับตัวกรองสถานะ หรือรอรายการใหม่</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredOrders.map((order) => {
                        const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
                        const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;

                        return (
                            <div key={order.id} className="glass-card p-5 hover:border-primary/30 transition-all group flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary font-bold border border-primary/10">
                                            {order.userDisplayName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-foreground truncate max-w-[120px]">{order.userDisplayName || 'ลูกค้าทั่วไป'}</h4>
                                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">{order.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", config.bg, config.color)}>
                                        <StatusIcon size={12} />
                                        <span className="capitalize">{config.label}</span>
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4 flex-1">
                                    <div className="flex justify-between text-sm border-b border-border/30 pb-2">
                                        <span className="text-muted-foreground">แพ็กเกจ</span>
                                        <span className="font-medium text-foreground">{order.packageName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-b border-border/30 pb-2">
                                        <span className="text-muted-foreground">ยอดชำระ</span>
                                        <span className="font-bold text-primary">฿{order.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">วันที่แจ้ง</span>
                                        <span className="text-right text-foreground">{formatDate(order.createdAt)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className={cn(
                                        "btn btn-sm w-full gap-2 transition-all",
                                        order.status === 'pending'
                                            ? "btn-outline border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                            : "btn-ghost border-border/50 text-muted-foreground"
                                    )}
                                >
                                    <Eye size={16} />
                                    {order.status === 'pending' ? "ตรวจสอบสลิป" : "ดูรายละเอียด"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Split Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedOrder(null)
                }}>
                    <div className="bg-card w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-border">

                        {/* Image Side (Left) */}
                        <div className="flex-1 bg-black/95 flex flex-col relative min-h-[400px] lg:min-h-0">
                            <div className="absolute top-4 right-4 z-10 flex gap-2">
                                <a href={selectedOrder.slipUrl} target="_blank" rel="noreferrer" className="btn btn-circle btn-sm bg-white/10 text-white hover:bg-white/20 border-none">
                                    <Eye size={16} />
                                </a>
                            </div>
                            <div className="flex-1 overflow-auto flex items-center justify-center p-6">
                                <img
                                    src={selectedOrder.slipUrl}
                                    alt="Payment Slip"
                                    className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform hover:scale-105"
                                />
                            </div>
                        </div>

                        {/* Details Side (Right) */}
                        <div className="w-full lg:w-[400px] bg-card flex flex-col border-l border-border h-full max-h-[50vh] lg:max-h-full">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                                        <CreditCard size={18} className="text-primary" /> ตรวจสอบรายการ
                                    </h3>
                                    <p className="text-xs text-muted-foreground">ID: {selectedOrder.id}</p>
                                </div>
                                <button className="btn btn-circle btn-ghost btn-sm text-muted-foreground" onClick={() => setSelectedOrder(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                {/* Customer Profile */}
                                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {selectedOrder.userDisplayName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-foreground truncate">{selectedOrder.userDisplayName || 'ลูกค้าทั่วไป'}</div>
                                        <div className="text-xs text-muted-foreground font-mono truncate">{selectedOrder.userId}</div>
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="space-y-4">
                                    <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">ข้อมูลการโอน</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b border-border/30">
                                            <span className="text-muted-foreground">แพ็กเกจ</span>
                                            <span className="font-medium">{selectedOrder.packageName}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border/30">
                                            <span className="text-muted-foreground">ยอดเงิน</span>
                                            <span className="font-bold text-primary text-lg">฿{selectedOrder.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border/30">
                                            <span className="text-muted-foreground">วันที่เวลา</span>
                                            <span>{formatDate(selectedOrder.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">สถานะ</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                                statusConfig[selectedOrder.status as keyof typeof statusConfig]?.bg || "bg-muted",
                                                statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color || "text-muted-foreground"
                                            )}>
                                                {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label || selectedOrder.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.rejectionReason && (
                                    <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
                                        <span className="font-bold block mb-1">สาเหตุที่ปฏิเสธ:</span>
                                        {selectedOrder.rejectionReason}
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="p-6 border-t border-border bg-muted/10 mt-auto">
                                {selectedOrder.status === 'pending' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="btn btn-outline btn-error w-full hover:btn-error"
                                        >
                                            <XCircle size={18} /> ปฏิเสธ
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="btn btn-primary w-full text-primary-foreground shadow-lg shadow-primary/20"
                                        >
                                            {processing ? <span className="loading loading-spinner"></span> : <CheckCircle size={18} />}
                                            อนุมัติทันที
                                        </button>
                                    </div>
                                ) : (
                                    <button className="btn btn-outline w-full border-border text-muted-foreground hover:bg-muted" onClick={() => setSelectedOrder(null)}>
                                        ปิดหน้าต่าง
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

