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
        pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", label: "รอตรวจสอบ", dot: "bg-amber-500" },
        approved: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", label: "อนุมัติแล้ว", dot: "bg-emerald-500" },
        rejected: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200", label: "ปฏิเสธแล้ว", dot: "bg-rose-500" },
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
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <IconCard size={24} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.total}</p>
                        <p className="text-sm text-slate-500 mt-1">รายการทั้งหมด</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.approved}</p>
                        <p className="text-sm text-slate-500 mt-1">อนุมัติแล้ว</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.pending}</p>
                        <p className="text-sm text-slate-500 mt-1">รอตรวจสอบ</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.rejected}</p>
                        <p className="text-sm text-slate-500 mt-1">ปฏิเสธแล้ว</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            className={cn(
                                "px-6 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap",
                                statusFilter === status
                                    ? "bg-white text-rose-500 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                            onClick={() => setStatusFilter(status)}
                        >
                            {statusLabels[status]}
                        </button>
                    ))}
                </div>
                <div className="flex-1 max-w-sm hidden sm:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="ค้นหารายการ..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
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

                        return (
                            <div key={order.id} className="bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden hover:border-rose-200 transition-all shadow-sm group">
                                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                                            {order.userDisplayName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate text-base leading-tight">{order.userDisplayName || 'User'}</h4>
                                            <p className="text-[11px] text-slate-400 font-medium">#{order.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border", 
                                            config.bg, config.color, config.border
                                        )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)}></span>
                                            {config.label.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">แพ็กเกจ</span>
                                            <p className="font-bold text-slate-700">{order.packageName}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ยอดโอน</span>
                                            <p className="font-bold text-rose-500 text-lg leading-none">฿{order.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-medium">{formatDate(order.createdAt)}</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleDelete(order.id)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className={cn(
                                            "w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                                            order.status === 'pending'
                                                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-200 active:scale-[0.98]"
                                                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        )}
                                    >
                                        {order.status === 'pending' ? (
                                            <>
                                                <Eye size={16} />
                                                <span>ตรวจสอบสลิป</span>
                                            </>
                                        ) : (
                                            <span>ดูรายละเอียด</span>
                                        )}
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
                                            className="w-full py-3 bg-rose-500 text-white rounded-lg font-bold text-sm hover:bg-rose-600 shadow-md shadow-rose-200 disabled:opacity-50 transition-all"
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
