import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Loader2, HelpCircle, FileText, Globe } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface PageEditorProps {
    pageId?: string; // If null, create mode
}

export const PageEditor = ({ pageId }: PageEditorProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!pageId);

    const [formData, setFormData] = useState({
        title: '',
        section: 'support', // default
        type: 'html',       // html | link
        content: '',
        url: '',
        iconKey: 'FileText',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        if (!pageId) return;
        const fetchPage = async () => {
            if (!db) return;
            const docRef = doc(db, 'cms_pages', pageId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setFormData(snap.data() as any);
            }
            setFetching(false);
        };
        fetchPage();
    }, [pageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                updatedAt: new Date(),
                // If creating new, set createdAt
                ...(pageId ? {} : { createdAt: new Date() })
            };

            if (pageId) {
                if (!db) return;
                await updateDoc(doc(db, 'cms_pages', pageId), dataToSave);
            } else {
                if (!db) return;
                // Generate a simpler ID from title or random
                const newId = formData.title.toLowerCase().replace(/ /g, '-') + '-' + Math.random().toString(36).substr(2, 5);
                await setDoc(doc(db, 'cms_pages', newId), { id: newId, ...dataToSave });
            }
            router.push('/admin/content/profile-pages');
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center">Loading editor...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/content/profile-pages">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                </Link>
                <h1 className="text-2xl font-bold">{pageId ? 'แก้ไขหน้า' : 'สร้างหน้าใหม่'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-6 space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">ชื่อหน้า (Title)</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full h-11 rounded-lg border border-stroke bg-transparent px-4 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            placeholder="เช่น วิธีการใช้งาน, โปรโมชั่น"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">หมวดหมู่ (Section)</label>
                        <select
                            value={formData.section}
                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                            className="w-full h-11 rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                        >
                            <option value="account">Account (บัญชี)</option>
                            <option value="support">Support (ช่วยเหลือ)</option>
                            <option value="custom">Custom (อื่นๆ)</option>
                        </select>
                    </div>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold">รูปแบบเนื้อหา</label>
                    <div className="flex gap-4">
                        <label className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all w-full md:w-auto",
                            formData.type === 'html' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-stroke hover:bg-gray-50"
                        )}>
                            <input type="radio" className="hidden" name="type" checked={formData.type === 'html'} onChange={() => setFormData({ ...formData, type: 'html' })} />
                            <FileText className={cn("w-5 h-5", formData.type === 'html' ? "text-primary" : "text-gray-400")} />
                            <span className="font-medium">เนื้อหาข้อความ (HTML)</span>
                        </label>
                        <label className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all w-full md:w-auto",
                            formData.type === 'link' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-stroke hover:bg-gray-50"
                        )}>
                            <input type="radio" className="hidden" name="type" checked={formData.type === 'link'} onChange={() => setFormData({ ...formData, type: 'link' })} />
                            <Globe className={cn("w-5 h-5", formData.type === 'link' ? "text-primary" : "text-gray-400")} />
                            <span className="font-medium">ลิ้งค์ภายนอก (External Link)</span>
                        </label>
                    </div>
                </div>

                {/* Content Area */}
                {formData.type === 'html' ? (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">เนื้อหา (Rich Text)</label>
                        <div className="bg-white text-black rounded-lg overflow-hidden border border-stroke dark:border-strokedark">
                            <ReactQuill
                                theme="snow"
                                value={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                className="h-64 mb-12"
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, false] }],
                                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        ['link', 'clean']
                                    ],
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">พิมพ์เนื้อหาจัดรูปแบบได้ตามต้องการ</p>
                    </div>
                ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-semibold">URL ปลายทาง</label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="w-full h-11 rounded-lg border border-stroke bg-transparent px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white"
                            placeholder="https://example.com/promotion"
                        />
                    </div>
                )}

                {/* Submit Button */}
                <div className="pt-4 border-t border-stroke dark:border-strokedark flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span className="font-bold">บันทึกหน้า</span>
                    </button>
                </div>

            </form>
        </div>
    );
};
