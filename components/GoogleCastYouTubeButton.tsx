/**
 * Google Cast Button for YouTube
 *
 * Auto-discovers Chromecast devices on same WiFi
 * Casts YouTube videos to Smart TV
 */

import React, { useEffect, useState } from 'react';

// YouTube receiver app ID (official)
const YOUTUBE_RECEIVER_APP_ID = 'CC1AD845';

interface GoogleCastYouTubeButtonProps {
  videoIds: string[]; // Array of YouTube video IDs to play
}

export const GoogleCastYouTubeButton: React.FC<GoogleCastYouTubeButtonProps> = ({ videoIds }) => {
  const [isCastAvailable, setIsCastAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castSession, setCastSession] = useState<any>(null);

  useEffect(() => {
    // Initialize Cast SDK when available
    (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        initializeCastApi();
      }
    };

    // Check if Cast SDK is already loaded
    if ((window as any).cast?.framework) {
      initializeCastApi();
    }
  }, []);

  const initializeCastApi = () => {
    const cast = (window as any).cast;
    if (!cast) return;

    const context = cast.framework.CastContext.getInstance();

    context.setOptions({
      receiverApplicationId: YOUTUBE_RECEIVER_APP_ID,
      autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Listen for session state changes
    context.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      (event: any) => {
        switch (event.sessionState) {
          case cast.framework.SessionState.SESSION_STARTED:
            setIsCasting(true);
            setCastSession(context.getCurrentSession());
            console.log('✅ Cast session started');
            break;
          case cast.framework.SessionState.SESSION_ENDED:
            setIsCasting(false);
            setCastSession(null);
            console.log('⏹️ Cast session ended');
            break;
        }
      }
    );

    setIsCastAvailable(true);
    console.log('✅ Google Cast initialized');
  };

  const startCasting = async () => {
    if (!(window as any).cast || videoIds.length === 0) return;

    try {
      const cast = (window as any).cast;
      const chrome = (window as any).chrome;
      const context = cast.framework.CastContext.getInstance();

      // Request session (will show device picker)
      await context.requestSession();

      const session = context.getCurrentSession();
      if (!session) return;

      // Build YouTube queue URL
      const queueUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;

      // Load media
      const mediaInfo = new chrome.cast.media.MediaInfo(queueUrl, 'video/youtube');
      const request = new chrome.cast.media.LoadRequest(mediaInfo);

      await session.loadMedia(request);
      console.log('🎬 Casting YouTube playlist:', videoIds.length, 'videos');
    } catch (error) {
      console.error('❌ Cast error:', error);
    }
  };

  const stopCasting = () => {
    if (!castSession) return;
    castSession.endSession(true);
  };

  if (!isCastAvailable) {
    return null; // Hide button if Cast not available
  }

  return (
    <button
      onClick={isCasting ? stopCasting : startCasting}
      disabled={videoIds.length === 0}
      className={`btn btn-sm gap-2 ${
        isCasting ? 'btn-success' : 'btn-primary'
      }`}
    >
      {/* Google Cast Icon */}
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
      </svg>
      {isCasting ? 'Casting to TV' : 'Cast to TV'}
    </button>
  );
};
