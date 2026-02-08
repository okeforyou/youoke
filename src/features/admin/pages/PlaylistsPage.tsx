import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../layouts/AdminLayout';
import { PlaylistService, CommunityPlaylist } from '../services/playlistService';
import {
    TrashIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    MusicalNoteIcon
} from '@heroicons/react/24/outline';

interface Toast {
    message: string;
    type: 'success' | 'error';
}

export default function AdminPlaylists() {
    const [playlists, setPlaylists] = useState<CommunityPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const data = await PlaylistService.getAllPlaylists();
            setPlaylists(data);
        } catch (error) {
            console.error(error);
            showToast("Failed to fetch playlists", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("ยืนยันการลบเพลย์ลิสต์นี้ออกจากระบบ?")) return;
        try {
            await PlaylistService.deletePlaylist(id);
            showToast("ลบเพลย์ลิสต์เรียบร้อย");
            fetchPlaylists(); // Refresh
        } catch (error) {
            showToast("ลบไม่สำเร็จ", "error");
        }
    };

    const handleToggleOfficial = async (id: string, current: boolean) => {
        try {
            await PlaylistService.toggleOfficial(id, !current);
            showToast("อัพเดทสถานะเรียบร้อย");
            // Optimistic update
            setPlaylists(prev => prev.map(p => p.id === id ? { ...p, isOfficial: !current } : p));
        } catch (error) {
            showToast("อัพเดทไม่สำเร็จ", "error");
        }
    };

    return (
        <AdminLayout>
            <Head>
                <title>YouOke Admin | Playlists</title>
            </Head>
            {toast && (
                <div className={`toast toast-top toast-end z-50`}>
                    <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} text-white`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการเพลย์ลิสต์ (Community Playlists)</h1>
                    <p className="text-gray-500">เพลย์ลิสต์ที่ถูก Like หรือเพิ่มโดยผู้ใช้งาน</p>
                </div>
                <button onClick={fetchPlaylists} className="btn btn-ghost gap-2">
                    <ArrowPathIcon className="w-4 h-4" /> รีเฟรช (Refresh)
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ปก (Cover)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ชื่อเพลย์ลิสต์ (Title)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">สถิติ (Stats)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">ที่มา (Source)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">จัดการ (Actions)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</td></tr>
                            ) : playlists.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">ยังไม่มีเพลย์ลิสต์จากชุมชน</td></tr>
                            ) : (
                                playlists.map((playlist) => (
                                    <tr key={playlist.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            {playlist.thumbnail ? (
                                                <img
                                                    src={playlist.thumbnail}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
                                                    onError={(e) => (e.currentTarget.src = "https://placehold.co/100?text=No+Img")}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                                    <MusicalNoteIcon className="w-6 h-6" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 line-clamp-1 max-w-[250px]">{playlist.title}</div>
                                            <div className="text-xs text-gray-500 font-mono">{playlist.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-xs">
                                                    <span className="block font-bold text-rose-500">♥ {playlist.likes || 0}</span>
                                                    <span className="text-gray-400">ถูกใจ</span>
                                                </div>
                                                <div className="text-xs">
                                                    <span className="block font-bold text-gray-700">{playlist.tracksCount || 0}</span>
                                                    <span className="text-gray-400">เพลง</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${playlist.source === 'spotify' ? 'badge-success text-white' : 'badge-ghost'}`}>
                                                {playlist.source}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleOfficial(playlist.id, !!playlist.isOfficial)}
                                                    className={`btn btn-sm btn-circle ${playlist.isOfficial ? 'btn-primary text-white' : 'btn-ghost text-gray-300'}`}
                                                    title="ตั้งเป็น Official"
                                                >
                                                    <CheckBadgeIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(playlist.id)}
                                                    className="btn btn-sm btn-ghost text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    title="ลบเพลย์ลิสต์"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
