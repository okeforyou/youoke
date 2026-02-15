export interface VideoItem {
    videoId: string;
    title: string;
    author?: string | null;
    addedBy?: {
        name?: string;
        displayName?: string;
        photoURL?: string;
    };
    uuid?: string;
}
