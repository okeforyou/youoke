/**
 * YouTube Cast Context
 *
 * Provides YouTube Cast functionality:
 * - Generate YouTube playlist URL from video queue
 * - No real-time control (YouTube limitation)
 * - User scans QR code to open YouTube app
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SearchResult, RecommendedVideo } from '../types/invidious';

export type QueueVideo = SearchResult | RecommendedVideo;

interface YouTubeCastContextType {
  isYouTubeCastActive: boolean;
  playlist: QueueVideo[];
  setPlaylist: (videos: QueueVideo[]) => void;
  addToPlaylist: (video: QueueVideo) => void;
  generateYouTubeURL: () => string;
  startYouTubeCast: () => void;
  stopYouTubeCast: () => void;
}

const YouTubeCastContext = createContext<YouTubeCastContextType | undefined>(undefined);

export const useYouTubeCast = () => {
  const context = useContext(YouTubeCastContext);
  if (!context) {
    throw new Error('useYouTubeCast must be used within YouTubeCastProvider');
  }
  return context;
};

interface YouTubeCastProviderProps {
  children: ReactNode;
}

export const YouTubeCastProvider: React.FC<YouTubeCastProviderProps> = ({ children }) => {
  const [isYouTubeCastActive, setIsYouTubeCastActive] = useState(false);
  const [playlist, setPlaylist] = useState<QueueVideo[]>([]);

  const addToPlaylist = (video: QueueVideo) => {
    setPlaylist((prev) => [...prev, video]);
  };

  const generateYouTubeURL = (): string => {
    if (playlist.length === 0) return '';

    // Extract video IDs
    const videoIds = playlist.map((video) => video.videoId).join(',');

    // YouTube URL format for playlist
    // https://www.youtube.com/watch_videos?video_ids=ID1,ID2,ID3
    return `https://www.youtube.com/watch_videos?video_ids=${videoIds}`;
  };

  const startYouTubeCast = () => {
    setIsYouTubeCastActive(true);
    console.log('🎬 YouTube Cast started');
  };

  const stopYouTubeCast = () => {
    setIsYouTubeCastActive(false);
    console.log('⏹️ YouTube Cast stopped');
  };

  const value: YouTubeCastContextType = {
    isYouTubeCastActive,
    playlist,
    setPlaylist,
    addToPlaylist,
    generateYouTubeURL,
    startYouTubeCast,
    stopYouTubeCast,
  };

  return (
    <YouTubeCastContext.Provider value={value}>
      {children}
    </YouTubeCastContext.Provider>
  );
};
