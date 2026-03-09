import { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Copy } from 'lucide-react';
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
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">สแกนเพื่อชำระเงิน (PromptPay)</p>

                                    {/* Static PromptPay QR */}
                                    <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border-2 border-primary/10 relative group">
                                        <img
                                            src={`https://promptpay.io/${config.payment?.promptPay?.id || config.payment?.bankAccount?.accountNumber}/${pkg?.price}.png`}
                                            alt="PromptPay QR"
                                            className="w-48 h-48 mx-auto"
                                        />
                                        <div className="mt-2 flex items-center justify-center gap-2">
                                            <div className="w-6 h-4 bg-[#003d6b] rounded-sm flex items-center justify-center text-[8px] font-bold text-white">Prompt</div>
                                            <div className="w-6 h-4 bg-[#f7a600] rounded-sm flex items-center justify-center text-[8px] font-bold text-white">Pay</div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xl font-black text-primary">฿{pkg?.price.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">ชื่อบัญชี: {bankInfo.accName}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 border-t border-border/50 pt-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">โอนผ่านเลขบัญชี:</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20">BANK</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-foreground">{bankInfo.bank}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-base font-black text-foreground tracking-wider">{bankInfo.accNo}</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(bankInfo.accNo);
                                                        alert("คัดลอกเลขบัญชีแล้ว!");
                                                    }}
                                                    className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
