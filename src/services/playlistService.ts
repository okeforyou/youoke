import { db } from "../firebase";
import {
    collection,
    query,
    getDocs,
    where,
    orderBy,
    limit,
    doc,
    setDoc,
    increment,
    deleteDoc,
    serverTimestamp,
    getDoc,
    updateDoc
} from "firebase/firestore";

export interface CommunityPlaylist {
    id: string; // e.g. "sp-37i9dQZF1DXcBWIGoYBM5M"
    title: string;
    thumbnail: string;
    source: 'spotify' | 'youtube' | 'youoke';
    likes: number;
    tracksCount: number | string;
    addedBy?: string; // UID of first liker
    createdAt?: any;
    updatedAt?: any;
    isOfficial?: boolean;
}

const COLLECTION_NAME = "community_playlists";

export const PlaylistService = {
    /**
     * Get Top Liked Playlists (Trending)
     */
    getTopPlaylists: async (max = 10): Promise<CommunityPlaylist[]> => {
        if (!db) return [];
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy("likes", "desc"),
                limit(max)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPlaylist));
        } catch (error) {
            console.error("Error fetching top playlists:", error);
            return [];
        }
    },

    /**
     * Fetch all playlists for Admin (with optional sorting/paging in future)
     */
    getAllPlaylists: async (): Promise<CommunityPlaylist[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPlaylist));
        } catch (error) {
            console.error("Error fetching all playlists:", error);
            return [];
        }
    },

    /**
     * 'Like' a playlist.
     * If it doesn't exist in our DB, create it.
     * If it exists, increment likes.
     */
    likePlaylist: async (playlist: { id: string; title: string; thumbnail: string; source: string; tracksCount: any }, userUid: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");

        const playlistRef = doc(db, COLLECTION_NAME, playlist.id);
        const docSnap = await getDoc(playlistRef);

        if (docSnap.exists()) {
            // Increment Like
            await updateDoc(playlistRef, {
                likes: increment(1),
                updatedAt: serverTimestamp()
            });
        } else {
            // Create New
            const newPlaylist: CommunityPlaylist = {
                id: playlist.id,
                title: playlist.title,
                thumbnail: playlist.thumbnail,
                source: playlist.source as any || 'spotify',
                likes: 1,
                tracksCount: playlist.tracksCount,
                addedBy: userUid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            await setDoc(playlistRef, newPlaylist);
        }
    },

    /**
     * Delete/Remove a playlist from Community (Admin only)
     */
    deletePlaylist: async (playlistId: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, COLLECTION_NAME, playlistId));
    },

    /**
     * Update Official Status (Admin)
     */
    toggleOfficial: async (playlistId: string, isOfficial: boolean): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await updateDoc(doc(db, COLLECTION_NAME, playlistId), {
            isOfficial,
            updatedAt: serverTimestamp()
        });
    }
};
