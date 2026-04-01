import React, { useState, useEffect } from 'react';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminSidebar } from '@/features/admin/layouts/AdminSidebar';
import { MegaphoneIcon, PaperAirplaneIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, getFirestore } from 'firebase/firestore';
import { app } from '@/firebase';

const db = app ? getFirestore(app) : null;

const BroadcastPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

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
      const res = await fetch('/api/admin/send-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, link: link.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: `✅ เผยแพร่ประกาศสำเร็จ!` });
        setTitle('');
        setBody('');
        setLink('');
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err: any) {
      console.error('Broadcast Error:', err);
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm('ยืนยันการลบประกาศนี้?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      console.error(err);
      alert('ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <MegaphoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">ประกาศข่าวสาร</h1>
                  <p className="text-slate-500 text-xs ">เขียนข่าวประกาศขึ้นกะดิ่ง (v4.2.1)</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                      placeholder="ใส่รายละเอียด..."
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
                    className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />}
                    ส่งประกาศ
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
                  <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.body}</p>
                        <div className="flex items-center gap-2 mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                          <ClockIcon className="w-3 h-3" />
                          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('th-TH') : 'NEW'}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
