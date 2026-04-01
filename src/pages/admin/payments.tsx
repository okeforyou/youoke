import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
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
    RefreshCw,
    CreditCard as IconCard,
    Activity,
    Users,
    TrendingUp,
    TrendingDown,
    Minus
} from "lucide-react";
import { StatCard } from "@/features/admin/components/StatCard";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { PaymentSlip } from "@/modules/billing/types";
import { cn } from "@/lib/utils";
import { useUIStore } from '@/stores/useUIStore';
import { useToast } from '@/context/ToastContext';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<PaymentSlip[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedOrder, setSelectedOrder] = useState<PaymentSlip | null>(null);
    const [processing, setProcessing] = useState(false);
    const showConfirm = useUIStore(state => state.showConfirm);
    const { addToast } = useToast()!;
    const router = useRouter();
    const orderIdToSelect = router.query.id as string;

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

                // Auto-select if ID is provided in URL (v4.3.0 Deep Link)
                if (orderIdToSelect) {
                    const targetOrder = orderList.find(o => o.id === orderIdToSelect);
                    if (targetOrder) {
                        setSelectedOrder(targetOrder);
                        addToast("เจอรายการสั่งซื้อที่ต้องการตรวจสอบแล้ว!", "success");
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (router.isReady) {
            fetchOrders();
        }
    }, [router.isReady]);

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
        showConfirm({
            title: "ยืนยันการอนุมัติ",
            message: `คุณยืนยันที่จะ "อนุมัติ" รายการแจ้งโอนของ ${selectedOrder.userDisplayName || 'User'} หรือไม่? ระบบจะเปิดสิทธิ์การใช้งานให้ทันที`,
            confirmText: "อนุมัติรายการ",
            type: "success",
            onConfirm: async () => {
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

                    addToast("อนุมัติรายการและเปิดใช้งานสมาชิกเรียบร้อยแล้ว!", "success");
                    setSelectedOrder(null);
                    fetchOrders();

                } catch (error) {
                    console.error("Approval failed:", error);
                    addToast("เกิดข้อผิดพลาดในการอนุมัติ", "error");
                } finally {
                    setProcessing(false);
                }
            }
        });
    };

    const handleReject = async () => {
        if (!selectedOrder) return;
        
        showConfirm({
            title: "ปฏิเสธรายการ",
            message: "กรุณายืนยันการปฏิเสธรายการนี้ ระบบจะแจ้งเตือนผู้ใช้ให้ตรวจสอบหลักฐานอีกครั้ง",
            confirmText: "ปฏิเสธรายการ",
            type: "danger",
            onConfirm: async () => {
                const reason = "หลักฐานไม่ถูกต้อง / ไม่พบยอดเงิน (ตรวจสอบโดยผู้ดูแลระบบ)";
                setProcessing(true);
                try {
                    const { useAuthStore } = await import('@/modules/auth/useAuthStore');
                    const adminUid = useAuthStore.getState().user?.uid || 'admin';

                    const { rejectPayment } = await import('@/modules/billing/services/paymentService');
                    await rejectPayment(selectedOrder.id, selectedOrder.userId, reason, adminUid);

                    addToast("ปฏิเสธรายการเรียบร้อยแล้ว", "success");
                    setSelectedOrder(null);
                    fetchOrders();

                } catch (error) {
                    console.error("Rejection failed:", error);
                    addToast("เกิดข้อผิดพลาดในการปฏิเสธรายการ", "error");
                } finally {
                    setProcessing(false);
                }
            }
        });
    };

    const handleDelete = async (orderId: string) => {
        showConfirm({
            title: "ยืนยันการลบ",
            message: "⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากระบบ? (ไม่สามารถเรียกคืนได้)",
            confirmText: "ลบถาวร",
            type: "danger",
            onConfirm: async () => {
                setProcessing(true);
                try {
                    const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
                    await deleteDoc(firestoreDoc(db as any, "payment_proofs", orderId));
                    
                    addToast("ลบรายการออกจากระบบเรียบร้อยแล้ว", "success");
                    if (selectedOrder?.id === orderId) setSelectedOrder(null);
                    fetchOrders();
                } catch (error) {
                    console.error("Delete failed:", error);
                    addToast("เกิดข้อผิดพลาดในการลบรายการ", "error");
                } finally {
                    setProcessing(false);
                }
            }
        });
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
            <div className="mb-8 p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm shadow-gray-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">รายการสั่งซื้อ</h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">ตรวจสอบรายการแจ้งโอนและอนุมัติการสมัครสมาชิก</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-white hover:border-indigo-200 transition-all shadow-sm" onClick={fetchOrders}>
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        รีเฟรชข้อมูล
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-2xl font-bold text-sm text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        ส่งออกข้อมูล
                    </button>
                </div>
            </div>

            {/* Stats Items */}
            <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="ทั้งหมด"
                    value={stats.total}
                    icon={IconCard}
                    iconColor="primary"
                    className="border-primary/20 bg-gradient-to-br from-white to-primary/5"
                />
                <StatCard 
                    title="รอตรวจสอบ"
                    value={stats.pending}
                    icon={Clock}
                    iconColor="warning"
                />
                <StatCard 
                    title="อนุมัติแล้ว"
                    value={stats.approved}
                    icon={CheckCircle}
                    iconColor="success"
                />
                <StatCard 
                    title="ปฏิเสธแล้ว"
                    value={stats.rejected}
                    icon={XCircle}
                    iconColor="secondary"
                />
            </div>

            {/* Filter Tabs & Search */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-6 p-1.5 bg-gray-100/80 rounded-[24px] backdrop-blur-sm border border-gray-200/50">
                <div className="relative flex-1 group min-w-[300px] ml-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อผู้ซื้อ หรือรหัสสั่งซื้อ..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-[18px] text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-900"
                    />
                </div>
                
                <div className="flex gap-1 p-1">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            className={cn(
                                "px-6 py-2.5 text-sm font-black rounded-[18px] transition-all whitespace-nowrap",
                                statusFilter === status
                                    ? "bg-white text-indigo-600 shadow-md translate-y-[-1px]"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                            )}
                            onClick={() => setStatusFilter(status)}
                        >
                            {statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-gray-200/50 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-20">
                        <span className="loading loading-spinner text-indigo-600/20"></span>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <Search className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">ไม่พบรายการสั่งซื้อ</h3>
                        <p className="text-gray-400 max-w-xs font-medium">ลองปรับตัวกรองสถานะ หรือรอให้มีรายการใหม่แจ้งเข้ามาในระบบครับ</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/30">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ผู้สั่งซื้อ</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">แพ็กเกจ</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">สถานะ</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ยอดชำระ</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">วันที่แจ้ง</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => {
                                    const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                                    const StatusIcon = config.icon || Clock;

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black border border-indigo-100 shadow-sm transition-transform group-hover:scale-105">
                                                        {order.userDisplayName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-[15px]">{order.userDisplayName || 'Unknown User'}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">REF: {order.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-xl text-[11px] font-black border border-gray-200/50">
                                                    {order.packageName?.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-[0.1em] shadow-sm",
                                                        config.bg === "bg-amber-50" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
                                                        config.bg === "bg-emerald-50" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                                                        "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                    )}>
                                                        <StatusIcon size={12} strokeWidth={3} />
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-black text-gray-900 text-lg">฿{order.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-gray-900 tracking-tight">{formatDate(order.createdAt).split(' ')[0]}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{formatDate(order.createdAt).split(' ')[1]}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => setSelectedOrder(order)}
                                                        className={cn(
                                                            "h-10 px-5 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-tight text-[11px] transition-all active:scale-[0.95] shadow-sm",
                                                            order.status === 'pending'
                                                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                                                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                        )}
                                                    >
                                                        <Eye size={14} strokeWidth={3} />
                                                        ตรวจสอบ
                                                    </button>
                                                    {order.status === 'pending' && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(order.id);
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
                        <div className="w-full lg:w-80 flex flex-col bg-white h-full border-l border-gray-100">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <h3 className="font-black text-gray-900 tracking-tight">รายละเอียดการแจ้งโอน</h3>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ชื่อผู้สั่งซื้อ</p>
                                    <p className="text-[15px] font-black text-gray-900">{selectedOrder.userDisplayName || 'User'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">แพ็กเกจที่เลือก</p>
                                    <p className="text-[15px] font-black text-indigo-600 underline decoration-indigo-500/20 underline-offset-8">{selectedOrder.packageName}</p>
                                </div>
                                <div className="p-5 bg-indigo-50/50 rounded-[28px] border border-indigo-100/50 shadow-inner">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">ยอดชำระสุทธิ</p>
                                    <p className="text-3xl font-black text-indigo-600 mt-1">฿{selectedOrder.amount.toLocaleString()}</p>
                                </div>
                                <div className="space-y-2.5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">สถานะปัจจุบัน</p>
                                    <span className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm",
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.bg === "bg-amber-50" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
                                        statusConfig[selectedOrder.status as keyof typeof statusConfig]?.bg === "bg-emerald-50" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                                        "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    )}>
                                        <div className={cn("w-2 h-2 rounded-full bg-current")}></div>
                                        {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label.toUpperCase()}
                                    </span>
                                </div>
                                
                                {selectedOrder.rejectionReason && (
                                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                                        <p className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1.5 tracking-widest">
                                            <AlertCircle size={12} /> เหตุผลที่ปฏิเสธ
                                        </p>
                                        <p className="text-xs text-rose-600 mt-2 font-bold leading-relaxed">{selectedOrder.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-50 bg-gray-50/30 space-y-3">
                                {selectedOrder.status === 'pending' ? (
                                    <>
                                        <button 
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="w-full py-4 bg-indigo-600 text-white rounded-[20px] font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all active:scale-[0.98]"
                                        >
                                            {processing ? "กำลังประมวลผล..." : "อนุมัติรายการทันที"}
                                        </button>
                                        <button 
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="w-full py-4 border border-gray-200 text-gray-500 rounded-[20px] font-bold text-sm hover:bg-white hover:text-rose-500 hover:border-rose-200 transition-all disabled:opacity-50"
                                        >
                                            ปฏิเสธรายการ
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-full py-4 bg-gray-100 text-gray-500 rounded-[20px] font-black text-sm hover:bg-gray-200 transition-all"
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
