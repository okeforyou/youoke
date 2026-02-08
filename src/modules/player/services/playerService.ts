import { YouTubeAdapter } from "../adapters/YouTubeAdapter";
import { MediaPlayerAdapter } from "../types";
import { usePlayerStore } from "../stores/usePlayerStore";

class PlayerService {
    private adapter: MediaPlayerAdapter;

    constructor() {
        // Default to YouTube
        this.adapter = new YouTubeAdapter((state) => {
            // Callback when player state changes (from adapter)
            // e.g. timeupdate, ended, etc.
            usePlayerStore.getState().setPlayerState(state);
        });
    }

    getAdapter() {
        return this.adapter;
    }

    // Proxy methods to the active adapter
    async play() {
        await this.adapter.play();
        usePlayerStore.getState().play();
    }

    async pause() {
        await this.adapter.pause();
        usePlayerStore.getState().pause();
    }

    async seekTo(seconds: number) {
        await this.adapter.seekTo(seconds);
    }

    async setVolume(volume: number) {
        await this.adapter.setVolume(volume);
        usePlayerStore.getState().setVolume(volume);
    }

    async loadMedia(videoId: string) {
        await this.adapter.loadMedia(videoId);
    }
}

export const playerService = new PlayerService();
