import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
    RectangleStackIcon,
    PlusIcon,
    LockClosedIcon,
    GlobeAltIcon
} from "@heroicons/react/24/solid";
import { CheckIcon } from "@heroicons/react/24/outline";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, addDoc } from "firebase/firestore";
import { database } from "../firebase";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import Modal, { ModalHandler } from "./Modal";
import Alert, { AlertHandler } from "./Alert";
import Image from "next/image";

interface AddToPlaylistModalProps {
    video: any;
    onClose: () => void;
}

export default function AddToPlaylistModal({ video, onClose }: AddToPlaylistModalProps) {
    const { user } = useAuthStore();
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    const alertRef = useRef<AlertHandler>(null);
    const modalRef = useRef<ModalHandler>(null);

    // Initial Load
    useEffect(() => {
        if (user?.uid) {
            fetchPlaylists();
        } else {
            setIsLoading(false);
        }
        modalRef.current?.open();
    }, [user]);

    const fetchPlaylists = async () => {
        try {
            if (!database || !user?.uid) return;
            const q = query(
                collection(database, "playlists"),
                where("createdBy", "==", user.uid)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Start Sort by updated At or Created At
            setPlaylists(data);
        } catch (error) {
            console.error("Error fetching playlists:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        try {
            if (!database || !user?.uid) return;
            const newDoc = {
                name: newPlaylistName,
                createdBy: user.uid,
                type: 'private',
                starCount: 0,
                createdAt: new Date(),
                playlists: [video] // Add immediately
            };
            await addDoc(collection(database, "playlists"), newDoc);
            alertRef.current?.open();
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Error creating playlist:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        try {
            if (!database) return;
            const docRef = doc(database, "playlists", playlistId);
            await updateDoc(docRef, {
                playlists: arrayUnion(video)
            });
            alertRef.current?.open();
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (error) {
            console.error("Error adding to playlist:", error);
        }
    };

    if (!user) {
        return (
            <Modal
                ref={modalRef}
                title={<span className="text-lg font-bold flex items-center gap-2"><RectangleStackIcon className="w-5 h-5 text-primary" /> เพิ่มลงเพลย์ลิสต์</span>}
                body={
                    <div className="p-8 text-center">
                        <p className="text-gray-600 mb-6 font-medium">กรุณาเข้าสู่ระบบเพื่อสร้างและจัดการเพลย์ลิสต์ของคุณ</p>
                        <div className="flex justify-center gap-2">
                            <Link href="/login" className="btn btn-primary btn-sm text-white px-6">
                                เข้าสู่ระบบ
                            </Link>
                            <button onClick={onClose} className="btn btn-ghost btn-sm">ยกเลิก</button>
                        </div>
                    </div>
                }
                footer={<></>}
            />
        );
    }

    return (
        <>
            <Modal
                ref={modalRef}
                title={
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-800">บันทึกลงใน...</span>
                    </div>
                }
                body={
                    <div className="w-full sm:w-[400px] h-[400px] flex flex-col p-4 bg-white">
                        {/* New Playlist Input */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                className="flex-1 input input-bordered input-sm bg-gray-50 focus:bg-white transition-all"
                                placeholder="สร้างเพลย์ลิสต์ใหม่..."
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                            />
                            <button
                                disabled={!newPlaylistName.trim() || isCreating}
                                onClick={handleCreatePlaylist}
                                className="btn btn-primary btn-sm btn-square text-white"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center py-10"><div className="loading loading-spinner text-primary"></div></div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <RectangleStackIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">ยังไม่มีเพลย์ลิสต์</p>
                                </div>
                            ) : (
                                playlists.map((playlist) => {
                                    const isAlreadyAdded = playlist.playlists?.some((v: any) => v.videoId === video.videoId);
                                    return (
                                        <button
                                            key={playlist.id}
                                            onClick={() => !isAlreadyAdded && handleAddToPlaylist(playlist.id)}
                                            disabled={isAlreadyAdded}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isAlreadyAdded
                                                ? 'bg-green-50 border-green-200 opacity-80 cursor-default'
                                                : 'bg-white border-gray-100 hover:border-primary hover:shadow-md active:scale-95'
                                                }`}
                                        >
                                            <div className="relative w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                                {playlist.playlists?.[0] ? (
                                                    <Image
                                                        unoptimized
                                                        src={`${process.env.NEXT_PUBLIC_INVIDIOUS_URL}vi/${playlist.playlists[0].videoId}/mqdefault.jpg`}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <RectangleStackIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-semibold text-sm truncate ${isAlreadyAdded ? 'text-green-700' : 'text-gray-900'}`}>{playlist.name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    {playlist.type === 'private' ? <LockClosedIcon className="w-3 h-3" /> : <GlobeAltIcon className="w-3 h-3" />}
                                                    <span>{playlist.playlists?.length || 0} เพลง</span>
                                                </div>
                                            </div>
                                            {isAlreadyAdded && <CheckIcon className="w-5 h-5 text-green-600" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                }
                footer={
                    <div className="flex justify-end p-4 border-t border-gray-100 w-full">
                        <button onClick={onClose} className="text-gray-500 text-sm hover:text-gray-800 font-medium px-4 py-2">
                            ปิด
                        </button>
                    </div>
                }
            />
            <Alert
                ref={alertRef}
                timer={2000}
                headline="เรียบร้อย"
                headlineColor="text-green-600"
                bgColor="bg-green-100"
                content={<span className="text-sm font-medium text-green-700">เพิ่มเพลงลงในเพลย์ลิสต์แล้ว</span>}
                icon={<CheckIcon className="w-6 h-6 text-green-600" />}
            />
        </>
    );
}
