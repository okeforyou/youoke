import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, AlertCircle, Copy, MessageCircle, Loader2, Sparkles, Send } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { cn } from '@/lib/utils';

interface UploadSlipModalProps {
    isOpen: boolean;
    onClose: () => void;
    pkg?: { id: string; name: string; price: number };
}

export const UploadSlipModal = ({ isOpen, onClose, pkg }: UploadSlipModalProps) => {
    const { user } = useAuthStore();
    const { config } = useSystemConfig();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // Bank Details (Dynamic from System Config)
    const bankInfo = {
        bank: config.payment?.bankAccount?.bankName || "ไทยพาณิชย์ (SCB)",
        accName: config.payment?.bankAccount?.accountName || "บุญยานันทน์ ชูพินิจ",
        accNo: config.payment?.bankAccount?.accountNumber || "408-006876-3"
    };

    // Use default local path if config doesn't have one or if it's broken (v4.9.24 Robust Check)
    const qrImage = (config.payment?.promptPay?.qrImageUrl && config.payment.promptPay.qrImageUrl.trim() !== "") 
                    ? config.payment.promptPay.qrImageUrl 
                    : "/img/scb-qr.jpg";

    const notifyAdmins = async (paymentId: string) => {
        try {
            if (!db || !user || !pkg) return;
            // 1. Send Internal Notification to App Dashboard
            const adminsQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'owner']));
            const adminSnapshot = await getDocs(adminsQuery);
            const adminIds = adminSnapshot.docs.map(doc => doc.id);
            
            for (const adminId of adminIds) {
                await axios.post('/api/notify/send', {
                    userId: adminId,
                    title: `💰 แจ้งโอนเงินใหม่!`,
                    body: `คุณ ${user?.displayName || user?.email} แจ้งโอนเงินสำหรับแพ็กเกจ ${pkg?.name}`,
                    data: {
                        type: 'new_payment',
                        paymentId: paymentId
                    }
                });
            }
        } catch (error) {
            console.error("Failed to notify admins:", error);
        }
    };

    const handleConfirmOrder = async () => {
        if (!user || !pkg) return;

        setSending(true);
        try {
            let paymentId = "";
            // 2. Save Notification to System (Record the Intent in DB)
            if (db) {
                const docRef = await addDoc(collection(db, 'payment_proofs'), {
                    userId: user.uid,
                    userDisplayName: user.displayName || (typeof user.email === 'string' ? user.email.split('@')[0] : 'User'),
                    userEmail: user.email,
                    packageId: pkg.id,
                    packageName: pkg.name,
                    amount: pkg.price,
                    status: 'pending',
                    slipUrl: 'line_manual',
                    method: 'line_manual',
                    createdAt: serverTimestamp()
                });
                paymentId = docRef.id;
            }

            // 3. Notify Admin via OneSignal and Internal System
            await notifyAdmins(paymentId);

            // 4. v4.9.28: Premium Flex Messaging Architecture (Minimal & Clean)
            const adminLineId = "Ub8ea2b9830c838a8df71333dee79c0dd"; // Verified Admin ID
            const magicLink = `${window.location.origin}/admin/users?uid=${user.uid}`;
            const refId = paymentId.slice(-8).toUpperCase();
            const qrUrl = `${window.location.origin}/img/scb-qr.jpg`;
            
            // --- 4.1 SIMPLE TEXT ALERT TO ADMIN ---
            const adminMsg = `📢 [Admin] รายการแจ้งโอนเงินใหม่!\n━━━━━━━━━━━━━━━\n👤 สมาชิก: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดโอน: ฿${pkg.price.toLocaleString()}\n🆔 อ้างอิง: ${refId}\n━━━━━━━━━━━━━━━\n✅ กดเพื่ออนุมัติ: ${magicLink}`;
            try {
                await axios.post('/api/notify/line-push', {
                    to: adminLineId,
                    message: adminMsg
                });
            } catch (adminError) {
                console.error("Admin text messaging failed:", adminError);
            }

            // --- 4.2 SIMPLE TEXT SUMMARY TO USER (Member) ---
            const targetLineUserId = (user as any).lineUserId || (user as any).providerData?.find((p: any) => p.providerId === 'line')?.uid;
            
            if (targetLineUserId) {
                const userMsg = `✅ [YouOKE] แจ้งรายละเอียดการโอนเงินครับ\n━━━━━━━━━━━━━━━\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดที่ต้องโอน: ฿${pkg.price.toLocaleString()}\n🏦 พร้อมเพย์: 086-465-3950\n👤 ชื่อบัญชี: ${bankInfo.accName}\n🆔 รหัสอ้างอิง: ${refId}\n━━━━━━━━━━━━━━━\n📸 รบกวนส่งสลิปให้แอดมินในแชทนี้ได้เลยครับ!`;
                
                // Ensure imageUrl is absolute HTTPS for LINE API
                const absoluteQrUrl = qrImage.startsWith('http') 
                    ? qrImage 
                    : `${window.location.origin}${qrImage}`;

                try {
                    await axios.post('/api/notify/line-push', {
                        to: targetLineUserId,
                        message: userMsg,
                        imageUrl: absoluteQrUrl
                    });
                } catch (userError) {
                    console.error("User text messaging failed:", userError);
                }
            }

            setSent(true);
            setTimeout(() => {
                setSent(false);
                onClose();
            }, 4000);
        } catch (error) {
            console.error("Confirmation error:", error);
            alert("เกิดข้อผิดพลาดในการแจ้งระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานทาง LINE ครับ");
        } finally {
            setSending(false);
        }
    };

    const openLineChat = () => {
        if (!user || !pkg) return;
        const message = `👋 แจ้งส่งสลิปการโอนเงินครับ (YouOKE)\n━━━━━━━━━━━━━━━\n👤 สมาชิก: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดโอน: ${pkg.price.toLocaleString()} บาท\n━━━━━━━━━━━━━━━\n📸 แนบสลิปในแชท: รบกวนกด "แนบรูปสลิป" ใน LINE นี้เพื่อให้แอดมินอนุมัติครับ`;
        const lineUrl = `https://line.me/R/oaMessage/@243lercy/?${encodeURIComponent(message)}`;
        window.open(lineUrl, '_blank');
        setTimeout(() => { if (document.hasFocus()) window.open("https://line.me/ti/p/@243lercy", '_blank'); }, 500);
    };

    if (sent) {
        return (
            <Transition show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[210]" onClose={onClose}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-[40px] bg-white p-12 text-center transition-all border border-slate-100">
                                <div className="mb-6 inline-flex p-5 rounded-full bg-emerald-50 text-emerald-500 animate-bounce border border-emerald-100">
                                    <Sparkles className="w-12 h-12" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">ส่งรายละเอียดเข้า LINE แล้ว!</h3>
                                <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">รายละเอียดการชำระเงินถูกส่งเข้า LINE ของคุณเรียบร้อยแล้ว รบกวนส่งสลิปให้แอดมินในแชทได้เลยครับ!</p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-zinc-900 hover:bg-black text-white rounded-3xl font-black text-sm transition-all active:scale-95 border border-zinc-900"
                                >
                                    รับทราบ
                                </button>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        );
    }

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[210]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[40px] bg-white p-8 transition-all border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <Dialog.Title as="h3" className="text-xl font-black text-slate-900 tracking-tight">ขั้นตอนการชำระเงิน</Dialog.Title>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 ring-1 ring-slate-100 p-6 rounded-[32px] mb-8 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">PromptPay QR Code</p>

                                <div className="bg-white p-4 rounded-3xl inline-block shadow-sm ring-1 ring-slate-100 relative group overflow-hidden">
                                    <img
                                        src={qrImage}
                                        alt="Payment QR"
                                        className="w-48 h-48 mx-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=PromptPay+QR";
                                        }}
                                    />
                                </div>

                                <div className="mt-6 space-y-1">
                                    <p className="text-3xl font-black text-slate-900">฿{pkg?.price.toLocaleString()}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{bankInfo.accName}</p>
                                </div>

                                <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-100 space-y-3 mt-6 text-left">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400">วิธีชำระ:</span>
                                        <span className="font-black text-slate-900">พร้อมเพย์ (PromptPay)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400">เลขพร้อมเพย์:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-slate-900">086-465-3950</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText("0864653950");
                                                    alert("คัดลอกเลขพร้อมเพย์แล้วครับ ✨");
                                                }}
                                                className="p-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-3 h-3 text-primary" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleConfirmOrder}
                                    disabled={sending}
                                    className={cn(
                                        "w-full py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95",
                                        "bg-zinc-900 text-white hover:bg-black"
                                    )}
                                >
                                    {sending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 text-emerald-400" />
                                            ยืนยันการสมัครและรับใบแจ้งหนี้
                                        </>
                                    )}
                                </button>

                                <div className="relative text-center py-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                    <span className="relative px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-widest italic">หรือติดต่อผ่าน LINE</span>
                                </div>

                                <button
                                    onClick={openLineChat}
                                    className="w-full py-4 rounded-[24px] border-2 border-[#06C755]/20 text-[#06C755] font-black text-sm flex items-center justify-center gap-3 hover:bg-[#06C755]/5 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    คุยกับแอดมินแจ้งส่งสลิปที่นี่
                                </button>
                                
                                <p className="text-[10px] font-bold text-slate-400 text-center px-6">
                                    *ระบบจะส่งรายละเอียดการโอนเงินให้คุณทาง LINE ทันที เมื่อแอดมินยืนยันยอดเงินแล้ว คุณจะได้รับการเปิดใช้งานแบบ VIP ครับ
                                </p>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

