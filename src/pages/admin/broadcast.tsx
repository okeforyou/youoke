import React, { useState, useEffect } from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminSidebar } from '@/features/admin/layouts/AdminSidebar';
import { MegaphoneIcon, PaperAirplaneIcon, TrashIcon, ClockIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, getFirestore, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/firebase';
import { useUIStore } from '@/stores/useUIStore';

const db = app ? getFirestore(app) : null;

const BroadcastPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const { showConfirm } = useUIStore();

  // 🛡️ Fetch existing announcements
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      if (isEditing && editId && db) {
        // Mode: Update
        await updateDoc(doc(db, 'announcements', editId), {
          title,
          body,
          link: link.trim() || null,
          updatedAt: serverTimestamp()
        });
        setStatus({ type: 'success', msg: `✅ อัปเดตประกาศสำเร็จ!` });
        resetForm();
      } else {
        // Mode: New (Legacy API or Direct addDoc)
        const res = await fetch('/api/admin/send-broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, link: link.trim() || undefined }),
        });

        if (res.ok) {
          setStatus({ type: 'success', msg: `✅ เผยแพร่ประกาศสำเร็จ!` });
          resetForm();
        } else {
          const data = await res.json();
          throw new Error(data.error || 'Failed to send');
        }
      }
    } catch (err: any) {
      console.error('Broadcast Error:', err);
      setStatus({ type: 'error', msg: err?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setLink('');
    setIsEditing(false);
    setEditId(null);
  };

  const startEdit = (item: any) => {
    setTitle(item.title);
    setBody(item.body);
    setLink(item.link || '');
    setEditId(item.id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'ลบประกาศ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้? ข้อมูลจะหายไปจากกะดิ่งของสมาชิกทุกคน',
      confirmText: 'ลบเลย',
      cancelText: 'ยกเลิก',
      type: 'danger',
      onConfirm: async () => {
        if (!db) return;
        try {
          await deleteDoc(doc(db, 'announcements', id));
          if (editId === id) resetForm();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="sticky top-24 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  {isEditing ? <PencilSquareIcon className="w-6 h-6" /> : <MegaphoneIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{isEditing ? 'แก้ไขประกาศ' : 'ประกาศข่าวสาร'}</h1>
                  <p className="text-slate-500 text-xs ">{isEditing ? `กำลังแก้ไข #${editId?.slice(0, 5)}` : 'เขียนข่าวประกาศขึ้นกะดิ่ง (v4.2.2)'}</p>
                </div>
                {isEditing && (
                  <button onClick={resetForm} className="ml-auto p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className={cn(
                "bg-white rounded-2xl border transition-all overflow-hidden",
                isEditing ? "border-primary/30 ring-4 ring-primary/5" : "border-slate-100 shadow-sm"
              )}>
                <form onSubmit={handleSend} className="p-5 space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">หัวข้อประกาศ</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="แจ้งวันหยุดสงกรานต์ 🎤"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">เนื้อหา</label>
                    <textarea
                      required
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="ใส่รายละเอียดที่ต้องการ..."
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">ลิงก์</label>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none text-sm"
                    />
                  </div>

                  {status && (
                    <div className={`p-4 rounded-xl text-xs font-bold ${
                      status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {status.msg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "w-full h-12 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg",
                      isEditing ? "bg-primary hover:bg-primary-dark shadow-primary/20" : "bg-primary hover:bg-primary-dark shadow-primary/20"
                    )}
                  >
                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : (isEditing ? <PencilSquareIcon className="w-5 h-5" /> : <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />)}
                    {isEditing ? 'อัปเดตข้อมูล' : 'ส่งประกาศ'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: List Management */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">จัดการประกาศเดิม</h2>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{announcements.length} รายการ</span>
              </div>

              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className={cn(
                    "bg-white border p-4 rounded-2xl shadow-sm transition-all group",
                    editId === item.id ? "border-primary/40 bg-primary/5" : "border-slate-100 hover:border-primary/20"
                  )}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.body}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                            <ClockIcon className="w-3 h-3" />
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('th-TH') : 'กำลังโหลด...'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => startEdit(item)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            editId === item.id ? "bg-primary text-white" : "text-slate-300 hover:text-primary hover:bg-primary/5"
                          )}
                          title="แก้ไข"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="ลบ"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {announcements.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <MegaphoneIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ไม่มีประกาศที่ถูกส่งไป</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BroadcastPage;

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

