import Head from "next/head";
import { useState, useEffect } from "react";
import AdminLayout from '@/features/admin/layouts/AdminLayout';
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
    Trash2,
    AlertCircle,
    CreditCard as IconCard
} from "lucide-react";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp, getDoc, addDoc, where } from "firebase/firestore";
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
            setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("เกิดข้อผิดพลาดในการลบรายการ");
        } finally {
            setProcessing(false);
        }
    };

    const statusConfig = {
        pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-200/50", label: "รอตรวจสอบ" },
        approved: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-200/50", label: "อนุมัติแล้ว" },
        rejected: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-200/50", label: "ปฏิเสธแล้ว" },
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
                    <p className="mt-1 text-muted-foreground">ตรวจสอบสลิปและอนุมัติการสมัครสมาชิก</p>
                </div>
                <button className="btn btn-ghost btn-sm text-primary hover:bg-primary/10" onClick={fetchOrders}>
                    รีเฟรชข้อมูล
                </button>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="glass-card p-5 flex items-center gap-5 border-l-4 border-l-slate-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-600 shadow-inner">
                        <IconCard className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-foreground leading-none">{stats.total}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-1.5 opacity-60">รายการทั้งหมด</p>
                    </div>
                </div>
                <div className="glass-card p-5 flex items-center gap-5 border-l-4 border-l-amber-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner shadow-amber-500/5">
                        <Clock className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-amber-600 leading-none">{stats.pending}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-amber-600/60 mt-1.5">รอตรวจสอบ</p>
                    </div>
                </div>
                <div className="glass-card p-5 flex items-center gap-5 border-l-4 border-l-emerald-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner shadow-emerald-500/5">
                        <CheckCircle className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-emerald-600 leading-none">{stats.approved}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600/60 mt-1.5">อนุมัติแล้ว</p>
                    </div>
                </div>
                <div className="glass-card p-5 flex items-center gap-5 border-l-4 border-l-rose-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner shadow-rose-500/5">
                        <XCircle className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-rose-600 leading-none">{stats.rejected}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-rose-600/60 mt-1.5">ปฏิเสธแล้ว</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-8 flex overflow-x-auto pb-4 sm:pb-0 hide-scrollbar scroll-smooth">
                <div className="flex p-1.5 gap-1.5 bg-muted/20 backdrop-blur-md rounded-2xl border border-border/40 shadow-sm">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            className={cn(
                                "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap",
                                statusFilter === status
                                    ? "bg-card text-primary shadow-lg border border-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
                <div className="flex justify-center p-20">
                    <span className="loading loading-spinner loading-lg text-primary/40"></span>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-2">
                    <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                        <Search className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">ไม่พบรายการสั่งซื้อ</h3>
                    <p className="text-muted-foreground max-w-xs">ลองปรับตัวกรองสถานะ หรือรอให้มีรายการใหม่แจ้งเข้ามาในระบบครับ</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredOrders.map((order) => {
                        const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
                        const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;

                        return (
                            <div key={order.id} className="glass-card relative group flex flex-col p-0 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 border-border/40">
                                {/* Card Header */}
                                <div className="p-5 pb-4 border-b border-border/30 bg-muted/10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-black text-xl border border-primary/10 shadow-sm shadow-primary/10">
                                                {order.userDisplayName?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-foreground truncate max-w-[140px] text-lg leading-tight">{order.userDisplayName || 'User'}</h4>
                                                <p className="text-[10px] text-muted-foreground font-mono truncate tracking-tight uppercase opacity-60">REF: {order.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", 
                                                config.bg, config.color, config.border
                                            )}>
                                                <StatusIcon size={12} strokeWidth={3} />
                                                <span>{config.label}</span>
                                            </span>
                                            
                                            {order.status !== 'pending' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(order.id);
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center text-muted-foreground/40 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                                                    title="ลบรายการ"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 pt-4 flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-70">แพ็กเกจ</p>
                                            <p className="font-bold text-sm text-foreground/90 truncate">{order.packageName}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-70">ยอดชำระ</p>
                                            <p className="font-black text-lg text-primary leading-none">฿{order.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-3 border-t border-border/20 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Calendar size={12} className="opacity-50" />
                                            <span className="text-[10px] font-medium leading-none">{formatDate(order.createdAt)}</span>
                                        </div>
                                        {order.status === 'rejected' && order.rejectionReason && (
                                            <div className="flex items-center gap-1 text-rose-500/70" title={order.rejectionReason}>
                                                <AlertCircle size={12} />
                                                <span className="text-[10px] font-bold">เหตุผลปฏิเสธ</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 bg-muted/5">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className={cn(
                                            "w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98]",
                                            order.status === 'pending'
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110"
                                                : "bg-[#06C755]/10 text-[#06C755] hover:bg-[#06C755]/20"
                                        )}
                                    >
                                        <Eye size={18} strokeWidth={2.5} />
                                        <span>{order.status === 'pending' ? "ตรวจสอบสลิปทันที" : "ดูรายละเอียดรายการ"}</span>
                                    </button>
                                </div>
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
                        <div className="w-full lg:w-[450px] bg-card flex flex-col border-l border-border/40 h-full max-h-[60vh] lg:max-h-full">
                            <div className="p-7 border-b border-border/40 flex justify-between items-center bg-muted/5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Payment Verification</p>
                                    <h3 className="font-black text-2xl text-foreground !leading-none mb-1">
                                        ตรวจสอบรายการ
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-mono opacity-50 tracking-tighter">REF: {selectedOrder.id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-200/50" 
                                        onClick={() => handleDelete(selectedOrder.id)}
                                        title="ลบรายการนี้"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-all" onClick={() => setSelectedOrder(null)}>
                                        <X size={22} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-7 flex-1 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-muted-foreground/10">
                                {/* Customer Profile */}
                                <div className="flex items-center gap-5 p-5 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl border border-primary/10 shadow-inner">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20">
                                        {selectedOrder.userDisplayName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-xl text-foreground truncate leading-tight">{selectedOrder.userDisplayName || 'ลูกค้าทั่วไป'}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono truncate opacity-60 mt-1 uppercase">UID: {selectedOrder.userId}</div>
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-border/40"></div>
                                        <h4 className="text-[11px] uppercase font-black text-muted-foreground tracking-[0.2em] whitespace-nowrap">ข้อมูลการโอน</h4>
                                        <div className="h-px flex-1 bg-border/40"></div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">แพ็กเกจ</span>
                                            <span className="font-black text-foreground text-lg">{selectedOrder.packageName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4 bg-primary/5 px-4 rounded-2xl border border-primary/10">
                                            <span className="text-xs font-bold text-primary uppercase tracking-widest">ยอดเงินสุทธิ</span>
                                            <span className="font-black text-primary text-3xl tracking-tighter">฿{selectedOrder.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">วันที่เวลา</span>
                                            <span className="font-bold text-foreground">{formatDate(selectedOrder.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">สถานะปัจจุบัน</span>
                                            <span className={cn(
                                                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors shadow-sm",
                                                statusConfig[selectedOrder.status as keyof typeof statusConfig]?.bg || "bg-muted",
                                                statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color || "text-muted-foreground",
                                                statusConfig[selectedOrder.status as keyof typeof statusConfig]?.border || "border-border"
                                            )}>
                                                {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label || selectedOrder.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.rejectionReason && (
                                    <div className="bg-rose-500/5 text-rose-600 p-5 rounded-3xl text-sm border border-rose-500/10 flex gap-4 items-start shadow-inner">
                                        <AlertCircle className="shrink-0 w-5 h-5 mt-0.5 opacity-60" />
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-60">เหตุผลที่ปฏิเสธ</span>
                                            <p className="font-bold leading-relaxed">{selectedOrder.rejectionReason}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="p-7 border-t border-border/40 bg-muted/5 mt-auto">
                                {selectedOrder.status === 'pending' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs border-2 border-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <XCircle size={18} strokeWidth={2.5} /> ปฏิเสธ
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {processing ? <span className="loading loading-spinner loading-sm"></span> : <CheckCircle size={18} strokeWidth={2.5} />}
                                            อนุมัติทันที
                                        </button>
                                    </div>
                                ) : (
                                    <button className="h-14 w-full rounded-2xl bg-muted text-foreground font-black uppercase tracking-widest text-xs hover:bg-muted/80 transition-all active:scale-[0.98]" onClick={() => setSelectedOrder(null)}>
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

