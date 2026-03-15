import { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Copy, QrCode } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { db, storage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface UploadSlipModalProps {
    isOpen: boolean;
    onClose: () => void;
    pkg?: { id: string; name: string; price: number };
}

export const UploadSlipModal = ({ isOpen, onClose, pkg }: UploadSlipModalProps) => {
    const { user } = useAuthStore();
    const { config } = useSystemConfig();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bank Details (Dynamic from System Config)
    const bankInfo = {
        bank: config.payment?.bankAccount?.bankName || "กำลังโหลดข้อมูล...",
        accName: config.payment?.bankAccount?.accountName || "-",
        accNo: config.payment?.bankAccount?.accountNumber || "-"
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleUpload = async () => {
        if (!file || !user || !pkg || !storage || !db) return;

        setUploading(true);
        try {
            // 1. Upload Image to Firebase Storage
            const storageRef = ref(storage, `slips/${user.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Save Metadata to Firestore
            await addDoc(collection(db, 'payment_proofs'), {
                userId: user.uid,
                userDisplayName: user.displayName,
                packageId: pkg.id,
                packageName: pkg.name,
                amount: pkg.price,
                slipUrl: downloadURL,
                status: 'pending',
                createdAt: serverTimestamp(),
                paymentMethod: 'bank_transfer'
            });

            // 3. Send LINE Push Message (Official Account)
            try {
                await axios.post('/api/payment/line-push', {
                    message: `💸 บิลใหม่! (แบบโอน)\nUser: ${user.displayName}\nPackage: ${pkg.name}\nยอด: ${pkg.price.toLocaleString()} บาท`,
                    imageFullsize: downloadURL,
                    imageThumbnail: downloadURL
                });
            } catch (notifyError) {
                console.error("LINE Notify failed:", notifyError);
            }

            alert("แจ้งชำระเงินเรียบร้อย! ข้อมูลถูกส่งไปที่ LINE แอดมินแล้ว");
            onClose();

        } catch (error) {
            console.error("Upload error:", error);
            alert("เกิดข้อผิดพลาดในการอัปโหลด");
        } finally {
            setUploading(false);
        }
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
                                        {config.payment?.promptPay?.qrImageUrl ? (
                                            <img
                                                src={config.payment.promptPay.qrImageUrl}
                                                alt="Payment QR"
                                                className="w-48 h-48 mx-auto object-contain"
                                            />
                                        ) : (
                                            <div className="w-48 h-48 flex items-center justify-center text-muted-foreground bg-muted/20">
                                                <QrCode className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}
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

                                <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-100/50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>หลังจากโอนเงินแล้ว กรุณาอัปโหลดสลิปเพื่อให้แอดมินตรวจสอบข้อมูล</span>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer rounded-xl p-8 flex flex-col items-center justify-center transition-colors bg-muted/10 h-48"
                            >
                                {preview ? (
                                    <img src={preview} alt="Slip" className="max-h-full object-contain" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลดสลิป</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="w-full mt-6 btn btn-primary"
                            >
                                {uploading ? "กำลังส่งข้อมูล..." : "ยืนยันการโอนเงิน"}
                            </button>

                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
