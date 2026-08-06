import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { database } from '../../../firebase';

export interface WikiLyricsSync {
    id: string;                 // unique id
    videoId: string;            // YouTube Video ID (Foreign Key)
    authorId: string;           // User UID
    authorName: string;         // Display Name
    lrcContent: string;         // Standard LRC format string [mm:ss.xx]Text
    globalOffset: number;       // Global offset in seconds (e.g. -1.2)
    upvotes: number;            // 👍 Count
    downvotes: number;          // 👎 Count
    voterIds: string[];         // List of user UIDs who voted to prevent double voting
    isVerified: boolean;        // Approved by Admin/Community (>10 net votes)
    createdAt: any;             // Firestore Timestamp
    updatedAt: any;             // Firestore Timestamp
}

interface WikiLyricsState {
    activeSync: WikiLyricsSync | null;
    isLoading: boolean;
    error: string | null;

    fetchBestSync: (videoId: string) => Promise<WikiLyricsSync | null>;
    saveSync: (sync: Omit<WikiLyricsSync, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes' | 'voterIds' | 'isVerified'>) => Promise<void>;
    voteSync: (syncId: string, userId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
    saveLocalOffset: (videoId: string, offset: number) => void;
    getLocalOffset: (videoId: string) => number;
}

export const useWikiLyricsStore = create<WikiLyricsState>((set, get) => ({
    activeSync: null,
    isLoading: false,
    error: null,

    fetchBestSync: async (videoId: string) => {
        if (!database) {
            console.warn('WikiLyricsStore: Firebase database not initialized');
            return null;
        }

        set({ isLoading: true, error: null });
        try {
            const syncsRef = collection(database, 'yt_lyrics_syncs');
            // Query for this video, ordered by upvotes descending
            const q = query(
                syncsRef,
                where('videoId', '==', videoId),
                orderBy('upvotes', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const bestSync = querySnapshot.docs[0].data() as WikiLyricsSync;
                bestSync.id = querySnapshot.docs[0].id;
                set({ activeSync: bestSync, isLoading: false });
                return bestSync;
            } else {
                set({ activeSync: null, isLoading: false });
                return null;
            }
        } catch (err: any) {
            console.error('Error fetching best sync:', err);
            
            // If index is missing or other errors happen, just fail gracefully
            set({ isLoading: false, error: err.message, activeSync: null });
            return null;
        }
    },

    saveSync: async (syncData) => {
        if (!database) return;
        set({ isLoading: true, error: null });
        try {
            const syncsRef = collection(database, 'yt_lyrics_syncs');
            // ID format: videoId_userId
            const docId = `${syncData.videoId}_${syncData.authorId}`;
            const docRef = doc(syncsRef, docId);

            const newSync = {
                ...syncData,
                upvotes: 0,
                downvotes: 0,
                voterIds: [],
                isVerified: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(docRef, newSync, { merge: true });
            
            // Since we use merge, update updatedAt just in case it already existed
            await updateDoc(docRef, {
                updatedAt: serverTimestamp(),
                lrcContent: syncData.lrcContent,
                globalOffset: syncData.globalOffset
            });

            const savedSync = { ...newSync, id: docId } as any;
            set({ activeSync: savedSync, isLoading: false });
        } catch (err: any) {
            console.error('Error saving sync:', err);
            set({ isLoading: false, error: err.message });
            throw err;
        }
    },

    voteSync: async (syncId, userId, voteType) => {
        if (!database) return;
        try {
            const docRef = doc(database, 'yt_lyrics_syncs', syncId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) return;
            
            const data = docSnap.data() as WikiLyricsSync;
            
            // Prevent double voting
            if (data.voterIds && data.voterIds.includes(userId)) {
                return; // Already voted
            }

            const updates: any = {
                voterIds: [...(data.voterIds || []), userId]
            };
            
            if (voteType === 'upvote') {
                updates.upvotes = (data.upvotes || 0) + 1;
            } else {
                updates.downvotes = (data.downvotes || 0) + 1;
            }

            await updateDoc(docRef, updates);
            
            // Update local state if it's the active sync
            const currentActive = get().activeSync;
            if (currentActive && currentActive.id === syncId) {
                set({ activeSync: { ...currentActive, ...updates } });
            }
        } catch (err) {
            console.error('Error voting on sync:', err);
        }
    },

    saveLocalOffset: (videoId: string, offset: number) => {
        try {
            const key = `lyrics_offset_${videoId}`;
            localStorage.setItem(key, offset.toString());
        } catch (e) {
            // ignore localStorage errors
        }
    },

    getLocalOffset: (videoId: string) => {
        try {
            const key = `lyrics_offset_${videoId}`;
            const val = localStorage.getItem(key);
            if (val !== null && !isNaN(parseFloat(val))) {
                return parseFloat(val);
            }
        } catch (e) {}
        return 0;
    }
}));
