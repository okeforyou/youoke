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
        console.log("🛠️ AdminOrdersPage: Initial Mount");
        fetchOrders();
    }, []);

    useEffect(() => {
        console.log("🛠️ AdminOrdersPage: State Change", { loading, ordersCount: orders.length, statusFilter, hasSelected: !!selectedOrder });
    }, [loading, orders, statusFilter, selectedOrder]);

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

    const handleApprove = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!selectedOrder) return;
        if (!window.confirm(`คุณยืนยันที่จะ "อนุมัติ" รายการแจ้งโอนของ ${selectedOrder.userDisplayName || 'User'} หรือไม่?`)) return;

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

    const handleReject = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!selectedOrder) return;
        const reason = window.prompt("ระบุเหตุผลที่ปฏิเสธ (ไม่บังคับ):", "หลักฐานไม่ถูกต้อง / ไม่พบยอดเงิน");
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
        rejected: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-50", border: "border-rose-100", label: "ปฏิเสธแล้ว", dot: "bg-rose-400" },
    };

    const statusLabels: Record<string, string> = {
        all: "รายการทั้งหมด",
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
                    <h1 className="text-2xl font-bold text-slate-800">รายการสั่งซื้อ (Orders)</h1>
                    <p className="mt-1 text-slate-500 text-sm">ตรวจสอบรายการแจ้งโอนและอนุมัติการสมัครสมาชิก</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-ghost btn-sm text-slate-400 hover:text-rose-500" onClick={fetchOrders}>
                        รีเฟรชข้อมูล
                    </button>
                    <button className="btn btn-primary h-10 px-6 bg-rose-500 hover:bg-rose-600 border-none rounded-xl text-sm font-bold shadow-lg shadow-rose-200">
                        ส่งออกข้อมูล
                    </button>
                </div>
            </div>

            {/* Stats Items */}
            <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                        <IconCard size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.total}</p>
                        <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">ทั้งหมด</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.pending}</p>
                        <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">รอตรวจสอบ</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.approved}</p>
                        <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">อนุมัติแล้ว</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                        <XCircle size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800 leading-none">{stats.rejected}</p>
                        <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">ปฏิเสธแล้ว</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อผู้ซื้อ หรือรหัสสั่งซื้อ..."
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 transition-all font-medium"
                    />
                </div>
                
                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            className={cn(
                                "px-5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                                statusFilter === status
                                    ? "bg-white text-rose-500 shadow-sm ring-1 ring-slate-100"
                                    : "text-slate-400 hover:text-slate-600"
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
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">ผู้สั่งซื้อ</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">แพ็กเกจที่เลือก</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">สถานะ</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest text-right">ยอดชำระ</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">วันที่แจ้งโอน</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredOrders.map((order) => {
                                    const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold border border-rose-100 shrink-0">
                                                        {order.userDisplayName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-800 text-sm truncate">{order.userDisplayName || 'User'}</h4>
                                                        <p className="text-[10px] text-slate-400 font-mono">#{order.id.slice(0, 10)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold ring-1 ring-slate-100 capitalize">
                                                    {order.packageName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border", 
                                                        config.bg, config.color, config.border
                                                    )}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)}></span>
                                                        {config.label.toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-slate-800 text-sm">฿{order.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{formatDate(order.createdAt)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="h-9 px-4 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 active:scale-95 transition-all shadow-sm shadow-rose-100"
                                                    >
                                                        ตรวจสอบ
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(order.id);
                                                        }}
                                                        className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Split Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedOrder(null)
                }}>
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col md:row-span-1 lg:flex-row border border-border" onClick={(e) => e.stopPropagation()}>
                        {/* Image side */}
                        <div className="flex-1 bg-slate-900 flex items-center justify-center p-4 relative min-h-[300px]">
                            {selectedOrder.slipUrl && selectedOrder.slipUrl !== 'line_manual' ? (
                                <img
                                    src={selectedOrder.slipUrl}
                                    alt="Slip"
                                    className="max-w-full max-h-full object-contain rounded shadow-lg"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/400x600?text=Invalid+Image+URL";
                                    }}
                                />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <IconCard size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">ไม่มีรูปภาพสลิป (แจ้งโอนผ่าน LINE)</p>
                                    <p className="text-[10px] opacity-50 mt-1">ID: {selectedOrder.id}</p>
                                </div>
                            )}
                        </div>

                        {/* Details side */}
                        <div className="w-full lg:w-80 flex flex-col bg-white h-full border-l border-border">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">รายละอียดการแจ้งโอน</h3>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ชื่อผู้สั่งซื้อ</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedOrder.userDisplayName || 'User'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">แพ็กเกจที่เลือก</p>
                                    <p className="text-sm font-bold text-slate-800 underline decoration-rose-500/20 underline-offset-4">{selectedOrder.packageName}</p>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">ยอดชำระสุทธิ</p>
                                    <p className="text-2xl font-black text-rose-500">฿{selectedOrder.amount.toLocaleString()}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สถานะปัจจุบัน</p>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.bg,
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color,
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.border
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig[selectedOrder.status as keyof typeof statusConfig]?.dot)}></span>
                                        {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label.toUpperCase()}
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

                            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                                {selectedOrder.status === 'pending' ? (
                                    <>
                                        <button 
                                            onClick={(e) => handleApprove(e)}
                                            disabled={processing}
                                            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 shadow-lg shadow-rose-200 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {processing ? "กำลังประมวลผล..." : "อนุมัติรายการทันที"}
                                        </button>
                                        <button 
                                            onClick={(e) => handleReject(e)}
                                            disabled={processing}
                                            className="w-full py-4 border border-slate-200 text-slate-400 rounded-2xl font-bold text-sm hover:bg-white hover:text-rose-500 hover:border-rose-200 transition-all disabled:opacity-50"
                                        >
                                            ปฏิเสธรายการ
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                                    >
                                        ปิดหน้าต่างตรวจสอบ
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
