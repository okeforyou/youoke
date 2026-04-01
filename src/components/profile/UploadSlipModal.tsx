import { useState, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, AlertCircle, Copy, QrCode, MessageCircle, ExternalLink, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase';
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

    // New states for file upload
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bank Details (Dynamic from System Config)
    const bankInfo = {
        bank: config.payment?.bankAccount?.bankName || "ไทยพาณิชย์ (SCB)",
        accName: config.payment?.bankAccount?.accountName || "บุญยานันทน์ ชูพินิจ",
        accNo: config.payment?.bankAccount?.accountNumber || "408-006876-3"
    };

    // Use default local path if config doesn't have one
    const qrImage = config.payment?.promptPay?.qrImageUrl || "/img/scb-qr.jpg";

    useEffect(() => {
        if (isOpen && pkg && user && (user as any).lineUserId) {
            // Send initial instructions to user via LINE (v4.3.1)
            const sendInstructions = async () => {
                try {
                    await axios.post('/api/notify/line-push', {
                        to: (user as any).lineUserId,
                        message: `📢 รายละเอียดการชำระเงินสำหรับ: ${pkg.name}\n💰 ยอดที่ต้องโอน: ${pkg.price.toLocaleString()} บาท\n🏦 ธนาคาร: ${bankInfo.bank}\n🔢 เลขบัญชี: ${bankInfo.accNo}\n👤 ชื่อบัญชี: ${bankInfo.accName}\n\nเมื่อโอนเสร็จแล้ว รบกวนแนบรูปสลิปในแอปเพื่อเปิดใช้งานทันทีครับ!`
                    });
                } catch (e) {
                    console.error("Failed to send LINE instructions:", e);
                }
            };
            sendInstructions();
        }
    }, [isOpen, pkg?.id]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const notifyAdmins = async (paymentId: string) => {
        try {
            if (!db) return;
            // Find admins to notify
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

    const handleNotifyAdmin = async () => {
        if (!user || !pkg) return;
        if (!file) {
            alert("กรุณาเลือกรูปภาพสลิปการโอนเงินก่อนครับ");
            return;
        }

        setSending(true);
        setUploading(true);
        try {
            let slipUrl = 'line_manual';

            // 1. Upload File to Storage
            if (storage && file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `slip_${user.uid}_${Date.now()}.${fileExt}`;
                const fileRef = storageRef(storage, `payment_slips/${user.uid}/${fileName}`);
                
                const uploadResult = await uploadBytes(fileRef, file);
                slipUrl = await getDownloadURL(uploadResult.ref);
            }

            setUploading(false);
            
            let paymentId = "";
            // 2. Save Notification to System (Save to DB as pending for Admin verification)
            if (db) {
                const docRef = await addDoc(collection(db, 'payment_proofs'), {
                    userId: user.uid,
                    userDisplayName: user.displayName || user.email?.split('@')[0],
                    userEmail: user.email,
                    packageId: pkg.id,
                    packageName: pkg.name,
                    amount: pkg.price,
                    status: 'pending',
                    slipUrl: slipUrl,
                    method: 'direct_upload',
                    createdAt: serverTimestamp()
                });
                paymentId = docRef.id;
            }

            // 3. Send Notification to Admins via FCM
            await notifyAdmins(paymentId);

            // 4. Send LINE Notification to Admin (v4.3.2 - Send Actual Slip Image!)
            try {
                const adminLineId = "U0862085736780c136365a26c92d5353"; // Admin/System LINE ID
                
                // Message 1: The Actual Slip Image (v4.3.2 Mastery)
                await axios.post('/api/notify/line-push', {
                    to: adminLineId,
                    flexMessage: {
                        type: "image",
                        originalContentUrl: slipUrl,
                        previewImageUrl: slipUrl
                    }
                });

                // Message 2: Details and Approval Link
                await axios.post('/api/notify/line-push', {
                    to: adminLineId,
                    message: `💰 แจ้งโอนเงินใหม่!\n👤 จาก: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💸 ยอด: ${pkg.price.toLocaleString()} บาท\n🔗 ตรวจสอบเพื่ออนุมัติ: https://play.okeforyou.com/admin/payments?id=${paymentId}`
                });
                
                // Also notify the user if they have linked LINE
                if ((user as any).lineUserId) {
                    await axios.post('/api/notify/line-push', {
                        to: (user as any).lineUserId,
                        message: `✅ ระบบรับรูปสลิปของคุณแล้ว!\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอด: ${pkg.price.toLocaleString()} บาท\n\nแอดมินตรวจสอบเสร็จจะแจ้งให้ทราบทันทีครับ!`
                    });
                }
            } catch (notifyError) {
                console.error("LINE Messaging failed:", notifyError);
            }

            setSent(true);
            setTimeout(() => {
                setSent(false);
                onClose();
            }, 3000);
        } catch (error) {
            console.error("Notification error:", error);
            alert("เกิดข้อผิดพลาดในการแจ้งระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานทาง LINE ครับ");
        } finally {
            setSending(false);
            setUploading(false);
        }
    };

    const openLineChat = () => {
        if (!user || !pkg) return;
        
        // Define the pre-filled message for the manual slip submission
        const message = `แจ้งส่งสลิปการโอนเงินครับ 💰\n👤 ชื่อผู้ใช้: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดโอน: ${pkg.price.toLocaleString()} บาท\n\n(รบกวนแนบรูปสลิปในแชทนี้เพื่อยืนยันด้วยนะครับ)`;
        
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
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all border border-slate-100">

                            <div className="flex justify-between items-center mb-4">
                                <Dialog.Title as="h3" className="text-lg font-bold text-slate-900">แจ้งโอนเงิน</Dialog.Title>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Payment Info Section */}
                            <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
                                <div className="text-center mb-5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">สแกนชำระผ่านแอปธนาคาร</p>

                                    {/* QR Image */}
                                    <div className="bg-white p-4 rounded-2xl inline-block shadow-sm border border-slate-100 relative group overflow-hidden">
                                        <img
                                            src={qrImage}
                                            alt="Payment QR"
                                            className="w-48 h-48 mx-auto object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=PromptPay+QR";
                                            }}
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-2xl font-black text-primary">฿{pkg?.price.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">ชื่อบัญชี: {bankInfo.accName}</p>
                                    </div>
                                </div>

                                {/* Bank Text Detail */}
                                <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-2 mt-4 text-left">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">ธนาคาร:</span>
                                        <span className="font-bold text-slate-900">{bankInfo.bank}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">เลขบัญชี:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900">{bankInfo.accNo}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(bankInfo.accNo.replace(/-/g, ''));
                                                    alert("คัดลอกเลขบัญชีแล้ว");
                                                }}
                                                className="p-1 hover:bg-slate-50 rounded transition-colors"
                                            >
                                                <Copy className="w-3 h-3 text-primary" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* File Upload Section */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">แนบสลิปการโอนเงิน (หลักฐานสำคัญ)</label>
                                    
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={onFileChange}
                                        accept="image/*"
                                        className="hidden" 
                                    />

                                    {!previewUrl ? (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all group"
                                        >
                                            <div className="p-3 bg-slate-100 rounded-full group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-400">คลิกเพื่อเลือกรูปภาพสลิป</span>
                                        </button>
                                    ) : (
                                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img src={previewUrl} alt="Slip Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                                                    className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleNotifyAdmin}
                                    disabled={sending || sent}
                                    className={cn(
                                        "w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 shadow-lg",
                                        sent 
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                            : !file
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                : "bg-primary hover:bg-opacity-90 border-none text-white shadow-primary/20"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {sending ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : sent ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <CheckCircle className="w-6 h-6" />
                                        )}
                                        <span className="text-lg font-black">
                                            {sent ? "ส่งข้อมูลสำเร็จแล้ว" : sending ? (uploading ? "กำลังอัปโหลด..." : "กำลังแจ้งระบบ...") : "กดยืนยันการแจ้งโอน"}
                                        </span>
                                    </div>
                                    {!sent && !sending && file && (
                                        <span className="text-[10px] opacity-80 font-bold uppercase tracking-tight">ระบบจะแจ้งแอดมินเพื่อตรวจสอบทันที</span>
                                    )}
                                </button>

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-3">
                                    <div className="bg-slate-200 rounded-full p-1 text-slate-600">
                                        <AlertCircle className="w-3 h-3" />
                                    </div>
                                    <p className="text-[10px] text-slate-600 font-bold leading-tight">
                                        หมายเหตุ: หลังจากเจ้าหน้าที่ตรวจสอบยอดเงินแล้ว ระบบจะเปิดใช้งานให้คุณโดยอัตโนมัติ พร้อมมีการแจ้งเตือนแจ้งกลับไปครับ
                                    </p>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
