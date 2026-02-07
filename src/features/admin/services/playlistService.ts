import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "../../../../firebase";

export interface CommunityPlaylist {
    id: string;
    title: string;
    thumbnail?: string;
    tracksCount: number;
    likes: number;
    source: 'spotify' | 'youtube' | 'apple';
    isOfficial?: boolean;
    createdBy?: string;
    createdAt?: any;
}

export const PlaylistService = {
    getAllPlaylists: async (): Promise<CommunityPlaylist[]> => {
        if (!db) return [];
        try {
            const playlistsRef = collection(db, "playlists");
            const q = query(playlistsRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityPlaylist));
        } catch (error) {
            console.error("Error fetching playlists:", error);
            return [];
        }
    },

    deletePlaylist: async (id: string) => {
        if (!db) throw new Error("Firebase not initialized");
        await deleteDoc(doc(db, "playlists", id));
    },

    toggleOfficial: async (id: string, isOfficial: boolean) => {
        if (!db) throw new Error("Firebase not initialized");
        await updateDoc(doc(db, "playlists", id), {
            isOfficial: isOfficial
        });
    }
};
