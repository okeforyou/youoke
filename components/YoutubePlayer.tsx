import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFullscreen, usePromise, useToggle } from "react-use";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";

import {
  ArrowUturnLeftIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  TvIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import { useCast } from "../context/CastContext";
import { useFirebaseCast } from "../context/FirebaseCastContext";
import { useToast } from "../context/ToastContext";
import useIsMobile from "../hooks/isMobile";
import { useKaraokeState } from "../hooks/karaoke";
import { useRoomState } from "../hooks/room";
import Alert, { AlertHandler } from "./Alert";
import BottomAds from "./BottomAds";
import { CastModeSelector } from "./CastModeSelector";
import VideoAds from "./VideoAds";
import DebugOverlay, { addDebugLog } from "./DebugOverlay";
import PlayerControls from "./PlayerControls";

function YoutubePlayer({
  videoId,
  nextSong,
  className = "",
  extra = null,
  isMoniter = false,
}) {
  const router = useRouter();
  const playerRef = useRef<YouTube>();
  const fullscreenRef = useRef<HTMLDivElement>();
  const [show, toggleFullscreen] = useToggle(false);
  const isFullscreen = useFullscreen(fullscreenRef, show, {
    onClose: () => toggleFullscreen(false),
  });
  const [playerState, setPlayerState] = useState<number>();
  const { user } = useAuth();
  const isLogin = !!user.uid;
  const {
    isConnected: isCasting,
    roomCode,
    joinRoom,
    leaveRoom,
    play: firebaseCastPlay,
    pause: firebaseCastPause,
    next: firebaseCastNext,
    state: firebaseCastState,
  } = useFirebaseCast();
  const {
    connect: connectGoogleCast,
    disconnect: disconnectGoogleCast,
    setPlaylist: setGoogleCastPlaylist,
    isAvailable: isCastAvailable,
    isConnected: isGoogleCastConnected,
    receiverName,
    next: castNext,
    previous: castPrevious,
    play: castPlay,
    pause: castPause,
  } = useCast();

  const [isFullScreenIphone, setIsFullScreenIphone] = useState<boolean>(false);
  const alertRef = useRef<AlertHandler>(null);
  const alertFullNotWorkRef = useRef<AlertHandler>(null);

  const [isIphone, setIsIphone] = useState<boolean>(false);
  const [isCastOverlayOpen, setIsCastOverlayOpen] = useState<boolean>(false);
  const [showCastModeSelector, setShowCastModeSelector] = useState<boolean>(false);
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [castInputRoomCode, setCastInputRoomCode] = useState<string>('');
  const [castError, setCastError] = useState<string>('');
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [isDebugOverlayOpen, setIsDebugOverlayOpen] = useState<boolean>(false);

  const { playlist, curVideoId, setCurVideoId, setPlaylist } =
    useKaraokeState();

  const { room, setRoom } = useRoomState();
  const { addToast } = useToast();
  const isMobile = useIsMobile();

  const [isOpenMonitor, setIsOpenMonitor] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isShowAds, setIsShowAds] = useState(false);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [inputRoomId, setInputRoomId] = useState("");

  const mounted = usePromise();

  const [isMouseMoving, setIsMouseMoving] = useState(true);
  let timeoutId: NodeJS.Timeout;

  const handleMouseMove = () => {
    setIsMouseMoving(true);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setIsMouseMoving(false);
    }, 3000); // 3 seconds delay before hiding the div
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  // Check if Dual Mode is active
  useEffect(() => {
    if (isMoniter) return; // Don't run on monitor/dual screen

    const checkDualMode = () => {
      const dualActive = localStorage.getItem('youoke-dual-active') === 'true';
      setIsDualMode(dualActive);
    };

    checkDualMode();

    // Listen for storage changes (when dual screen closes)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'youoke-dual-active') {
        setIsDualMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isMoniter]);

  const UseFullScreenCss = isFullScreenIphone;
  const isIOS =
    /iPad|iPhone/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  async function updatePlayerState(player: YouTubePlayer) {
    if (!player) return;
    const [muteState, playerState] = await mounted(
      Promise.allSettled([player.isMuted(), player.getPlayerState()])
    );

    // These lines will not execute if this component gets unmounted.
    if (muteState.status === "fulfilled") setIsMuted(muteState.value);
    if (playerState.status === "fulfilled") {
      setPlayerState(playerState.value);

      // Update Media Session playback state for Android lock screen
      // Allow for both local and Cast modes (skip only Monitor/Dual modes)
      if ('mediaSession' in navigator && !isMoniter && !isDualMode) {
        switch (playerState.value) {
          case YouTube.PlayerState.PLAYING:
          case YouTube.PlayerState.BUFFERING:
            navigator.mediaSession.playbackState = 'playing';
            console.log('🎵 Media Session: Auto-updated to PLAYING');
            break;
          case YouTube.PlayerState.PAUSED:
            navigator.mediaSession.playbackState = 'paused';
            console.log('🎵 Media Session: Auto-updated to PAUSED');
            break;
          case YouTube.PlayerState.ENDED:
            navigator.mediaSession.playbackState = 'none';
            console.log('🎵 Media Session: Auto-updated to NONE');
            break;
        }
      }
    }
  }

  useEffect(() => {
    if (!!videoId) setVideoCount(videoCount + 1);
  }, [videoId]);

  // Socket.io removed - now using Firebase Realtime Database
  // See monitor.tsx for new Cast implementation
  useEffect(() => {
    // No socket connection needed for standalone player
  }, []);

  useEffect(() => {
    if (playlist?.length && !curVideoId) {
      // playing first video
      const [video, ...newPlaylist] = playlist;
      setCurVideoId(video.videoId);
      // then remove it from playlist
      setPlaylist(newPlaylist);
    }
  }, [playlist, curVideoId]);

  useEffect(() => {
    //Play Now - Firebase Cast handles sync now
  }, [curVideoId]);

  // sendMessage removed - Firebase Cast handles sync now

  useEffect(() => {
    if (!isLogin && videoCount % 1 == 0 && videoCount !== 0) {
      handlePause();
      setIsShowAds(false);
      setTimeout(() => setIsShowAds(true), 200);
    }
  }, [videoCount]);

  // BroadcastChannel for Dual Screen sync
  useEffect(() => {
    if (isMoniter) return; // Only main screen sends updates

    const channel = new BroadcastChannel('youoke-dual-sync');

    // Listen for state requests from dual screen
    channel.onmessage = (event) => {
      if (event.data.type === 'REQUEST_STATE') {
        // Send current state to dual screen
        channel.postMessage({
          type: 'QUEUE_UPDATE',
          queue: playlist,
          currentIndex: playlist.findIndex((v) => v.videoId === curVideoId),
          videoId: curVideoId,
        });
      }
    };

    return () => channel.close();
  }, [isMoniter, playlist, curVideoId]);

  // Sync current video to dual screen
  useEffect(() => {
    if (isMoniter || !curVideoId) return;

    const channel = new BroadcastChannel('youoke-dual-sync');
    channel.postMessage({
      type: 'PLAY',
      videoId: curVideoId,
    });
    channel.close();
  }, [curVideoId, isMoniter]);

  // Sync queue to dual screen
  useEffect(() => {
    if (isMoniter || !playlist || playlist.length === 0) return;

    const channel = new BroadcastChannel('youoke-dual-sync');
    channel.postMessage({
      type: 'QUEUE_UPDATE',
      queue: playlist,
      currentIndex: playlist.findIndex((v) => v.videoId === curVideoId),
    });
    channel.close();
  }, [playlist, isMoniter, curVideoId]);

  // Event handler for triggering fullscreen on a user gesture
  const handleFullscreenButtonClick = () => {
    if (!isIphone && !isFullscreen) {
      alertFullNotWorkRef?.current.open();
    }

    if (
      //@ts-ignore
      fullscreenRef.webkitEnterFullScreen ||
      //@ts-ignore
      fullscreenRef.webkitExitFullscreen
    ) {
      console.log(" Toggle fullscreen in Safari for iPad");
      // Toggle fullscreen in Safari for iPad
      if (!isFullscreen) {
        //@ts-ignore
        fullscreenRef.webkitEnterFullScreen();
        toggleFullscreen(true);
      } else {
        //@ts-ignore
        fullscreenRef.webkitExitFullscreen();
        toggleFullscreen(false);
      }
    } else if (isIphone) {
      setIsFullScreenIphone(!isFullScreenIphone);

      !isFullScreenIphone && alertRef?.current.open();
    } else {
      // Toggle fullscreen for other OS / Devices / Browsers
      console.log("Toggle fullscreen for other OS / Devices / Browsers");
      toggleFullscreen();
      setIsFullScreenIphone(!isFullScreenIphone);
    }
  };

  const handleMute = async () => {
    try {
      const player = playerRef.current?.getInternalPlayer();
      setIsMuted(true);
      if (!player) return;
      await player.mute();
    } catch (error) {
      console.log(error);
    }
  };
  const handleUnMute = async () => {
    try {
      const player = playerRef.current?.getInternalPlayer();
      setIsMuted(false);
      if (!player) return;
      await player.unMute();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlay = async () => {
    const debugInfo = {
      isGoogleCastConnected,
      castPlayExists: !!castPlay,
    };
    console.log('🎯 handlePlay called:', debugInfo);
    addDebugLog('🎯 handlePlay called', debugInfo);

    // If connected to Google Cast, send command to TV
    if (isGoogleCastConnected) {
      console.log('📤 Calling castPlay()...');
      addDebugLog('📤 Calling castPlay()');
      setPlayerState(YouTube.PlayerState.PLAYING);
      castPlay();
      return;
    }

    // Otherwise, control local player
    try {
      const player = playerRef.current?.getInternalPlayer();

      setPlayerState(YouTube.PlayerState.PLAYING);

      // Update Media Session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
        console.log('🎵 Media Session: Set playback state to PLAYING');
      }

      if (!player) return;
      await player?.playVideo();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePause = async () => {
    const debugInfo = {
      isGoogleCastConnected,
      castPauseExists: !!castPause,
    };
    console.log('🎯 handlePause called:', debugInfo);
    addDebugLog('🎯 handlePause called', debugInfo);

    // If connected to Google Cast, send command to TV
    if (isGoogleCastConnected) {
      console.log('📤 Calling castPause()...');
      addDebugLog('📤 Calling castPause()');
      setPlayerState(YouTube.PlayerState.PAUSED);
      castPause();
      return;
    }

    // Otherwise, control local player
    try {
      const player = playerRef.current?.getInternalPlayer();

      setPlayerState(YouTube.PlayerState.PAUSED);

      // Update Media Session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
        console.log('🎵 Media Session: Set playback state to PAUSED');
      }

      if (!player) return;
      await player.pauseVideo();
    } catch (error) {
      console.log(error);
    }
  };

  const handleReplay = async () => {
    // If connected to Google Cast, we need to restart the current video on TV
    if (isGoogleCastConnected) {
      // For Cast, we can't directly seek - need to reload the video
      // This is a limitation of the current Cast implementation
      // TODO: Implement SEEK command in Cast receiver
      console.log('⚠️ Replay not yet supported for Google Cast');
      addToast('ฟังก์ชันนี้ยังไม่รองรับสำหรับ Google Cast');
      return;
    }

    // Otherwise, control local player
    try {
      const player = playerRef.current?.getInternalPlayer();
      if (!player) return;
      await player.seekTo(0, true);
    } catch (error) {
      console.log(error);
    }
  };

  // Double-click detection
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  const handleVideoClick = () => {
    setClickCount(prev => prev + 1);

    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    const timer = setTimeout(() => {
      if (clickCount + 1 === 1) {
        // Single click - Play/Pause
        if (playerState === YouTube.PlayerState.PLAYING) {
          handlePause();
        } else {
          handlePlay();
        }
      } else if (clickCount + 1 >= 2) {
        // Double click - Fullscreen
        handleFullscreenButtonClick();
      }
      setClickCount(0);
    }, 250); // 250ms delay to detect double-click

    setClickTimer(timer);
  };

  useEffect(() => {
    // Firebase Cast handles playlist sync now
  }, [playlist]);

  // Auto-connect from QR Code scan
  useEffect(() => {
    const { castRoom } = router.query;

    if (castRoom && typeof castRoom === 'string' && castRoom.length === 4 && !isCasting) {
      console.log('🎬 Auto-connecting to Cast room from QR:', castRoom);
      setCastInputRoomCode(castRoom);
      setIsCastOverlayOpen(true);

      // Auto-join after a short delay (to show overlay)
      const timer = setTimeout(async () => {
        setIsJoiningRoom(true);
        try {
          const success = await joinRoom(castRoom);
          if (success) {
            setIsCastOverlayOpen(false);
            addToast('เชื่อมต่อจาก QR Code สำเร็จ! 🎉');
            // Remove castRoom from URL
            router.replace('/', undefined, { shallow: true });
          } else {
            setCastError('ไม่พบห้อง กรุณาตรวจสอบ QR Code อีกครั้ง');
          }
        } catch (err) {
          setCastError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        }
        setIsJoiningRoom(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [router.query, isCasting]);

  // Enhanced Auto-Resume when returning from background (Mobile fix + Queue support)
  useEffect(() => {
    // Skip only Monitor mode and Dual mode
    // Allow for both local and Cast modes
    if (isMoniter || isDualMode) {
      return;
    }

    let wasPlayingBeforeHidden = false;
    let lastKnownVideoId = videoId;
    const isCastMode = isGoogleCastConnected || isCasting;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // App going to background - remember state
        wasPlayingBeforeHidden = playerState === YouTube.PlayerState.PLAYING || playerState === YouTube.PlayerState.BUFFERING;
        lastKnownVideoId = videoId;
        console.log('📱 App going to background', {
          wasPlaying: wasPlayingBeforeHidden,
          videoId: lastKnownVideoId,
          mode: isCastMode ? 'Cast' : 'Local'
        });
      } else if (document.visibilityState === 'visible') {
        // App returning to foreground
        console.log('📱 App returning to foreground', {
          shouldResume: wasPlayingBeforeHidden,
          lastVideoId: lastKnownVideoId,
          currentVideoId: videoId,
          mode: isCastMode ? 'Cast' : 'Local'
        });

        // For Cast mode, just update Media Session state
        if (isCastMode) {
          if (wasPlayingBeforeHidden && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
            console.log('📱 Cast mode: Updated Media Session to playing');
          }
          return; // Cast receiver handles playback
        }

        // For local mode, aggressively resume playback
        // Retry multiple times to get player (it might not be ready immediately)
        const attemptResume = async (attemptNumber: number = 1): Promise<void> => {
          console.log(`📱 Resume attempt ${attemptNumber}/5...`);

          const player = playerRef.current?.getInternalPlayer();
          if (!player) {
            console.log(`📱 Attempt ${attemptNumber}: No player available yet`);
            if (attemptNumber < 5) {
              // Retry getting player
              setTimeout(() => attemptResume(attemptNumber + 1), 500);
            } else {
              console.log('📱 ❌ Failed to get player after 5 attempts');
            }
            return;
          }

          console.log(`📱 Attempt ${attemptNumber}: Player available ✓`);

          try {
            const state = await player.getPlayerState();
            console.log(`📱 Attempt ${attemptNumber}: Player state:`, state);

            // Check if video ended while in background
            if (state === YouTube.PlayerState.ENDED && playlist && playlist.length > 0) {
              console.log('📱 Video ended in background. Playing next...');
              if (nextSong) {
                nextSong();
              }
              return;
            }

            // Check if video changed while in background
            if (lastKnownVideoId !== videoId) {
              console.log('📱 Video changed in background');
              if (wasPlayingBeforeHidden && state !== YouTube.PlayerState.PLAYING) {
                console.log('📱 Resuming new video...');
                await player.playVideo();
                setPlayerState(YouTube.PlayerState.PLAYING);
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'playing';
                }
              }
              return;
            }

            // Resume if was playing before
            if (wasPlayingBeforeHidden && state !== YouTube.PlayerState.PLAYING && state !== YouTube.PlayerState.ENDED) {
              console.log('📱 Resuming playback...');
              await player.playVideo();
              setPlayerState(YouTube.PlayerState.PLAYING);
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }

              // Aggressive retry - verify 3 times
              for (let i = 1; i <= 3; i++) {
                setTimeout(async () => {
                  try {
                    const verifyPlayer = playerRef.current?.getInternalPlayer();
                    if (!verifyPlayer) {
                      console.log(`📱 Retry ${i}/3: Player not available`);
                      return;
                    }
                    const verifyState = await verifyPlayer.getPlayerState();
                    if (verifyState !== YouTube.PlayerState.PLAYING) {
                      console.log(`📱 Retry ${i}/3: Not playing (state: ${verifyState}), retrying...`);
                      await verifyPlayer.playVideo();
                      if ('mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'playing';
                      }
                    } else {
                      console.log(`📱 Retry ${i}/3: Playback confirmed ✓`);
                    }
                  } catch (err) {
                    console.log(`📱 Error retry ${i}:`, err);
                  }
                }, i * 1000);
              }
            } else {
              console.log('📱 No resume needed:', {
                wasPlayingBeforeHidden,
                currentState: state,
                stateNames: {
                  '-1': 'UNSTARTED',
                  '0': 'ENDED',
                  '1': 'PLAYING',
                  '2': 'PAUSED',
                  '3': 'BUFFERING',
                  '5': 'CUED'
                }
              });
            }
          } catch (error) {
            console.log(`📱 Error in resume attempt ${attemptNumber}:`, error);
            if (attemptNumber < 5) {
              setTimeout(() => attemptResume(attemptNumber + 1), 500);
            }
          }
        };

        // Start resume attempts after a short delay
        setTimeout(() => attemptResume(1), 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMoniter, isGoogleCastConnected, isCasting, isDualMode, videoId, playlist, nextSong, playerState]);

  // Media Session API - Native app controls (notification, lock screen)
  useEffect(() => {
    // Skip only if Monitor mode or Dual mode (display screens, not controllers)
    // Allow for both local playback AND Cast mode (to control TV from lock screen)
    if (isMoniter || isDualMode) {
      return;
    }

    // Check if Media Session API is supported
    if (!('mediaSession' in navigator)) {
      console.log('📱 Media Session API not supported');
      return;
    }

    const isCastMode = isGoogleCastConnected || isCasting;
    console.log('🎵 Setting up Media Session API handlers', isCastMode ? '(Cast mode - remote control)' : '(Local mode)');

    // Setup action handlers for notification/lock screen controls
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('🎵 Media Session: Play action');
        handlePlay(); // handlePlay already supports Cast
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('🎵 Media Session: Pause action');
        handlePause(); // handlePause already supports Cast
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('🎵 Media Session: Next track action');
        if (nextSong) {
          nextSong();
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('🎵 Media Session: Previous track action');
        // Find current video in playlist and go to previous
        if (playlist && playlist.length > 0 && curVideoId) {
          const currentIndex = playlist.findIndex(v => v.videoId === curVideoId);
          if (currentIndex > 0) {
            const previousVideo = playlist[currentIndex - 1];
            setCurVideoId(previousVideo.videoId);
          }
        }
      });

      // Seek handlers only for local playback (not supported in Cast mode)
      if (!isCastMode) {
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          console.log('🎵 Media Session: Seek backward action');
          const player = playerRef.current?.getInternalPlayer();
          if (player) {
            player.getCurrentTime().then((currentTime: number) => {
              const seekTime = Math.max(0, currentTime - (details.seekOffset || 10));
              player.seekTo(seekTime, true);
            }).catch((err: any) => console.log('Error seeking:', err));
          }
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          console.log('🎵 Media Session: Seek forward action');
          const player = playerRef.current?.getInternalPlayer();
          if (player) {
            player.getCurrentTime().then((currentTime: number) => {
              player.getDuration().then((duration: number) => {
                const seekTime = Math.min(duration, currentTime + (details.seekOffset || 10));
                player.seekTo(seekTime, true);
              }).catch((err: any) => console.log('Error getting duration:', err));
            }).catch((err: any) => console.log('Error seeking:', err));
          }
        });
      } else {
        // Remove seek handlers in Cast mode
        try {
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
        } catch (e) {
          // Ignore
        }
      }

      console.log('✅ Media Session API handlers registered', isCastMode ? '(remote control mode)' : '(with seek support)');
    } catch (error) {
      console.log('⚠️ Error setting up Media Session API:', error);
    }

    return () => {
      // Cleanup handlers
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [isMoniter, isGoogleCastConnected, isCasting, isDualMode, nextSong, playlist, curVideoId]);

  // Update Media Session metadata when video changes
  useEffect(() => {
    // Skip only if Monitor mode or Dual mode
    // Show metadata for both local and Cast modes
    if (isMoniter || isDualMode) {
      return;
    }

    // Check if Media Session API is supported
    if (!('mediaSession' in navigator) || !videoId) {
      return;
    }

    try {
      // Find current video info from playlist
      const currentVideo = playlist?.find(v => v.videoId === videoId);
      const title = currentVideo?.title || 'Unknown Track';
      const artist = currentVideo?.author || 'Unknown Artist';

      const isCastMode = isGoogleCastConnected || isCasting;
      console.log('🎵 Updating Media Session metadata:', { title, artist, mode: isCastMode ? 'Cast' : 'Local' });

      // Update notification metadata with video thumbnails (different sizes for different screens)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist,
        album: isCastMode ? '📺 YouOke Karaoke (Casting)' : '🎤 YouOke Karaoke',
        artwork: [
          // Small - for notifications
          { src: `https://i.ytimg.com/vi/${videoId}/default.jpg`, sizes: '120x90', type: 'image/jpeg' },
          // Medium - for lock screen
          { src: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
          // High - for tablets
          { src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
          // SD - for larger screens
          { src: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`, sizes: '640x480', type: 'image/jpeg' },
          // Max resolution - for Cast/TV
          { src: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' },
        ],
      });

      console.log('✅ Media Session metadata updated');
    } catch (error) {
      console.log('⚠️ Error updating Media Session metadata:', error);
    }
  }, [videoId, playlist, isMoniter, isGoogleCastConnected, isCasting, isDualMode]);

  // Update Media Session position state (required for Android lock screen)
  useEffect(() => {
    // Skip if Monitor mode or Cast mode
    if (isMoniter || isGoogleCastConnected || isCasting || isDualMode) {
      return;
    }

    // Check if Media Session API is supported
    if (!('mediaSession' in navigator) || !videoId) {
      return;
    }

    // Update position state every second when playing
    let intervalId: NodeJS.Timeout | null = null;

    const updatePositionState = async () => {
      try {
        const player = playerRef.current?.getInternalPlayer();
        if (!player) return;

        const [currentTime, duration] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ]);

        if ('setPositionState' in navigator.mediaSession) {
          navigator.mediaSession.setPositionState({
            duration: duration || 0,
            playbackRate: 1.0,
            position: currentTime || 0,
          });
          console.log('🎵 Position updated:', { position: currentTime, duration });
        }
      } catch (error) {
        // Ignore position update errors
      }
    };

    // Update immediately
    updatePositionState();

    // Update every second if playing
    if (playerState === YouTube.PlayerState.PLAYING) {
      intervalId = setInterval(updatePositionState, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [videoId, playerState, isMoniter, isGoogleCastConnected, isCasting, isDualMode]);

  const playPauseBtn = [
    playerState === YouTube.PlayerState.PLAYING
      ? {
          icon: PauseIcon,
          label: "หยุด",
          onClick: handlePause,
        }
      : {
          icon: PlayIcon,
          label: "เล่น",
          onClick: handlePlay,
        },
  ];

  const muteBtn = useMemo(
    () => [
      !isMuted
        ? {
            icon: SpeakerWaveIcon,
            label: "ปิดเสียง",
            onClick: handleMute,
          }
        : {
            icon: SpeakerXMarkIcon,
            label: "เปิดเสียง",
            onClick: handleUnMute,
          },
    ],
    [isMuted]
  );

  // Cast icon component - same color always
  const CastIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    </svg>
  );

  const castBtn = useMemo(() => {
    // Always show single Cast button - same color always
    return [
      {
        icon: CastIcon,
        label: isGoogleCastConnected ? "Casting" : "Cast",
        onClick: async () => {
          // If connected, do nothing (user must use disconnect button in video area)
          // If not connected, open Cast selector
          if (!isGoogleCastConnected) {
            setShowCastModeSelector(true);
          }
        },
      },
    ];
  }, [isGoogleCastConnected]);

  const fullBtn = useMemo(
    () => [
      (isIphone ? !isFullScreenIphone : !isFullscreen)
        ? {
            icon: ArrowsPointingOutIcon,
            label: "เต็มจอ",
            onClick: async () => {
              handleFullscreenButtonClick();
            },
          }
        : {
            icon: ArrowsPointingInIcon,
            label: "จอเล็ก",
            onClick: async () => {
              handleFullscreenButtonClick();
            },
          },
    ],
    [isFullscreen, isFullScreenIphone, isIphone]
  );

  const playerBtns: any = useMemo(
    () => [
      {
        icon: ForwardIcon,
        label: "เพลงถัดไป",
        onClick: () => {
          const debugInfo = {
            isGoogleCastConnected,
            castNextExists: !!castNext,
          };
          console.log('🎯 Next button clicked:', debugInfo);
          addDebugLog('🎯 Next button clicked', debugInfo);

          if (isGoogleCastConnected) {
            console.log('📤 Calling castNext()...');
            addDebugLog('📤 Calling castNext()');
            castNext();
          } else {
            nextSong();
          }
        },
      },
      {
        icon: ArrowUturnLeftIcon,
        label: "ร้องซ้ำ",
        onClick: handleReplay,
      },
    ],
    [nextSong, playlist, isGoogleCastConnected, castNext]
  );

  const handleCastJoinRoom = async () => {
    if (!castInputRoomCode || castInputRoomCode.length !== 4) {
      setCastError('กรุณากรอกเลขห้อง 4 หลัก');
      return;
    }

    setIsJoiningRoom(true);
    setCastError('');

    try {
      const success = await joinRoom(castInputRoomCode);
      if (success) {
        setIsCastOverlayOpen(false);
        setCastInputRoomCode('');
        addToast('เชื่อมต่อสำเร็จ! 🎉');
      } else {
        setCastError('ไม่พบห้อง กรุณาตรวจสอบเลขห้องอีกครั้ง');
      }
    } catch (err) {
      setCastError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }

    setIsJoiningRoom(false);
  };

  const handleCastDisconnect = () => {
    leaveRoom();
    addToast('ตัดการเชื่อมต่อแล้ว');
  };

  const CastOverlayComponent = () => {
    return (
      isLogin &&
      !isMoniter && (
        <div
          className={`${
            isCastOverlayOpen
              ? "w-full aspect-video top-0 right-0"
              : "w-16 h-16 top-5 right-5 drop-shadow-md rounded-full"
          } ${isCasting ? "bg-success" : "bg-primary"} text-white z-2 left-auto
    flex items-center justify-center transition-all duration-50 ${
            !isCastOverlayOpen && playerState === PlayerStates.PLAYING ? "opacity-0" : ""
          }`}
          style={{
            zIndex: 2,
            position: "absolute",
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Overlay Content */}
            {isCastOverlayOpen && (
              <div className="absolute inset-0 flex items-center justify-center text-xl p-4">
                {isMobile ? (
                  <div className="text-sm flex space-y-3 flex-col text-center w-full max-w-md">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold">
                      <TvIcon className="w-5 h-5" />
                      <span>Cast to TV</span>
                    </div>
                    <div className="text-xs">
                      <p className="mb-2">วิธีใช้งาน:</p>
                      <ol className="list-decimal list-inside text-left space-y-1">
                        <li>เปิด <span className="font-bold">youoke.vercel.app/monitor</span> บนทีวี</li>
                        <li>ดูเลขห้อง 4 หลักที่แสดงบนทีวี</li>
                        <li>กรอกเลขห้องด้านล่าง แล้วกดเข้าร่วม</li>
                      </ol>
                    </div>

                    {!isCasting ? (
                      <div className="relative mt-4">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="py-3 px-4 block w-full text-black bg-white rounded-lg text-center text-2xl tracking-widest font-bold"
                          placeholder="0000"
                          maxLength={4}
                          value={castInputRoomCode}
                          onChange={(e) => setCastInputRoomCode(e.target.value.replace(/\D/g, ''))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCastJoinRoom();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          className="mt-2 w-full py-2 px-3 text-white rounded-lg bg-success font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                          onClick={handleCastJoinRoom}
                          disabled={isJoiningRoom || castInputRoomCode.length !== 4}
                        >
                          {isJoiningRoom ? (
                            <>
                              <ClockIcon className="w-4 h-4 animate-spin" />
                              <span>กำลังเข้าร่วม...</span>
                            </>
                          ) : (
                            <>
                              <RocketLaunchIcon className="w-4 h-4" />
                              <span>เข้าร่วมห้อง</span>
                            </>
                          )}
                        </button>
                        {castError && (
                          <div className="mt-2 text-xs text-error bg-white/20 rounded px-2 py-1.5">
                            {castError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 w-full">
                        <div className="flex items-center justify-center gap-2 text-base mb-3">
                          <CheckCircleIcon className="w-5 h-5 text-success" />
                          <span>เชื่อมต่อแล้ว</span>
                        </div>
                        <div className="text-xl font-bold mb-4">ห้อง: {roomCode}</div>

                        {/* Player Controls */}
                        <div className="mb-4">
                          <PlayerControls
                            isPlaying={firebaseCastState.controls.isPlaying}
                            onPlay={firebaseCastPlay}
                            onPause={firebaseCastPause}
                            onNext={firebaseCastNext}
                            className="justify-center"
                          />
                        </div>

                        <button
                          className="w-full py-2 px-3 text-white rounded-lg bg-error font-semibold flex items-center justify-center gap-2"
                          onClick={handleCastDisconnect}
                        >
                          <XMarkIcon className="w-4 h-4" />
                          <span>ตัดการเชื่อมต่อ</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop version
                  <div className="flex flex-col items-center justify-center text-center">
                    {!isCasting ? (
                      <>
                        <div className="mb-4">
                          <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-2">
                            <TvIcon className="w-6 h-6" />
                            <span>Cast to TV</span>
                          </div>
                          <div className="text-sm mb-4">
                            เปิด <span className="font-bold">youoke.vercel.app/monitor</span><br />
                            บนทีวี แล้วกรอกเลขห้อง
                          </div>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="py-3 px-6 text-black bg-white rounded-lg text-center text-3xl tracking-widest font-bold mb-3"
                          placeholder="0000"
                          maxLength={4}
                          value={castInputRoomCode}
                          onChange={(e) => setCastInputRoomCode(e.target.value.replace(/\D/g, ''))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCastJoinRoom();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          className="py-2 px-6 text-white rounded-lg bg-success font-semibold disabled:opacity-50 flex items-center gap-2"
                          onClick={handleCastJoinRoom}
                          disabled={isJoiningRoom || castInputRoomCode.length !== 4}
                        >
                          {isJoiningRoom ? (
                            <>
                              <ClockIcon className="w-5 h-5 animate-spin" />
                              <span>กำลังเข้าร่วม...</span>
                            </>
                          ) : (
                            <>
                              <RocketLaunchIcon className="w-5 h-5" />
                              <span>เข้าร่วมห้อง</span>
                            </>
                          )}
                        </button>
                        {castError && (
                          <div className="mt-2 text-sm text-error bg-white/20 rounded px-3 py-1">
                            {castError}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-2xl mb-4">
                          <CheckCircleIcon className="w-7 h-7 text-success" />
                          <span>เชื่อมต่อแล้ว</span>
                        </div>
                        <div className="text-4xl font-bold mb-6">ห้อง: {roomCode}</div>

                        {/* Player Controls */}
                        <div className="mb-6 w-full max-w-md">
                          <PlayerControls
                            isPlaying={firebaseCastState.controls.isPlaying}
                            onPlay={firebaseCastPlay}
                            onPause={firebaseCastPause}
                            onNext={firebaseCastNext}
                            className="justify-center"
                          />
                        </div>

                        <button
                          className="py-2 px-6 text-white rounded-lg bg-error font-semibold flex items-center gap-2"
                          onClick={handleCastDisconnect}
                        >
                          <XMarkIcon className="w-5 h-5" />
                          <span>ตัดการเชื่อมต่อ</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Toggle Button */}
            <div
              className={`cursor-pointer ${
                isCastOverlayOpen ? "absolute top-5 right-5" : "w-16 h-16"
              } flex flex-col items-center justify-center text-center`}
              onClick={() => {
                setIsCastOverlayOpen(!isCastOverlayOpen);
                if (!isCastOverlayOpen) {
                  handlePause();
                  setCastError('');
                  setCastInputRoomCode('');
                }
              }}
            >
              <TvIcon
                className={`w-8 h-8 ${isCastOverlayOpen ? "opacity-0 hidden" : ""}`}
              />
              <div
                className={`text-xs ${
                  isCastOverlayOpen ? "bg-white text-primary px-2 py-0.5 rounded" : ""
                }`}
              >
                {isCastOverlayOpen ? "ปิด" : ""} Cast
              </div>
            </div>
          </div>
        </div>
      )
    );
  };

  // Old RemoteComponent removed - replaced by unified Cast button in control bar

  const buttons: any = !isMoniter
    ? [...playPauseBtn, ...playerBtns, ...muteBtn, ...fullBtn, ...castBtn]
    : [
        ...fullBtn,
        {
          icon: ArrowPathIcon,
          label: "โหลดใหม่",
          onClick: async () => {
            window.location.reload();
          },
        },
      ];

  return (
    <div
      ref={fullscreenRef}
      id="youtubePlayer"
      className={`${isFullscreen ? "bg-black" : "bg-white"} ${className}`}
    >
      <Alert
        ref={alertRef}
        timer={2000}
        headline="เต็มจอ"
        headlineColor="text-green-600"
        bgColor="bg-green-100"
        content={<span className="text-sm">กดเล่นเพื่อเต็มจอ</span>}
        icon={<PlayIcon />}
      />
      <span className={`${isIOS && !isIphone ? "" : "hidden"}`}>
        <Alert
          ref={alertFullNotWorkRef}
          timer={3000}
          headline="หากไม่เต็มจอ"
          headlineColor="text-green-600"
          bgColor="bg-green-100"
          content={
            <button
              className="text-sm btn btn-ghost"
              onClick={async () => {
                setIsFullScreenIphone(false);
                toggleFullscreen(false);
                setIsIphone(true);
                await handlePause();
              }}
            >
              กดที่นี่แล้วลองอีกครั้ง
            </button>
          }
          icon={<ExclamationTriangleIcon />}
        />
      </span>
      {/* Web Monitor Cast - Hidden for Home Use (will be used for Karaoke Shop) */}
      {/* {CastOverlayComponent()} */}

      {/* Cast Mode Selector Modal */}
      <CastModeSelector
        isOpen={showCastModeSelector}
        onClose={() => setShowCastModeSelector(false)}
        isCastAvailable={isCastAvailable}
        isMobile={isMobile}
        onSelectWebMonitor={() => {
          setShowCastModeSelector(false);
          setIsCastOverlayOpen(true);
        }}
        onSelectDual={() => {
          setShowCastModeSelector(false);
          // Set dual mode active
          localStorage.setItem('youoke-dual-active', 'true');
          setIsDualMode(true);
          // Open dual screen
          window.open('/dual', '_blank');
          // Pause video on main screen
          handlePause();
        }}
        onSelectGoogleCast={() => {
          setShowCastModeSelector(false);
          if (playlist.length === 0) {
            addToast('กรุณาเพิ่มเพลงลงคิวก่อน');
            return;
          }
          // Connect to Chromecast with playlist
          console.log('📡 Google Cast: Connecting to Chromecast with', playlist.length, 'videos');
          connectGoogleCast(playlist);
        }}
        onSelectYouTube={() => {
          setShowCastModeSelector(false);
          if (playlist.length === 0) {
            addToast('กรุณาเพิ่มเพลงลงคิวก่อน');
            return;
          }
          const videoIds = playlist.map((v) => v.videoId).join(',');
          const youtubeURL = `https://www.youtube.com/watch_videos?video_ids=${videoIds}`;
          window.open(youtubeURL, '_blank');
        }}
      />

      {isMoniter && !isOpenMonitor && (
        <div
          className={` w-full aspect-video   bg-primary text-white  z-2 left-auto
          flex items-center justify-center  transition-all duration-50  `}
          style={{
            zIndex: 2,
            position: "absolute",
          }}
        >
          <div className="relative">
            <div
              className="cursor-pointer  absolute inset-0 flex items-center justify-center  text-xl"
              onClick={() => {
                setIsOpenMonitor(true);
                handlePlay();
              }}
            >
              กดเพื่อเปิดหน้าจอ
            </div>
          </div>
        </div>
      )}
      <div
        className="w-full aspect-video relative flex-1 md:flex-grow-1"
        onClick={() => handleVideoClick()}
      >
        {isGoogleCastConnected && !isMoniter ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-accent/20 to-primary/20 backdrop-blur-sm p-4">
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg w-full max-w-sm">
              <div className="text-4xl mb-2">📡</div>
              <h2 className="text-lg font-bold mb-1 text-gray-800">กำลัง Cast ไป</h2>
              <p className="text-sm font-semibold text-primary mb-2 truncate">
                {receiverName || 'Chromecast'}
              </p>
              <p className="text-xs text-gray-600 mb-3">
                วิดีโอกำลังเล่นบนทีวี - ใช้ปุ่มด้านล่างเพื่อควบคุม
              </p>
              <button
                onClick={(e) => {
                  const debugInfo = {
                    isGoogleCastConnected,
                    disconnectExists: !!disconnectGoogleCast,
                  };
                  console.log('🎯 Disconnect button clicked!', debugInfo);
                  addDebugLog('🎯 Disconnect button clicked', debugInfo);
                  e.stopPropagation(); // Prevent fullscreen trigger
                  disconnectGoogleCast();
                  console.log('📡 Disconnecting from Google Cast...');
                  addDebugLog('📡 Disconnecting from Google Cast');
                  addToast('ตัดการเชื่อมต่อ Google Cast แล้ว');
                }}
                className="btn btn-sm btn-error gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                ปิด Cast
              </button>
            </div>
          </div>
        ) : isDualMode && !isMoniter ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
            <div className="text-center p-8 bg-base-100/90 rounded-xl shadow-2xl">
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-3xl font-bold mb-2 text-primary">กำลังเล่นที่หน้าจอที่ 2</h2>
              <p className="text-gray-600 mb-4">วิดีโอกำลังเล่นบนหน้าจอ Dual Screen</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.removeItem('youoke-dual-active');
                  setIsDualMode(false);
                }}
                className="btn btn-sm btn-primary"
              >
                ปิดโหมด 2 หน้าจอ
              </button>
            </div>
          </div>
        ) : !videoId ? (
          <div
            className="h-full w-full flex items-center justify-center bg-black"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Image
              src="/assets/icons/icon.svg"
              width={48}
              height={48}
              className=""
              alt="KaraTube's Logo"
            />
          </div>
        ) : (
          <YouTube
            ref={playerRef}
            videoId={videoId}
            className={`w-full bg-black ${
              !isFullscreen
                ? "aspect-video cursor-zoom-in"
                : "h-[calc(100dvh)] cursor-zoom-out"
            } `}
            iframeClassName={`w-full h-[calc(100dvh)] pointer-events-none`}
            style={{
              width: "100%",
              height: "100%",
              position: UseFullScreenCss ? "fixed" : "absolute",
              zIndex: UseFullScreenCss ? 20 : 0,
            }}
            loading="lazy"
            opts={{
              playerVars: {
                autoplay:
                  isMoniter && playerState === PlayerStates.PAUSED ? 0 : 1,
                controls: 0,
                disablekb: 1,
                enablejsapi: 1,
                modestbranding: 1,
                playsinline: isIphone && isFullScreenIphone ? 0 : 1,
              },
            }}
            onStateChange={(ev) => {
              updatePlayerState(ev.target);
            }}
            onEnd={() => {
              nextSong();
            }}
          />
        )}
      </div>

      {!isLogin && !isMoniter && <BottomAds />}
      {!isLogin && !isMoniter && isShowAds && <VideoAds />}

      <div
        className={`flex-shrink-0 flex flex-row md:w-full p-1 items-center z-20 ${
          isMouseMoving ? "hover:opacity-100" : ""
        } ${
          (UseFullScreenCss || !isMouseMoving) &&
          (isFullscreen || isFullScreenIphone)
            ? "opacity-0"
            : ""
        }`}
        style={
          UseFullScreenCss || isMoniter
            ? {
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                background: isMoniter ? "white" : "initial",
              }
            : {}
        }
      >
        {buttons.map((btn) => {
          return (
            <button
              key={btn.label}
              className="btn btn-ghost font-normal text-primary flex h-auto flex-col flex-1 overflow-hidden text-xs 2xl:text-sm p-1 gap-1 hover:bg-base-200"
              onClick={btn.onClick}
            >
              <btn.icon className="w-6 h-6 2xl:w-8 2xl:h-8" />
              {btn.label}
            </button>
          );
        })}
        {extra}
      </div>

      {/* Debug Overlay */}
      <DebugOverlay
        isVisible={isDebugOverlayOpen}
        onClose={() => setIsDebugOverlayOpen(false)}
      />

      {/* Debug Toggle Button - Float at top right */}
      {!isMoniter && (
        <button
          onClick={() => {
            setIsDebugOverlayOpen(true);
            addDebugLog('🐛 Debug overlay opened', {
              isGoogleCastConnected,
              receiverName,
              isCasting,
            });
          }}
          className="fixed top-4 right-4 z-[99999] btn btn-circle btn-error shadow-2xl text-2xl animate-pulse"
          title="เปิด Debug Console"
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid white',
          }}
        >
          🐛
        </button>
      )}
    </div>
  );
}

export default YoutubePlayer;
