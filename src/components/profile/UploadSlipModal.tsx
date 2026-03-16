import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, AlertCircle, Copy, QrCode, MessageCircle, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

    // Use default local path if config doesn't have one
    const qrImage = config.payment?.promptPay?.qrImageUrl || "/img/scb-qr.jpg";

    const handleNotifyAdmin = async () => {
        if (!user || !pkg) return;

        setSending(true);
        try {
            // Send Notification to System (Optional: Save to DB as pending)
            if (db) {
                await addDoc(collection(db, 'payment_notifications'), {
                    userId: user.uid,
                    userDisplayName: user.displayName,
                    userEmail: user.email,
                    packageId: pkg.id,
                    packageName: pkg.name,
                    amount: pkg.price,
                    status: 'notified',
                    createdAt: serverTimestamp(),
                    method: 'line_manual'
                });
            }

            // Send LINE Push Message (Official Account) - Text Only since we can't upload
            try {
                await axios.post('/api/payment/line-push', {
                    message: `💰 การแจ้งโอนเงินใหม่! (รอยืนยันสลิปทาง LINE)\n👤 User: ${user.displayName || user.email}\n📦 Package: ${pkg.name}\n💵 ยอด: ${pkg.price.toLocaleString()} บาท\n\n*ผู้ใช้กำลังจะส่งสลิปให้ทาง LINE แชทครับ*`
                });
            } catch (notifyError) {
                console.error("LINE Notify failed:", notifyError);
            }

            setSent(true);
            setTimeout(() => {
                setSent(false);
                onClose();
            }, 3000);
        } catch (error) {
            console.error("Notification error:", error);
            alert("เกิดข้อผิดพลาดในการแจ้งระบบ แต่คุณยังสามารถส่งสลิปทาง LINE ได้โดยตรงครับ");
        } finally {
            setSending(false);
        }
    };

    const openLineChat = () => {
        if (!user || !pkg) return;
        
        // Define the pre-filled message for the manual slip submission
        const message = `แจ้งส่งสลิปครับ\n👤 ชื่อผู้ใช้: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดโอน: ${pkg.price.toLocaleString()} บาท`;
        
        // URL for LINE Official Account with pre-filled message
        // Reference: https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/
        const lineUrl = `https://line.me/R/oaMessage/@243lercy/?${encodeURIComponent(message)}`;
        
        window.open(lineUrl, '_blank');
        
        // Fallback for desktop if the R/ scheme fails
        setTimeout(() => {
            if (document.hasFocus()) {
                 window.open("https://line.me/ti/p/@243lercy", '_blank');
            }
        }, 500);
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
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
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background p-6 shadow-xl transition-all border border-border">

                            <div className="flex justify-between items-center mb-4">
                                <Dialog.Title as="h3" className="text-lg font-bold">แจ้งโอนเงิน</Dialog.Title>
                                <button onClick={onClose}><X className="w-5 h-5" /></button>
                            </div>

                            {/* Payment Info Section */}
                            <div className="bg-muted/30 p-5 rounded-2xl mb-6 border border-border/50 shadow-inner">
                                <div className="text-center mb-5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">สแกนชำระผ่านแอปธนาคาร (SCB PROMPTPAY)</p>

                                    {/* QR Image */}
                                    <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border-2 border-primary/10 relative group overflow-hidden">
                                        <img
                                            src={qrImage}
                                            alt="Payment QR"
                                            className="w-48 h-48 mx-auto object-contain"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=PromptPay+QR";
                                            }}
                                        />
                                        <div className="mt-2 flex items-center justify-center gap-2">
                                            <div className="w-8 h-4 bg-[#4e2e7f] rounded-sm flex items-center justify-center text-[7px] font-bold text-white uppercase">{bankInfo.bank.includes('SCB') ? 'SCB' : 'BANK'}</div>
                                            <div className="w-10 h-4 bg-[#003d6b] rounded-sm flex items-center justify-center text-[8px] font-bold text-white">PROMPT</div>
                                            <div className="w-6 h-4 bg-[#f7a600] rounded-sm flex items-center justify-center text-[8px] font-bold text-white">PAY</div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-2xl font-black text-primary">฿{pkg?.price.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">ชื่อบัญชี: {bankInfo.accName}</p>
                                    </div>
                                </div>

                                {/* Bank Text Detail */}
                                <div className="bg-background/80 backdrop-blur rounded-xl p-3 border border-border/50 space-y-2 mt-4 text-left">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">ธนาคาร:</span>
                                        <span className="font-bold">{bankInfo.bank}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">เลขบัญชี:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">{bankInfo.accNo}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(bankInfo.accNo.replace(/-/g, ''));
                                                    alert("คัดลอกเลขบัญชีแล้ว");
                                                }}
                                                className="p-1 hover:bg-muted rounded transition-colors"
                                            >
                                                <Copy className="w-3 h-3 text-primary" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-100/50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                    <MessageCircle className="w-4 h-4 text-[#06C755] shrink-0" />
                                    <span>โอนเงินเสร็จแล้ว กดปุ่มด้านล่างเพื่อส่งสลิปผ่านทาง LINE เพื่อเปิดใช้งานทันที</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        await handleNotifyAdmin();
                                        openLineChat();
                                    }}
                                    disabled={sending || sent}
                                    className={cn(
                                        "w-full btn h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 shadow-lg",
                                        sent 
                                            ? "bg-green-50 text-green-600 border-green-200" 
                                            : "bg-[#06C755] hover:bg-[#05b14c] border-none text-white shadow-green-500/20"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {sending ? (
                                            <span className="loading loading-spinner loading-sm"></span>
                                        ) : sent ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <MessageCircle className="w-6 h-6" />
                                        )}
                                        <span className="text-lg font-black">
                                            {sent ? "แจ้งระบบสำเร็จแล้ว" : "โอนแล้ว แจ้งส่งสลิปผ่าน LINE"}
                                        </span>
                                    </div>
                                    {!sent && !sending && (
                                        <span className="text-[10px] opacity-80 font-bold uppercase tracking-tight">ระบบจะบันทึกข้อมูลและเปิดหน้าแชท LINE อัตโนมัติ</span>
                                    )}
                                </button>

                                <p className="text-[10px] text-center text-muted-foreground px-4">
                                    เมื่อกดปุ่ม ระบบจะส่งข้อมูลการจองไปยังทีมงาน 
                                    และเปิดแอป LINE เพื่อให้ท่านส่งหลักฐานการโอนเงินครับ
                                </p>
                            </div>

                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
