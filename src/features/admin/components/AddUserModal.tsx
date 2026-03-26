import React, { useState } from 'react';
import { XMarkIcon, UserPlusIcon, EnvelopeIcon, LockClosedIcon, UserIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../utils/cn';

interface AddUserModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(true);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
              <UserPlusIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">เพิ่มสมาชิกใหม่</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Admin Manual Registration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-4">
          {success ? (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-90 duration-500">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircleIcon className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">สร้างสมาชิกสำเร็จ!</h3>
              <p className="text-sm text-slate-500 font-medium">ระบบกำลังรีเฟรชข้อมูลสมาชิก...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                  ⚠️ {error}
                </div>
              )}

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อที่แสดงผล</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder="เช่น สมชาย มีสุข"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมลสมาชิก</label>
                <div className="relative group">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน (6 ตัวอักษรขึ้นไป)</label>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">บทบาทสมาชิก</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'user'})}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-tight",
                      formData.role === 'user' ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'admin'})}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-tight",
                      formData.role === 'admin' ? "border-red-500 bg-red-50 text-red-600 shadow-sm" : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <ShieldCheckIcon className="w-4 h-4" /> Admin
                  </button>
                </div>
              </div>

              {/* Footer Button */}
              <div className="pt-4">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? <span className="loading loading-spinner loading-xs mr-2"></span> : null}
                  ยืนยันการเพิ่มสมาชิก
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
