import Head from "next/head";
import { useState, useEffect } from "react";
import AdminLayout from '@/features/admin/layouts/AdminLayout';
import {
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    X,
    Trash2,
    AlertCircle,
    CreditCard as IconCard
} from "lucide-react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
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
            await approvePayment(
                selectedOrder.id, 
                selectedOrder.userId, 
                selectedOrder.packageId || 'free', 
                adminUid
            );

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

    const handleDelete = async (orderId: string) => {
        if (!confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากระบบ? (ไม่สามารถเรียกคืนได้)")) return;

        setProcessing(true);
        try {
            const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
            await deleteDoc(firestoreDoc(db as any, "payment_proofs", orderId));
            
            alert("ลบรายการออกจากระบบเรียบร้อยแล้ว");
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("เกิดข้อผิดพลาดในการลบรายการ");
        } finally {
            setProcessing(false);
        }
    };

    const statusConfig = {
        pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", label: "รอตรวจสอบ" },
        approved: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", label: "อนุมัติแล้ว" },
        rejected: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100", label: "ปฏิเสธแล้ว" },
    };

    const statusLabels: Record<string, string> = {
        all: "ทั้งหมด",
        pending: "รอตรวจสอบ",
        approved: "อนุมัติแล้ว",
        rejected: "ปฏิเสธแล้ว"
    };

    return (
        <AdminLayout>
            <Head>
                <title>รายการสั่งซื้อ (Orders) - YouOke Admin</title>
            </Head>

            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">ตรวจสอบการชำระเงิน</h1>
                    <p className="mt-1 text-muted-foreground text-sm">ตรวจสอบสลิปและอนุมัติการสมัครสมาชิก</p>
                </div>
                <button className="btn btn-ghost btn-sm text-primary hover:bg-primary/5" onClick={fetchOrders}>
                    รีเฟรชข้อมูล
                </button>
            </div>

            {/* Stats Items */}
            <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="bg-white border border-border p-4 rounded-xl flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                        <IconCard className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-foreground leading-none">{stats.total}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">ทั้งหมด</p>
                    </div>
                </div>
                <div className="bg-white border border-border p-4 rounded-xl flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-amber-500 leading-none">{stats.pending}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">รอตรวจสอบ</p>
                    </div>
                </div>
                <div className="bg-white border border-border p-4 rounded-xl flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-emerald-500 leading-none">{stats.approved}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">อนุมัติแล้ว</p>
                    </div>
                </div>
                <div className="bg-white border border-border p-4 rounded-xl flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                        <XCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-rose-500 leading-none">{stats.rejected}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">ปฏิเสธแล้ว</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-8 flex overflow-x-auto pb-4 sm:pb-0 hide-scrollbar cursor-default">
                <div className="flex p-1 bg-slate-100 rounded-lg border border-border">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                                statusFilter === status
                                    ? "bg-white text-primary shadow-sm border border-slate-200"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setStatusFilter(status)}
                        >
                            {statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <span className="loading loading-spinner text-primary/20"></span>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white border border-dashed border-border p-20 text-center flex flex-col items-center justify-center rounded-2xl">
                    <Search className="h-10 w-10 text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-foreground">ไม่พบรายการ</h3>
                    <p className="text-muted-foreground text-sm">ไม่มีข้อมูลในหมวดหมู่นี้</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredOrders.map((order) => {
                        const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                        const StatusIcon = config.icon;

                        return (
                            <div key={order.id} className="bg-white border border-border rounded-xl flex flex-col overflow-hidden hover:border-slate-300 transition-colors">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-sm">
                                            {order.userDisplayName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground truncate max-w-[120px] text-sm">{order.userDisplayName || 'User'}</h4>
                                            <p className="text-[10px] text-muted-foreground font-mono">ID: {order.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border", 
                                        config.bg, config.color, config.border
                                    )}>
                                        <StatusIcon size={12} />
                                        {config.label}
                                    </span>
                                </div>

                                <div className="p-4 flex-1 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">แพ็กเกจ</span>
                                        <span className="font-bold text-foreground">{order.packageName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">ยอดเงิน</span>
                                        <span className="font-bold text-primary">฿{order.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground">
                                        <span>{formatDate(order.createdAt)}</span>
                                        <button 
                                            onClick={() => handleDelete(order.id)}
                                            className="text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 border-t border-slate-50">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className={cn(
                                            "w-full py-2 rounded-lg font-bold text-xs transition-all",
                                            order.status === 'pending'
                                                ? "bg-primary text-white hover:bg-primary/90"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        )}
                                    >
                                        ตรวจสอบสลิป
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Split Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedOrder(null)
                }}>
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col md:row-span-1 lg:flex-row border border-border">
                        {/* Image side */}
                        <div className="flex-1 bg-slate-900 flex items-center justify-center p-4 relative min-h-[300px]">
                            <img
                                src={selectedOrder.slipUrl}
                                alt="Slip"
                                className="max-w-full max-h-full object-contain rounded shadow-lg"
                            />
                        </div>

                        {/* Details side */}
                        <div className="w-full lg:w-80 flex flex-col bg-white h-full border-l border-border">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-foreground">รายละเอียด</h3>
                                <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-slate-100 rounded">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">ลูกค้า</p>
                                    <p className="text-sm font-bold text-foreground">{selectedOrder.userDisplayName || 'User'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">แพ็กเกจ</p>
                                    <p className="text-sm font-bold text-foreground">{selectedOrder.packageName}</p>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-[10px] font-bold text-primary uppercase">ยอดโอน</p>
                                    <p className="text-xl font-bold text-primary">฿{selectedOrder.amount.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">สถานะ</p>
                                    <span className={cn(
                                        "inline-block px-2 py-0.5 rounded text-[10px] font-bold border",
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.bg,
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color,
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.border
                                    )}>
                                        {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                                    </span>
                                </div>
                                
                                {selectedOrder.rejectionReason && (
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                                        <p className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                            <AlertCircle size={10} /> เหตุผลที่ปฏิเสธ
                                        </p>
                                        <p className="text-xs text-rose-600 mt-1">{selectedOrder.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-border bg-slate-50 space-y-2">
                                {selectedOrder.status === 'pending' ? (
                                    <>
                                        <button 
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50"
                                        >
                                            {processing ? "กำลังอนุมัติ..." : "อนุมัติรายการ"}
                                        </button>
                                        <button 
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="w-full py-3 border border-rose-200 text-rose-500 rounded-lg font-bold text-sm hover:bg-rose-50 disabled:opacity-50"
                                        >
                                            ปฏิเสธรายการ
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-full py-3 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm"
                                    >
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
