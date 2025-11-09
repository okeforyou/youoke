/**
 * Google Cast Button for YouTube
 *
 * Auto-discovers Chromecast devices on same WiFi
 * Casts YouTube videos to Smart TV
 */

import React, { useEffect, useState } from 'react';

// Google Cast Application ID
// 4FB4C174 = YouOke Karaoke Custom Receiver (with queue support)
// Registered at: https://cast.google.com/publish
const YOUTUBE_RECEIVER_APP_ID = '4FB4C174';

interface GoogleCastYouTubeButtonProps {
  videoIds: string[]; // Array of YouTube video IDs to play
}

export const GoogleCastYouTubeButton: React.FC<GoogleCastYouTubeButtonProps> = ({ videoIds }) => {
  const [isCastAvailable, setIsCastAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castSession, setCastSession] = useState<any>(null);

  useEffect(() => {
    console.log('🎬 GoogleCastYouTubeButton: Initializing...');

    // Initialize Cast SDK when available
    (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
      console.log('🎬 Google Cast API available:', isAvailable);
      if (isAvailable) {
        initializeCastApi();
      }
    };

    // Check if Cast SDK is already loaded
    if ((window as any).cast?.framework) {
      console.log('🎬 Google Cast SDK already loaded');
      initializeCastApi();
    } else {
      console.log('⏳ Waiting for Google Cast SDK to load...');
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

      // Play first video (YouTube watch URL)
      const firstVideoUrl = `https://www.youtube.com/watch?v=${videoIds[0]}`;

      console.log('🎬 Casting YouTube video:', firstVideoUrl);
      console.log('📋 Total videos in queue:', videoIds.length);

      // Create metadata
      const metadata = new chrome.cast.media.GenericMediaMetadata();
      metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
      metadata.title = `Karaoke Video ${1}/${videoIds.length}`;

      // Create MediaInfo
      const mediaInfo = new chrome.cast.media.MediaInfo(firstVideoUrl, 'video/mp4');
      mediaInfo.metadata = metadata;
      mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;

      // Create LoadRequest
      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.autoplay = true;

      // Load media to Cast device
      session.loadMedia(request).then(
        () => {
          console.log('✅ Video loaded successfully!');

          // TODO: Queue remaining videos
          if (videoIds.length > 1) {
            console.log('📝 Note: Queue feature not implemented yet');
            console.log('💡 Remaining videos:', videoIds.slice(1));
          }
        },
        (error: any) => {
          console.error('❌ Load media failed:', error);
        }
      );

    } catch (error) {
      console.error('❌ Cast error:', error);
    }
  };

  const stopCasting = () => {
    if (!castSession) return;
    castSession.endSession(true);
  };

  // Always show button, but with different states
  const getButtonText = () => {
    if (!isCastAvailable) return 'Cast Loading...';
    if (isCasting) return 'Casting to TV';
    return 'Cast to TV';
  };

  const getButtonClass = () => {
    if (isCasting) return 'btn-success';
    if (!isCastAvailable) return 'btn-ghost';
    return 'btn-primary';
  };

  return (
    <button
      onClick={isCasting ? stopCasting : startCasting}
      disabled={!isCastAvailable || videoIds.length === 0}
      className={`btn btn-sm gap-2 ${getButtonClass()}`}
      title={!isCastAvailable ? 'Google Cast SDK loading...' : 'Cast to Chromecast device'}
    >
      {/* Google Cast Icon */}
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
      </svg>
      {getButtonText()}
    </button>
  );
};
