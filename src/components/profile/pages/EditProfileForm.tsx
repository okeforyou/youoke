import { useState } from 'react';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { Camera, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/context/ToastContext";

export const EditProfileForm = () => {
    const { addToast } = useToast() || { addToast: (msg: string) => window.alert(msg) };
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        photoURL: user?.photoURL || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setLoading(true);
        try {
            if (!db) return;
            const userRef = doc(db, 'users', user.uid);

            // 1. Update Firestore Profile (For Main Sidebar/Admin)
            await updateDoc(userRef, {
                displayName: formData.displayName,
                photoURL: formData.photoURL,
                updatedAt: new Date()
            });

            // 2. Update Realtime Database Profile (For Profile Drawer/Music Player)
            const { updateUserProfile } = await import('@/services/userService');
            await updateUserProfile(user.uid, {
                displayName: formData.displayName,
                photoURL: formData.photoURL
            });

            // 3. Update Firebase Auth Identity (Core)
            const { getAuth, updateProfile } = await import('firebase/auth');
            const auth = getAuth();
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: formData.displayName,
                    photoURL: formData.photoURL
                });
            }

            // Ideally update local state or trigger re-fetch, 
            // but for now Firebase auth listener might catch it if we also updateProfile on Auth (optional but recommended)
            addToast('บันทึกข้อมูลเรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            addToast('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer">
                    <img
                        src={formData.photoURL || "https://ui-avatars.com/api/?name=" + formData.displayName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg group-hover:opacity-90 transition-opacity"
                        alt="Profile"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">แตะเพื่อเปลี่ยนรูปโปรไฟล์</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ชื่อที่แสดง (Display Name)</label>
                    <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="ชื่อของคุณ"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">URL รูปโปรไฟล์</label>
                    <input
                        type="url"
                        value={formData.photoURL}
                        onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="https://example.com/avatar.jpg"
                    />
                    <p className="text-[10px] text-muted-foreground">เพื่อความสะดวกรวดเร็ว รองรับเฉพาะ URL รูปภาพในขณะนี้</p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            </form>
        </div>
    );
};
