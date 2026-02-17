import { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    PowerIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../../../utils/cn';
import Link from 'next/link';

interface CMSPage {
    id: string;
    title: string;
    section: string;
    isActive: boolean;
    order: number;
}

export const PageList = () => {
    const [pages, setPages] = useState<CMSPage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'cms_pages'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSPage));
            setPages(pageData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('คุณต้องการลบหน้านี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            if (!db) return;
            await deleteDoc(doc(db, 'cms_pages', id));
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!db) return;
        await updateDoc(doc(db, 'cms_pages', id), { isActive: !currentStatus });
    };

    const generateDemoContent = async () => {
        if (!confirm('สร้างหน้าตัวอย่าง (Demo Pages) เข้าสู่ระบบหรือไม่?')) return;
        setLoading(true);
        try {
            const demoPages = [
                {
                    id: 'how-to-use-demo',
                    title: '📖 วิธีการใช้งาน (How to Use)',
                    section: 'support',
                    type: 'html',
                    order: 1,
                    isActive: true,
                    content: `<h2>ยินดีต้อนรับสู่ YouOke! 🎵</h2><p>นี่คือคู่มือการใช้งานเบื้องต้นสำหรับสมาชิกใหม่</p><ul><li><strong>ค้นหาเพลง:</strong> พิมพ์ชื่อเพลงหรือศิลปินในช่องค้นหาด้านบน</li><li><strong>เข้าคิวเพลง:</strong> กดปุ่ม (+) เพื่อเพิ่มเพลงลงในคิว</li><li><strong>การควบคุม:</strong> ใช้แถบ Player ด้านล่างเพื่อหยุด หรือเปลี่ยนเพลง</li></ul><p><em>ขอให้สนุกกับการร้องเพลงครับ!</em></p>`,
                    createdAt: new Date()
                },
                {
                    id: 'community-rules',
                    title: '⚠️ กฎระเบียบ (Rules)',
                    section: 'support',
                    type: 'html',
                    order: 2,
                    isActive: true,
                    content: `<h3>กฎการอยู่ร่วมกัน</h3><ol><li>ห้ามใช้คำหยาบคายในห้องแชท</li><li>เคารพสิทธิ์ของผู้อื่นในการเลือกเพลง</li><li>หากพบปัญหา แจ้งแอดมินได้ทันทีที่เมนู "ติดต่อเรา"</li></ol>`,
                    createdAt: new Date()
                },
                {
                    id: 'special-promo',
                    title: '🔥 โปรโมชั่นพิเศษ',
                    section: 'custom',
                    type: 'link',
                    order: 3,
                    isActive: true,
                    url: 'https://www.youtube.com/watch?v=xvFZjo5PgG0',
                    createdAt: new Date()
                }
            ];

            for (const page of demoPages) {
                if (!db) continue;
                await setDoc(doc(db, 'cms_pages', page.id), page);
            }
            alert('สร้างหน้าตัวอย่างเรียบร้อยแล้ว');
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการสร้าง Demo: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = async (id: string, currentOrder: number, direction: 'up' | 'down') => {
        const swapTarget = direction === 'up'
            ? pages.slice().reverse().find(p => p.order < currentOrder)
            : pages.find(p => p.order > currentOrder);

        if (!swapTarget) return;
        if (!db) return;

        // Swap orders
        await updateDoc(doc(db, 'cms_pages', id), { order: swapTarget.order });
        await updateDoc(doc(db, 'cms_pages', swapTarget.id), { order: currentOrder });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการหน้าโปรไฟล์ (Profile CMS)</h1>
                    <p className="text-gray-500">สร้างและแก้ไขหน้าเนื้อหาเสริม เช่น คู่มือ, ประกาศ</p>
                </div>
                <div className="flex gap-2">
                    {pages.length === 0 && (
                        <button onClick={generateDemoContent} className="btn btn-secondary gap-2">
                            <PlusIcon className="w-4 h-4" /> Load Demo
                        </button>
                    )}
                    <Link href="/admin/content/profile-pages/new" className="btn btn-primary gap-2">
                        <PlusIcon className="w-4 h-4" /> สร้างหน้าใหม่
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-12 border-b border-gray-100 bg-gray-50 p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1 text-center">ลำดับ (Order)</div>
                    <div className="col-span-4">ชื่อหน้า (Title)</div>
                    <div className="col-span-3">หมวดหมู่ (Section)</div>
                    <div className="col-span-2 text-center">สถานะ (Status)</div>
                    <div className="col-span-2 text-center">จัดการ (Actions)</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
                ) : pages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="mb-4">ยังไม่มีหน้าในระบบ</p>
                        <button onClick={generateDemoContent} className="text-primary hover:underline font-medium">
                            + คลิกเพื่อสร้างหน้าตัวอย่าง (Demo Pages)
                        </button>
                    </div>
                ) : (
                    pages.map((page, index) => (
                        <div key={page.id} className="grid grid-cols-12 border-b border-gray-100 p-4 items-center hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                                <button
                                    disabled={index === 0}
                                    onClick={() => handleReorder(page.id, page.order, 'up')}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors text-gray-500"
                                >
                                    <ChevronUpIcon className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-mono text-gray-500">{page.order}</span>
                                <button
                                    disabled={index === pages.length - 1}
                                    onClick={() => handleReorder(page.id, page.order, 'down')}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors text-gray-500"
                                >
                                    <ChevronDownIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="col-span-4 font-semibold text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-400">
                                    <DocumentTextIcon className="w-5 h-5" />
                                </div>
                                {page.title}
                            </div>
                            <div className="col-span-3">
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-medium uppercase border",
                                    page.section === 'account' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                        page.section === 'support' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                            "bg-orange-50 text-orange-700 border-orange-100"
                                )}>
                                    {page.section}
                                </span>
                            </div>
                            <div className="col-span-2 text-center">
                                <button
                                    onClick={() => toggleStatus(page.id, page.isActive)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                                        page.isActive
                                            ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                    )}
                                >
                                    {page.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            <div className="col-span-2 flex justify-center gap-2">
                                <Link href={`/admin/content/profile-pages/${page.id}`}>
                                    <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="แก้ไข">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(page.id)}
                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                    title="ลบ"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
