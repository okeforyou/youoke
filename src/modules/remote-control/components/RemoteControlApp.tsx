
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInAnonymously } from 'firebase/auth';
import { ref, onValue, off, set, serverTimestamp } from 'firebase/database';
import { auth, realtimeDb } from '../../../firebase';
import { QueueItem } from '../../../modules/player/types';
import {
    ListMusic, Plus, User, Share2, Maximize
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Components
import { RemoteMiniPlayer } from './RemoteMiniPlayer';
import { SearchOverlay } from './SearchOverlay';
import { DraggableQueueItem } from './DraggableQueueItem';

// Types
type RemoteStatus = 'connecting' | 'connected' | 'error';
interface RoomState {
    queue: QueueItem[];
    currentIndex: number;
    currentVideo: QueueItem | null;
    controls: { isPlaying: boolean; isMuted: boolean; volume: number };
    isQueueVisible: boolean;
}

export default function RemoteControlApp() {
    const router = useRouter();
    const { room: roomCode } = router.query;

    // State
    const [status, setStatus] = useState<RemoteStatus>('connecting');
    const [roomState, setRoomState] = useState<RoomState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false, volume: 100 },
        isQueueVisible: false
    });
    const [guestName, setGuestName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);

    const [isSearchOpen, setSearchOpen] = useState(false);
    const [showLocalQr, setShowLocalQr] = useState(false);

    // Initial Setup
    useEffect(() => {
        const storedName = localStorage.getItem('youoke_guest_name');
        if (storedName) {
            setGuestName(storedName);
        } else {
            setShowNameModal(true);
        }
    }, []);

    // Firebase Connection (Realtime Listener)
    useEffect(() => {
        if (!roomCode || typeof roomCode !== 'string') return;
        if (showNameModal) return;

        const connect = async () => {
            if (!auth || !realtimeDb) {
                setStatus('error');
                return;
            }

            try {
                if (!auth.currentUser) await signInAnonymously(auth);

                // Listen to State
                const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
                const unsubscribe = onValue(stateRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        // Normalize Queue
                        const rawQueue = data.queue || [];
                        const queue = Array.isArray(rawQueue) ? rawQueue : Object.values(rawQueue);

                        setRoomState({
                            queue: queue.filter((i: any) => i && (i.videoId || i.id)),
                            currentIndex: data.currentIndex ?? 0,
                            currentVideo: data.currentVideo,
                            controls: data.controls || { isPlaying: false, isMuted: false, volume: 100 },
                            isQueueVisible: data.isQueueVisible
                        });
                        setStatus('connected');
                    } else {
                        setStatus('connecting'); // Room might not exist yet
                    }
                }, (error) => {
                    console.error("Firebase Read Error:", error);
                    setStatus('error');
                });

                return () => off(stateRef, 'value', unsubscribe);

            } catch (e) {
                console.error("Connection Error:", e);
                setStatus('error');
            }
        };

        const cleanup = connect();
        return () => { cleanup.then(unsub => unsub && unsub()); };
    }, [roomCode, showNameModal]);

    // Wake Lock to prevent screen sleep
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 Wake Lock active');
                }
            } catch (err) {
                console.warn('💡 Wake Lock failed:', err);
            }
        };
        requestWakeLock();
        return () => {
            if (wakeLock) wakeLock.release();
        };
    }, []);

    // Command Sender
    const sendCommand = async (type: string, payload: any = {}) => {
        if (!roomCode || !auth?.currentUser || !realtimeDb) return;

        const cmdId = Date.now().toString();
        const command = {
            id: cmdId,  // Add id property for useCommandExecutor
            command: {
                type,
                payload: {
                    ...payload,
                    addedBy: { uid: auth.currentUser.uid, name: guestName }
                }
            },
            status: 'pending',
            timestamp: serverTimestamp(),
            senderId: auth.currentUser.uid
        };

        console.log('📤 Sending command:', { type, roomCode, cmdId });

        // Write directly to commands list
        const cmdRef = ref(realtimeDb, `rooms/${roomCode}/commands/${cmdId}`);
        await set(cmdRef, command);

        console.log('✅ Command sent successfully');
    };

    // Handlers
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const input = (e.target as any).name.value;
        if (input.trim()) {
            localStorage.setItem('youoke_guest_name', input.trim());
            setGuestName(input.trim());
            setShowNameModal(false);
        }
    };

    const handleAddVideo = (video: any) => {
        console.log('➕ Adding video to queue:', video.title);
        sendCommand('ADD_TO_QUEUE', { video });
        setSearchOpen(false);
    };

    // Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        // Up Next songs are those after currentIndex
        const queueWithoutFirst = roomState.queue.slice(roomState.currentIndex + 1);

        const oldIndex = queueWithoutFirst.findIndex((item) => {
            const itemId = item.videoId || `${item.title}-${item.author}`;
            return itemId === active.id;
        });

        const newIndex = queueWithoutFirst.findIndex((item) => {
            const itemId = item.videoId || `${item.title}-${item.author}`;
            return itemId === over.id;
        });

        if (oldIndex === -1 || newIndex === -1) {
            console.warn('⚠️ Drag indices not found:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
            return;
        }

        // Reorder only the queue without the first item
        const reorderedQueue = arrayMove(queueWithoutFirst, oldIndex, newIndex);

        // Reconstruct full queue: [0...currentIndex, ...reorderedItems]
        const fullQueue = [
            ...roomState.queue.slice(0, roomState.currentIndex + 1),
            ...reorderedQueue
        ];

        console.log('🔄 Reordering queue:', { oldIndex, newIndex, newQueueLength: fullQueue.length });

        // Send REORDER_QUEUE command with full queue
        sendCommand('REORDER_QUEUE', { queue: fullQueue });
    };

    if (!roomCode) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-gray-500 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบรหัสห้อง</h2>
                <p className="text-sm text-center">กรุณาเข้าใช้งานผ่าน QR Code หรือลิงก์ที่มีรหัสห้อง</p>
                <p className="text-xs text-gray-400 mt-4">URL ต้องมี: ?room=1234</p>
            </div>
        );
    }

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 touch-pan-x touch-pan-y" style={{ overscrollBehaviorY: 'contain' }}>

            {/* Header */}
            <div className="bg-white px-5 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        ห้อง {roomCode}
                    </h1>
                    <div className="text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                            <User size={10} /> {guestName}
                        </span>
                        <span className="block text-[10px] opacity-50 mt-0.5">
                            Q: {roomState.queue.length} | Status: {status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Share Button */}
                    <button
                        onClick={() => setShowLocalQr(true)}
                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                    >
                        <Share2 size={20} />
                    </button>
                    {/* Monitor Fullscreen Toggle */}
                    <button
                        onClick={() => sendCommand('TOGGLE_FULLSCREEN')}
                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                    >
                        <Maximize size={20} />
                    </button>
                    {/* Monitor Controls Toggle */}
                    <button
                        onClick={() => sendCommand('TOGGLE_QUEUE_OVERLAY')}
                        className={`p-2 rounded-full transition-colors ${roomState.isQueueVisible ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}
                    >
                        <ListMusic size={20} />
                    </button>
                </div>
            </div>

            {/* Queue List */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <ListMusic className="text-primary" size={20} />
                        Up Next (คิวเพลง)
                    </h2>
                    <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {Math.max(0, roomState.queue.length - (roomState.currentIndex + 1))}
                    </span>
                </div>

                {roomState.queue.length <= 1 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="text-primary w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-gray-900">ยังไม่มีคิวเพลง</h3>
                        <p className="text-gray-500 text-sm mt-1">เพิ่มเพลงเพื่อเริ่มปาร์ตี้กันเลย!</p>
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                        >
                            เพิ่มเพลง
                        </button>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={roomState.queue.slice(roomState.currentIndex + 1).map(v => v.videoId || v.uuid || `${v.title}-${v.author}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {roomState.queue.slice(roomState.currentIndex + 1).map((video, idx) => {
                                    // Use videoId if available, otherwise create stable ID from title+author
                                    const uniqueId = video.videoId || video.uuid || `${video.title}-${video.author}`;
                                    return (
                                        <DraggableQueueItem
                                            key={uniqueId}
                                            video={video}
                                            index={idx}
                                            uniqueId={uniqueId}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* FAB (Add Button) */}
            <button
                onClick={() => setSearchOpen(true)}
                className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={32} strokeWidth={2.5} />
            </button>

            {/* Bottom Player */}
            <RemoteMiniPlayer
                currentVideo={roomState.currentVideo || (roomState.queue[roomState.currentIndex] || null)}
                isPlaying={roomState.controls.isPlaying}
                onTogglePlay={() => sendCommand(roomState.controls.isPlaying ? 'PAUSE' : 'PLAY')}
                onNext={() => sendCommand('NEXT')}
                onToggleQueue={() => sendCommand('TOGGLE_QUEUE_OVERLAY')}
            />

            {/* Search Overlay */}
            <SearchOverlay
                isOpen={isSearchOpen}
                onClose={() => setSearchOpen(false)}
                onAdd={handleAddVideo}
                guestName={guestName}
            />

            {/* Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">เข้าร่วมปาร์ตี้</h2>
                            <p className="text-gray-500 text-sm mt-1">ใส่ชื่อเล่นของคุณเพื่อเริ่มขอเพลง</p>
                        </div>
                        <form onSubmit={handleNameSubmit} className="space-y-4">
                            <input
                                name="name"
                                type="text"
                                placeholder="ชื่อเล่น (เช่น ตั้ม)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                maxLength={15}
                                autoFocus
                            />
                            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                                ไปลุยกันเลย!
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* QR Share Modal */}
            {showLocalQr && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6" onClick={() => setShowLocalQr(false)}>
                    <div className="bg-white p-6 rounded-3xl text-center space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg">สแกนเพื่อเข้าร่วม</h3>
                        <div className="bg-gray-100 p-2 rounded-xl inline-block">
                            {/* @ts-ignore */}
                            {roomCode && <QRCodeSVG value={`${window.location.origin}/remote?room=${roomCode}`} size={200} />}
                        </div>
                        <p className="text-sm text-gray-500">ให้เพื่อนสแกนเพื่อช่วยกันเพิ่มเพลง</p>
                    </div>
                </div>
            )}
        </div>
    );
}
