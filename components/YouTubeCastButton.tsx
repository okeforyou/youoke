/**
 * YouTube Cast Button Component
 *
 * Opens YouTube app on mobile with playlist
 * User can then use YouTube's native Cast feature
 */

import React from 'react';
import { useYouTubeCast } from '../context/YouTubeCastContext';

export const YouTubeCastButton: React.FC = () => {
  const {
    playlist,
    generateYouTubeURL,
  } = useYouTubeCast();

  const handleCastClick = () => {
    if (playlist.length === 0) {
      alert('กรุณาเพิ่มเพลงลงคิวก่อน');
      return;
    }

    const youtubeURL = generateYouTubeURL();

    // Open YouTube app with playlist
    console.log('📱 Opening YouTube app with playlist:', youtubeURL);

    // Open in new tab/window (will open YouTube app on mobile)
    window.open(youtubeURL, '_blank');
  };

  return (
    <button
      onClick={handleCastClick}
      className="btn btn-sm btn-primary gap-2"
      disabled={playlist.length === 0}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
      </svg>
      Open in YouTube
    </button>
  );
};
