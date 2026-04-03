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
        if (isOpen && pkg && user) {
            const lineUserId = (user as any).lineUserId;
            const adminLineId = "U0862085736780c136365a26c92d5353"; // Admin/System LINE ID
            
            // 🟢 v4.9.13: Dual Notification (User Billing & Admin Lead) - DYNAMIC ORIGIN
            const sendInitialAlerts = async () => {
                if (!user || !pkg) return;
                try {
                    const magicLink = `${window.location.origin}/admin/users?uid=${user.uid}`;
                    
                    // 1. Send Instructions to User (BILL SUMMARY)
                    if (lineUserId) {
                        await axios.post('/api/notify/line-push', {
                            to: lineUserId,
                            message: `📢 รายละเอียดการชำระเงิน: ${pkg.name}\n━━━━━━━━━━━━━━━\n💰 ยอดที่ต้องโอน: ${pkg.price.toLocaleString()} บาท\n🏦 ธนาคาร: ${bankInfo.bank}\n🔢 เลขบัญชี: ${bankInfo.accNo}\n👤 ชื่อบัญชี: ${bankInfo.accName}\n━━━━━━━━━━━━━━━\n📸 โอนแล้วรบกวนส่งรูปสลิปในแชทนี้\nเพื่อให้แอดมินเปิดใช้งานระบบทันทีครับ! ❤️✨`
                        });
                    }
                    
                    // 2. Alert Admin (New Potential Order / LEAD)
                    await axios.post('/api/notify/line-push', {
                        to: adminLineId,
                        message: `👀 [YouOKE] มีลูกค้าสนใจแพ็กเกจเพิ่ม!\n━━━━━━━━━━━━━━━\n👤 สมาชิก: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💸 ยอดที่รอ: ${pkg.price.toLocaleString()} บาท\n━━━━━━━━━━━━━━━\n🔗 อนุมัติสมาชิกทันที (One-Click):\n${magicLink}`
                    });
                } catch (e) {
                    console.error("Failed to send initial LINE alerts:", e);
                }
            };
            sendInitialAlerts();
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
            if (!db || !user || !pkg) return;
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

            // 3. Notify Admin via OneSignal and Internal System
            await notifyAdmins(paymentId);

            // 4. v4.9.13: Special LINE Notification for Admin (Actionable)
            try {
                const adminLineId = "U0862085736780c136365a26c92d5353";
                const magicLink = `${window.location.origin}/admin/users?uid=${user.uid}`;
                
                await axios.post('/api/notify/line-push', {
                    to: adminLineId,
                    message: `💰 [PAYMENT] มีการแจ้งโอนเงินใหม่!\n━━━━━━━━━━━━━━━\n👤 สมาชิก: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดเงิน: ${pkg.price.toLocaleString()} บาท\n━━━━━━━━━━━━━━━\n📸 ตรวจสอบสลิปและอนุมัติ:\n${magicLink}`
                });

                // Auto-confirm to User if they have LINE
                if ((user as any).lineUserId) {
                    await axios.post('/api/notify/line-push', {
                        to: (user as any).lineUserId,
                        message: `✅ ระบบได้รับรูปสลิปของคุณเรียบร้อยแล้วครับ!\n━━━━━━━━━━━━━━━\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอด: ${pkg.price.toLocaleString()} บาท\n━━━━━━━━━━━━━━━\nแอดมินจะรีบทำการตรวจสอบและอนุมัติให้โดยไวที่สุดครับ ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ YouOKE นะครับ! ❤️✨`
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
        const message = `👋 แจ้งส่งสลิปการโอนเงินครับ (YouOKE)\n━━━━━━━━━━━━━━━\n👤 สมาชิก: ${user.displayName || user.email}\n📦 แพ็กเกจ: ${pkg.name}\n💰 ยอดโอน: ${pkg.price.toLocaleString()} บาท\n━━━━━━━━━━━━━━━\n📸 แนบสลิปในแชท: รบกวนกด "แนบรูปสลิป" ใน LINE นี้เพื่อให้แอดมินอนุมัติครับ\n━━━━━━━━━━━━━━━\n*ขอบคุณที่ไว้วางใจ YouOKE ครับ*`;
        
        // URL for LINE Official Account with pre-filled message
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
                                            className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-primary/50 hover:bg-primary/5 transition-all text-slate-400"
                                        >
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-sm font-bold">กดเพื่อเลือกรูปภาพสลิป</span>
                                        </button>
                                    ) : (
                                        <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 aspect-square max-h-[300px] mx-auto">
                                            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                            <button 
                                                onClick={() => {
                                                    setFile(null);
                                                    setPreviewUrl(null);
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    {!sent ? (
                                        <button
                                            onClick={handleNotifyAdmin}
                                            disabled={sending || !file}
                                            className={cn(
                                                "w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg",
                                                !file ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-zinc-900 text-white hover:bg-black shadow-zinc-200"
                                            )}
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {uploading ? 'กำลังอัปโหลดสลิป...' : 'กำลังแจ้งแอดมิน...'}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                    แจ้งโอนและเปิดใช้งานทันที
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 animate-in zoom-in-95 duration-300">
                                            <CheckCircle className="w-5 h-5" />
                                            แจ้งโอนเรียบร้อย! กำลังกลับ...
                                        </div>
                                    )}
                                </div>

                                <div className="relative text-center">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                    <span className="relative px-3 bg-white text-[10px] font-bold text-slate-300 uppercase tracking-widest">หรือแจ้งผ่าน LINE</span>
                                </div>

                                <button
                                    onClick={openLineChat}
                                    className="w-full py-4 rounded-2xl border-2 border-[#06C755]/20 text-[#06C755] font-black text-sm flex items-center justify-center gap-3 hover:bg-[#06C755]/5 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    แจ้งสลิปทางแชท LINE
                                </button>
                            </div>

                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
