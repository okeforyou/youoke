import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";
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
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import { useCast } from "../context/CastContext";
import { useFirebaseCast } from "../context/FirebaseCastContext";
import { useToast } from "../context/ToastContext";
import useIsMobile from "../hooks/isMobile";
import { useKaraokeState } from "../hooks/karaoke";
import { useRoomState } from "../hooks/room";
import { useGuestLimit } from "../hooks/useGuestLimit";
import Alert, { AlertHandler } from "./Alert";
import BottomAds from "./BottomAds";
import { CastModeSelector } from "./CastModeSelector";
import { ShareRoomModal } from "./ShareRoomModal";
import VideoAds from "./VideoAds";
import DebugOverlay, { addDebugLog } from "./DebugOverlay";
import PlayerControls from "./PlayerControls";
import GuestLimitModal from "./GuestLimitModal";

function YoutubePlayer({
  videoId,
  nextSong,
  className = "",
  extra = null,
  isMoniter = false,
  externalPlayerRef = null, // Optional external ref for parent control
  showControls = true,
  controlRef = null,
}) {
  const router = useRouter();
  const internalPlayerRef = useRef<YouTube>();

  // Expose methods to parent
  useImperativeHandle(controlRef, () => ({
    openCastSelector: () => {
      setShowCastModeSelector(true);
    },
    // Add other methods if needed
  }));
  const playerRef = externalPlayerRef || internalPlayerRef;
  const fullscreenRef = useRef<HTMLDivElement>();
  const [show, toggleFullscreen] = useToggle(false);
  const isFullscreen = useFullscreen(fullscreenRef, show, {
    onClose: () => toggleFullscreen(false),
  });
  const [playerState, setPlayerState] = useState<number>();
  const { user } = useAuth();
  const isLogin = !!user.uid;

  // Guest Limit (3 songs per day for non-logged-in users)
  const {
    canPlayNext,
    incrementPlayCount,
    isLimitReached,
    remainingPlays,
    playedCount,
    guestLimit,
  } = useGuestLimit();
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const {
    isConnected: isCasting,
    roomCode,
    userInfo,
    joinRoom,
    leaveRoom,
    play: firebaseCastPlay,
    pause: firebaseCastPause,
    next: firebaseCastNext,
    toggleMute: firebaseCastToggleMute,
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
  const [guestName, setGuestName] = useState<string>(''); // For non-logged-in users
  const [castError, setCastError] = useState<string>('');
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [isDebugOverlayOpen, setIsDebugOverlayOpen] = useState<boolean>(false);
  const [isShareRoomModalOpen, setIsShareRoomModalOpen] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const wakeLockRef = useRef<any>(null); // Screen Wake Lock reference

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

  // Detect base URL for dynamic domain support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Screen Wake Lock - Prevent screen from sleeping when casting (Remote only)
  useEffect(() => {
    // Only apply wake lock for Remote (not Monitor)
    if (isMoniter) return;

    const requestWakeLock = async () => {
      // Only request wake lock when casting
      if (!isCasting) {
        // Release wake lock if not casting
        if (wakeLockRef.current) {
          try {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            console.log('📱 Screen wake lock released');
          } catch (err) {
            console.warn('⚠️ Failed to release wake lock:', err);
          }
        }
        return;
      }

      // Check if Wake Lock API is supported
      if (!('wakeLock' in navigator)) {
        console.warn('⚠️ Screen Wake Lock API not supported');
        return;
      }

      try {
        // Request screen wake lock
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('✅ Screen wake lock activated - screen will not sleep during cast');

        // Listen for wake lock release (e.g., when tab becomes hidden)
        wakeLockRef.current.addEventListener('release', () => {
          console.log('📱 Screen wake lock was released');
        });
      } catch (err) {
        console.warn('⚠️ Failed to request wake lock:', err);
      }
    };

    requestWakeLock();

    // Re-request wake lock when visibility changes (e.g., returning to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isCasting && !wakeLockRef.current) {
        console.log('📱 Tab visible again, re-requesting wake lock...');
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch((err: any) => {
          console.warn('⚠️ Failed to release wake lock on cleanup:', err);
        });
      }
    };
  }, [isCasting, isMoniter]);

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

  // Auto-mute main player when Dual Mode is active to prevent double audio
  useEffect(() => {
    if (isDualMode && !isMoniter) {
      console.log('🔇 Dual Mode Active: Muting main player');
      handleMute();
    }
  }, [isDualMode, isMoniter]);

  const isIOS =
    /iPad|iPhone/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);

  const UseFullScreenCss = isFullscreen || isFullScreenIphone;

  async function updatePlayerState(player: YouTubePlayer) {
    if (!player) return;
    const [muteState, playerState] = await mounted(
      Promise.allSettled([player.isMuted(), player.getPlayerState()])
    );

    // These lines will not execute if this component gets unmounted.
    if (muteState.status === "fulfilled") setIsMuted(muteState.value);
    if (playerState.status === "fulfilled") {
      const newState = playerState.value;
      setPlayerState(newState);

      // Guest Limit Check: When starting to play a new song
      if (newState === YouTube.PlayerState.PLAYING) {
        if (isDualMode && !isMoniter) {
          player.mute();
        }
      }

      if (newState === YouTube.PlayerState.PLAYING && !isLogin) {
        if (!canPlayNext()) {
          // Guest has reached limit - pause and show modal
          console.log(`🚫 Guest limit reached (${playedCount}/${guestLimit})`);
          player.pauseVideo();
          setShowGuestLimitModal(true);
          return;
        } else {
          // Guest can still play - increment count
          console.log(`✅ Guest playing song ${playedCount + 1}/${guestLimit}`);
          incrementPlayCount();
        }
      }

      // Update Media Session playback state for Android lock screen
      // Allow for both local and Cast modes (skip only Monitor/Dual modes)
      if ('mediaSession' in navigator && !isMoniter && !isDualMode) {
        switch (newState) {
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



  useEffect(() => {
    // Play Now - explicitly play when video ID changes
    // Add a small delay to ensure player is ready
    if (!!curVideoId) {
      setTimeout(() => {
        handlePlay();
      }, 500);
    }
  }, [curVideoId]);



  useEffect(() => {
    if (!isLogin && videoCount % 1 == 0 && videoCount !== 0) {
      handlePause();
      setIsShowAds(false);
      setTimeout(() => setIsShowAds(true), 200);
    }
  }, [videoCount]);

  // BroadcastChannel for Dual Screen sync (Bidirectional)
  useEffect(() => {
    if (isMoniter) return; // Only main screen sends updates

    const channel = new BroadcastChannel('youoke-dual-sync');

    // Listen for commands from dual screen
    channel.onmessage = async (event) => {
      const { type } = event.data;
      console.log('📨 YoutubePlayer received command:', type);

      const player = playerRef.current?.getInternalPlayer();

      switch (type) {
        case 'REQUEST_STATE':
          // Send current state to dual screen
          channel.postMessage({
            type: 'QUEUE_UPDATE',
            queue: playlist,
            currentIndex: playlist.findIndex((v) => v.videoId === curVideoId),
            videoId: curVideoId,
            isPlaying: playerState === YouTube.PlayerState.PLAYING,
            isMuted: isMuted
          });
          break;
        case 'PLAY':
          try {
            if (player) await player.playVideo();
          } catch (e) { console.error('Error in PLAY command', e); }
          break;
        case 'PAUSE':
          try {
            if (player) await player.pauseVideo();
          } catch (e) { console.error('Error in PAUSE command', e); }
          break;
        case 'NEXT':
          if (nextSong) nextSong();
          break;
        case 'PREV':
          // logic for prev if needed
          break;
        case 'MUTE':
          try {
            if (player) await player.mute();
          } catch (e) { console.error('Error in MUTE command', e); }
          break;
        case 'UNMUTE':
          try {
            if (player) await player.unMute();
          } catch (e) { console.error('Error in UNMUTE command', e); }
          break;
      }
    };

    return () => channel.close();
  }, [isMoniter, playlist, curVideoId, playerState, isMuted, nextSong]);

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
      videoId: curVideoId,
    });
    channel.close();
  }, [playlist, isMoniter, curVideoId]);

  // Event handler for triggering fullscreen on a user gesture
  const handleFullscreenButtonClick = () => {
    // Mobile or iOS or Android: Use CSS Fullscreen Overlay (Robust)
    if (isMobile || isIOS || isAndroid) {
      setIsFullScreenIphone(!isFullScreenIphone);
      return;
    }
    // Desktop: Standard API
    toggleFullscreen();
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
    // Block unmute in Dual Control Mode
    if (isDualMode && !isMoniter) {
      console.log('🔇 Audio locked in Dual Mode');
      addToast('เสียงกำลังออกที่หน้าจอ 2');
      return;
    }

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
      isCasting,
      isGoogleCastConnected,
      castPlayExists: !!castPlay,
    };
    console.log('🎯 handlePlay called:', debugInfo);
    addDebugLog('🎯 handlePlay called', debugInfo);

    // If connected to Firebase Cast, send command to Monitor
    if (isCasting) {
      console.log('📤 Calling firebaseCastPlay()...');
      addDebugLog('📤 Calling firebaseCastPlay()');
      firebaseCastPlay();
      return;
    }

    if (isGoogleCastConnected) {
      console.log('📤 Calling castPlay()...');
      addDebugLog('📤 Calling castPlay()');
      setPlayerState(YouTube.PlayerState.PLAYING);
      castPlay();
      return;
    }

    // If Dual Mode is active, send command to Monitor
    if (isDualMode && !isMoniter) {
      console.log('📤 Broadcasting PLAY command to Dual Screen');
      const ch = new BroadcastChannel('youoke-dual-sync');
      ch.postMessage({ type: 'PLAY', videoId: curVideoId });
      ch.close();
      // Also play local player (muted/hidden) to keep state in sync
      setPlayerState(YouTube.PlayerState.PLAYING);
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
      isCasting,
      isGoogleCastConnected,
      castPauseExists: !!castPause,
    };
    console.log('🎯 handlePause called:', debugInfo);
    addDebugLog('🎯 handlePause called', debugInfo);

    // If connected to Firebase Cast, send command to Monitor
    if (isCasting) {
      console.log('📤 Calling firebaseCastPause()...');
      addDebugLog('📤 Calling firebaseCastPause()');
      firebaseCastPause();
      return;
    }

    if (isGoogleCastConnected) {
      console.log('📤 Calling castPause()...');
      addDebugLog('📤 Calling castPause()');
      setPlayerState(YouTube.PlayerState.PAUSED);
      castPause();
      return;
    }

    // If Dual Mode is active, send command to Monitor
    if (isDualMode && !isMoniter) {
      console.log('📤 Broadcasting PAUSE command to Dual Screen');
      const ch = new BroadcastChannel('youoke-dual-sync');
      ch.postMessage({ type: 'PAUSE', videoId: curVideoId });
      ch.close();
      // Also pause local player to keep state in sync
      setPlayerState(YouTube.PlayerState.PAUSED);
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
    // Wait for router to be ready (important for iOS)
    if (!router.isReady) {
      console.log('⏳ Router not ready yet, waiting...');
      return;
    }

    const { castRoom } = router.query;

    console.log('🔍 Checking castRoom parameter:', {
      castRoom,
      isCasting,
      isMoniter,
      routerQuery: router.query,
    });

    if (castRoom && typeof castRoom === 'string' && !isCasting && !isMoniter) {
      console.log('🎬 Opening Cast overlay from share link:', castRoom);
      setCastInputRoomCode(castRoom);
      setIsCastOverlayOpen(true);

      // Remove castRoom from URL to clean up (delay to ensure overlay opens first)
      setTimeout(() => {
        router.replace('/', undefined, { shallow: true });
      }, 300);

      // Don't auto-join - let user enter guest name if not logged in
      // User will click "เข้าร่วมห้อง" button to join
    }
  }, [router.isReady, router.query.castRoom, isCasting, isMoniter]);

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
    playerState === YouTube.PlayerState.PLAYING || (isCasting && firebaseCastState.controls.isPlaying)
      ? {
        icon: PauseIcon,
        label: "หยุด",
        onClick: () => {
          console.log('🎯 Pause button clicked:', { isCasting, isGoogleCastConnected });
          if (isCasting) {
            firebaseCastPause();
          } else if (isGoogleCastConnected) {
            castPause();
          } else {
            handlePause();
          }
        },
      }
      : {
        icon: PlayIcon,
        label: "เล่น",
        onClick: () => {
          console.log('🎯 Play button clicked:', { isCasting, isGoogleCastConnected });
          if (isCasting) {
            firebaseCastPlay();
          } else if (isGoogleCastConnected) {
            castPlay();
          } else {
            handlePlay();
          }
        },
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
    [isMuted, isDualMode]
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
            isCasting,
            isGoogleCastConnected,
            firebaseCastNextExists: !!firebaseCastNext,
            castNextExists: !!castNext,
          };
          console.log('🎯 Next button clicked:', debugInfo);
          addDebugLog('🎯 Next button clicked', debugInfo);

          if (isCasting) {
            console.log('📤 Calling firebaseCastNext()...');
            addDebugLog('📤 Calling firebaseCastNext()');
            firebaseCastNext();
          } else if (isGoogleCastConnected) {
            console.log('📤 Calling castNext()...');
            addDebugLog('📤 Calling castNext()');
            castNext();
          } else {
            if (isDualMode && !isMoniter) {
              const ch = new BroadcastChannel('youoke-dual-sync');
              ch.postMessage({ type: 'NEXT' });
              ch.close();
            }
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
    [nextSong, playlist, isCasting, isGoogleCastConnected, firebaseCastNext, castNext, isDualMode]
  );

  const handleCastJoinRoom = async () => {
    if (!castInputRoomCode || castInputRoomCode.length !== 4) {
      setCastError('กรุณากรอกเลขห้อง 4 หลัก');
      return;
    }

    // Check guest name if not logged in
    if (!isLogin && (!guestName || guestName.trim().length === 0)) {
      setCastError('กรุณากรอกชื่อของคุณ');
      return;
    }

    setIsJoiningRoom(true);
    setCastError('');

    try {
      // Pass guestName if not logged in
      const options = !isLogin ? { guestName: guestName.trim() } : undefined;
      const success = await joinRoom(castInputRoomCode, options);
      if (success) {
        setIsCastOverlayOpen(false);
        setCastInputRoomCode('');
        setGuestName('');
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
    // Don't show overlay at all when already casting (user sees "กำลัง Cast ไป Monitor" screen instead)
    if (isCasting || !isCastOverlayOpen) return null;

    // Don't show on Monitor page
    if (isMoniter) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-base-100 rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-5 relative my-auto max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={() => {
              setIsCastOverlayOpen(false);
              setCastError('');
              setCastInputRoomCode('');
              setGuestName('');
            }}
            className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost z-10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="space-y-4">
            {/* Title */}
            <div className="text-center pr-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <TvIcon className="w-6 h-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">Web Monitor Cast</h2>
              </div>
              <p className="text-xs text-gray-600">
                เปิด <span className="font-semibold">{baseUrl ? new URL(baseUrl).hostname : 'youoke.vercel.app'}/monitor</span> บนทีวี
              </p>
            </div>

            {!isCasting ? (
              <div className="space-y-3">

                {/* Guest Name Input (only if not logged in) */}
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      ชื่อของคุณ
                    </label>
                    <input
                      type="text"
                      className="py-2.5 px-4 block w-full bg-base-200 border border-base-300 rounded-lg text-sm focus:border-primary focus:outline-none transition-colors"
                      placeholder="ใส่ชื่อของคุณ"
                      maxLength={20}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}

                {/* Room Code Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    เลขห้อง
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="py-3 px-4 block w-full bg-base-200 border border-base-300 rounded-lg text-center text-2xl tracking-widest font-bold focus:border-primary focus:outline-none transition-colors"
                    placeholder="0000"
                    maxLength={4}
                    value={castInputRoomCode}
                    onChange={(e) => setCastInputRoomCode(e.target.value.replace(/\D/g, ''))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCastJoinRoom();
                      }
                    }}
                    autoFocus={isLogin}
                  />
                </div>

                {/* Error Message */}
                {castError && (
                  <div className="p-2.5 bg-error/10 border border-error/30 rounded-lg text-xs text-error">
                    {castError}
                  </div>
                )}

                {/* Join Button */}
                <button
                  className="w-full py-2.5 px-4 text-white rounded-lg bg-primary hover:bg-primary/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm"
                  onClick={handleCastJoinRoom}
                  disabled={isJoiningRoom || castInputRoomCode.length !== 4 || (!isLogin && !guestName.trim())}
                >
                  {isJoiningRoom ? (
                    <>
                      <ClockIcon className="w-4 h-4 animate-spin" />
                      <span>กำลังเข้าร่วม...</span>
                    </>
                  ) : (
                    <span>เข้าร่วมห้อง</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Connected Status */}
                <div className="bg-base-200 rounded-lg p-3 border border-base-300">
                  <div className="flex items-center justify-center gap-2 text-base font-semibold mb-1">
                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                    <span>เชื่อมต่อแล้ว</span>
                  </div>
                  <div className="text-xl font-bold text-center">ห้อง: {roomCode}</div>
                </div>

                {/* Player Controls */}
                <div>
                  <PlayerControls
                    isPlaying={firebaseCastState.controls.isPlaying}
                    onPlay={firebaseCastPlay}
                    onPause={firebaseCastPause}
                    onNext={firebaseCastNext}
                    className="justify-center"
                  />
                </div>

                {/* Disconnect/Leave Button */}
                <button
                  className="w-full py-2.5 px-4 text-white rounded-lg bg-error hover:bg-error/90 font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                  onClick={handleCastDisconnect}
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>{userInfo?.isGuest ? 'ออกจากห้อง' : 'ตัดการเชื่อมต่อ'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


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
      className={`${isFullscreen || isFullScreenIphone
        ? "fixed inset-0 z-[9999] bg-black block w-screen h-screen"
        : "relative bg-white"
        } ${className}`}
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
      {/* Web Monitor Cast - Enabled for testing */}
      {CastOverlayComponent()}

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
        className="w-full flex flex-col relative flex-1 md:flex-grow-1"
        onClick={() => handleVideoClick()}
      >
        <div className="w-full aspect-video relative bg-black">
          {isCasting && !isMoniter ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-4 gap-3 bg-gradient-to-br from-error to-red-600">
              {/* Compact status banner */}
              <div className="bg-white rounded-xl shadow-2xl px-4 py-3 max-w-sm w-full mx-auto border-2 border-white/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">กำลัง Cast ไป Monitor</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {firebaseCastState.currentVideo?.title || 'รอเพิ่มเพลง...'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCastDisconnect();
                    }}
                    className="flex-shrink-0 px-3 py-2 bg-error hover:bg-error/90 text-white rounded-lg font-bold text-xs transition-all hover:scale-105 shadow-lg"
                  >
                    {userInfo?.isGuest ? 'ออกจากห้อง' : 'ตัดการเชื่อมต่อ'}
                  </button>
                </div>
              </div>

              {/* Share Room Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareRoomModalOpen(true);
                }}
                className="w-full max-w-sm px-4 py-3 bg-white hover:bg-gray-100 text-primary rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-2xl border-2 border-white/50"
              >
                <UserGroupIcon className="w-5 h-5" />
                <span>เชิญเพื่อน - แชร์ห้อง</span>
              </button>
            </div>
          ) : isGoogleCastConnected && !isMoniter ? (
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
                    e.stopPropagation(); // Prevent fullscreen trigger
                    disconnectGoogleCast();
                    addToast('ตัดการเชื่อมต่อ Google Cast แล้ว');
                  }}
                  className="btn btn-sm btn-error gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  ปิด Cast
                </button>
              </div>
            </div>
          ) : (
            <>
              {isDualMode && !isMoniter && (
                <div className="absolute inset-0 z-[10000] h-full w-full flex flex-col items-center justify-center bg-slate-900 text-center border-b border-white/10">
                  <div className="text-4xl md:text-5xl mb-4 animate-pulse">🖥️</div>
                  <h2 className="text-lg md:text-xl font-bold mb-2 text-white">กำลังเล่นที่หน้าจอที่ 2</h2>
                  <p className="text-xs md:text-sm text-gray-400 mb-6">วิดีโอกำลังเล่นบนหน้าจอ Dual Screen</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      localStorage.removeItem('youoke-dual-active');
                      setIsDualMode(false);
                      handleUnMute();
                    }}
                    className="btn btn-sm btn-outline btn-error rounded-full px-6 hover:bg-error hover:text-white transition-all"
                  >
                    ปิดโหมด 2 หน้าจอ
                  </button>
                </div>
              )}
              {!videoId ? (
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
                <>
                  {/* YouTube Player Wrapper */}
                  <div
                    className={`w-full bg-black ${!isFullscreen
                      ? "aspect-video cursor-zoom-in"
                      : "h-[calc(100dvh)] cursor-zoom-out"
                      } ${isDualMode && !isMoniter ? "opacity-0 pointer-events-none invisible" : ""}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: UseFullScreenCss ? "fixed" : "absolute",
                      top: 0,
                      left: 0,
                      zIndex: UseFullScreenCss ? 9999 : 0,
                      visibility: (isDualMode && !isMoniter) ? 'hidden' : 'visible'
                    }}
                  >
                    <YouTube
                      ref={playerRef}
                      videoId={videoId}
                      className="w-full h-full"
                      iframeClassName="w-full h-full pointer-events-none"
                      loading="lazy"
                      opts={{
                        playerVars: {
                          autoplay: isMoniter && playerState === PlayerStates.PAUSED ? 0 : 1,
                          controls: isMoniter ? 1 : 0,
                          disablekb: 1,
                          enablejsapi: 1,
                          modestbranding: 1,
                          playsinline: isIphone && isFullScreenIphone ? 0 : 1,
                          fs: 0,
                        },
                      }}
                      onStateChange={(ev) => updatePlayerState(ev.target)}
                      onEnd={() => nextSong()}
                      onError={(e) => {
                        console.error("YouTube Player Error:", e);
                        nextSong();
                      }}
                    />
                  </div>
                </>
              )}


              {!isLogin && !isMoniter && <BottomAds />}
              {!isLogin && !isMoniter && isShowAds && <VideoAds />}

              {/* Exit Fullscreen Button */}
              {
                !isMoniter && videoId && (isFullscreen || isFullScreenIphone) && (
                  <button
                    onClick={handleFullscreenButtonClick}
                    className="fixed top-4 right-4 z-[100] btn btn-circle btn-sm bg-black/50 text-white border-white/30 hover:bg-black/70"
                    style={UseFullScreenCss ? { position: "fixed" } : {}}
                  >
                    <ArrowsPointingInIcon className="w-5 h-5" />
                  </button>
                )
              }
            </>
          )}
        </div>

        {/* Controls for Remote - OUTSIDE player container (original position) */}
        {
          !isMoniter && showControls && videoId && (
            <div
              className={`flex-shrink-0 flex flex-row w-full p-1 items-center z-[10001] ${isMouseMoving ? "hover:opacity-100" : ""
                } ${(UseFullScreenCss || !isMouseMoving) &&
                  (isFullscreen || isFullScreenIphone)
                  ? "opacity-0"
                  : ""
                }`}
              style={
                UseFullScreenCss
                  ? {
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "initial",
                  }
                  : {}
              }
            >
              {buttons.map((btn) => {
                return (
                  <button
                    key={btn.label}
                    className="btn btn-ghost font-normal text-primary flex h-auto flex-col flex-1 overflow-hidden text-[10px] 2xl:text-xs p-1 gap-0.5 hover:bg-base-200"
                    onClick={btn.onClick}
                  >
                    <btn.icon className="w-5 h-5 2xl:w-6 2xl:h-6" />
                    {btn.label}
                  </button>
                );
              })}
              {extra}
            </div>
          )
        }
      </div>

      {/* Debug Overlay */}
      <DebugOverlay
        isVisible={isDebugOverlayOpen}
        onClose={() => setIsDebugOverlayOpen(false)}
      />

      {/* Share Room Modal */}
      <ShareRoomModal
        isOpen={isShareRoomModalOpen}
        onClose={() => setIsShareRoomModalOpen(false)}
        roomCode={roomCode}
        shareUrl={baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : ''}
      />

      {/* Guest Limit Modal */}
      <GuestLimitModal
        isOpen={showGuestLimitModal}
        onClose={() => setShowGuestLimitModal(false)}
        playedCount={playedCount}
        guestLimit={guestLimit}
      />

      {/* Debug Toggle Button - Removed to avoid blocking Dual Screen button */}
    </div >
  );
}

export default YoutubePlayer;
