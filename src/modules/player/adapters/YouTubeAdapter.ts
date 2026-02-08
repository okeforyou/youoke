import { MediaPlayerAdapter } from '../types';
import { YouTubePlayer } from 'react-youtube';

export class YouTubeAdapter implements MediaPlayerAdapter {
    id = 'youtube';
    private player: YouTubePlayer | null = null;
    private onStateChange: (state: any) => void;

    constructor(onStateChange: (state: any) => void) {
        this.onStateChange = onStateChange;
    }

    setPlayer(player: YouTubePlayer) {
        this.player = player;
    }

    async play() {
        await this.player?.playVideo();
    }

    async pause() {
        await this.player?.pauseVideo();
    }

    async resume() {
        await this.player?.playVideo();
    }

    async stop() {
        await this.player?.stopVideo();
    }

    async seekTo(seconds: number) {
        await this.player?.seekTo(seconds, true);
    }

    async setVolume(volume: number) {
        await this.player?.setVolume(volume);
    }

    async getDuration() {
        return (await this.player?.getDuration()) || 0;
    }

    async getCurrentTime() {
        return (await this.player?.getCurrentTime()) || 0;
    }

    async loadMedia(videoId: string) {
        // React-YouTube handles props update automatically for videoId
        // But direct control can be done via loadVideoById if needed
        await this.player?.loadVideoById(videoId);
    }
}
