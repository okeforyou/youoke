import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, off } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { CastCommand, CastCommandEnvelope } from '../types/castCommands';
import { sendCommand } from '../utils/castCommands';
import { QRCodeSVG } from 'qrcode.react';
import {
  DevicePhoneMobileIcon,
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  ArrowRightIcon,
  MusicalNoteIcon,
  LightBulbIcon,
  TvIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
  addedBy?: {
    uid: string;
    displayName: string;
    isGuest: boolean;
  };
}

interface RoomData {
  queue: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;
  controls: {
    isPlaying: boolean;
    isMuted: boolean;
  };
}

const Monitor = () => {
  const router = useRouter();
  const { room: roomCodeParam } = router.query;

  // Auto-generate room code if not provided
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [hostId, setHostId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [hasUserInteraction, setHasUserInteraction] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [forceShowQueue, setForceShowQueue] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track previous queue length for temporary queue display
  const lastQueueLengthRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Detect base URL (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
      console.log('🌐 Base URL detected:', window.location.origin);
    }
  }, []);

  // Anonymous login (required for Firebase write permission)
  useEffect(() => {
    const loginAnonymously = async () => {
      try {
        await signInAnonymously(auth);
        console.log('✅ Monitor signed in anonymously');
        setIsAuthReady(true);
      } catch (error) {
        console.error('❌ Anonymous sign-in failed:', error);
      }
    };
    loginAnonymously();
  }, []);

  // Generate room code once
  useEffect(() => {
    if (roomCodeParam && typeof roomCodeParam === 'string') {
      setRoomCode(roomCodeParam);
    } else {
      const newCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setRoomCode(newCode);
      console.log('🎲 Auto-generated room code:', newCode);
    }
  }, [roomCodeParam]);

  // Listen to room data
  useEffect(() => {
    if (!roomCode || !realtimeDb || !isAuthReady) return;

    console.log('Monitoring room:', roomCode);
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
    let unsubscribe: (() => void) | null = null;
    let lastDataRef: any = null; // Track last data to avoid logging unchanged data

    // Create room if doesn't exist, THEN start listening
    const initializeRoom = async () => {
      try {
        console.log('🔍 Checking if room exists...');
        const dbURL = realtimeDb?.app?.options?.databaseURL || 'MISSING';

        // Use REST API instead of get() to bypass stack overflow
        console.log('📡 Calling REST API to check room...');
        const checkResponse = await fetch(`${dbURL}/rooms/${roomCode}.json`);
        const existingData = await checkResponse.json();
        console.log('✅ REST API check successful, exists:', existingData !== null);

        if (!existingData) {
          console.log('📝 Room not found, creating new room...');

          // Log Firebase config with actual values (not just [Object])
          const dbURL = realtimeDb?.app?.options?.databaseURL || 'MISSING';
          const projID = realtimeDb?.app?.options?.projectId || 'MISSING';
          console.log('📊 DATABASE_URL:', dbURL);
          console.log('📊 PROJECT_ID:', projID);
          console.log('📊 Has region (asia-southeast1)?', dbURL.includes('asia-southeast1'));

          // Create room with full data
          const roomData = {
            hostId: 'monitor',
            isHost: true,
            state: {
              queue: [],
              currentIndex: 0,
              currentVideo: null,
              controls: { isPlaying: false, isMuted: false },
            },
            createdAt: Date.now(),
          };

          console.log('💾 Creating room with data:', roomData);

          // Use REST API instead of SDK to bypass stack overflow bug
          try {
            // Get auth token from current user
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : null;

            const restURL = token
              ? `${dbURL}/rooms/${roomCode}.json?auth=${token}`
              : `${dbURL}/rooms/${roomCode}.json`;
            console.log('🌐 Using REST API:', restURL.replace(/auth=.*/, 'auth=***'));

            const response = await fetch(restURL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(roomData),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`REST API failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Room created via REST API:', result);
          } catch (restError) {
            console.error('❌ REST API failed:', restError);
            throw restError; // Don't fallback to SDK - it will stack overflow
          }

          console.log('✅ Room created successfully:', roomCode);
        } else {
          console.log('✅ Room already exists');
        }

        // Use REST API polling instead of onValue() to bypass stack overflow bug
        console.log('👂 Starting to poll for room updates (REST API)...');

        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${dbURL}/rooms/${roomCode}.json`);

            if (!response.ok) {
              console.error('❌ Poll failed:', response.status);
              return;
            }

            const data = await response.json();

            if (!data) {
              console.log('Room not found');
              setIsConnected(false);
              setRoomData(null);
              return;
            }

            // Only log when data changes (reduce console spam)
            if (JSON.stringify(data) !== JSON.stringify(lastDataRef)) {
              console.log('📦 Room data updated:', data);
              lastDataRef = data;
            }

            // Read from data.state (nested structure from FirebaseCastContext)
            const state = data.state || data; // Fallback to flat if state doesn't exist
            const queueData = state.queue || [];

            // Check if Remote has connected
            // Either: 1) lastConnected timestamp exists (Remote sent CONNECT command)
            //     OR: 2) queue has songs (backwards compatibility)
            const hasConnected = !!(state.lastConnected) || queueData.length > 0;

            console.log('🔗 Connection check:', {
              lastConnected: state.lastConnected ? new Date(state.lastConnected).toLocaleTimeString() : 'none',
              queueLength: queueData.length,
              hasConnected,
            });
            setIsConnected(hasConnected);

            // Store hostId to determine if Monitor can remove songs
            setHostId(data.hostId || 'monitor');

            setRoomData({
              queue: queueData,
              currentIndex: state.currentIndex || 0,
              currentVideo: state.currentVideo || null,
              controls: state.controls || { isPlaying: false, isMuted: false },
            });
          } catch (error) {
            console.error('❌ Polling error:', error);
          }
        }, 1000); // Poll every 1 second

        unsubscribe = () => clearInterval(pollInterval);
      } catch (error) {
        console.error('❌ initializeRoom error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    };

    initializeRoom();

    return () => {
      if (unsubscribe) {
        off(roomRef);
        unsubscribe();
      }
    };
  }, [roomCode, isAuthReady]);

  // Load new video when currentVideo changes
  useEffect(() => {
    if (!player || !roomData?.currentVideo) return;

    const { videoId } = roomData.currentVideo;
    const shouldAutoPlay = roomData.controls.isPlaying;

    // Load the new video with autoplay based on isPlaying state
    console.log('📺 Loading video on Monitor:', videoId, roomData.currentVideo.title);

    if (shouldAutoPlay) {
      // Set loading flag to prevent playback control useEffect from interfering
      setIsLoadingVideo(true);

      // CRITICAL: Mute before loading to ensure autoplay works
      // Browsers block autoplay for unmuted videos
      const loadAndPlay = async () => {
        try {
          console.log('🔇 Muting player before load (required for autoplay)');
          await player.mute();
        } catch (error) {
          console.warn('⚠️ Could not mute player:', error);
        }

        // Use loadVideoById which should auto-play
        console.log('▶️ Auto-playing video');
        player.loadVideoById(videoId);

        // Aggressively ensure playback starts (retry mechanism)
        // Because YouTube player might not be ready immediately
        const ensurePlayback = async () => {
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1))); // Increasing delays: 300ms, 600ms, 900ms, 1200ms, 1500ms

            try {
              const state = await player.getPlayerState();
              console.log(`🔄 Playback check ${i + 1}/5: state =`, state);

              // If not playing (state !== 1), force play
              if (state !== 1) {
                console.log(`⚡ Forcing playback (attempt ${i + 1}/5)`);
                await player.playVideo();
              } else {
                console.log('✅ Video is playing!');
                break; // Success!
              }
            } catch (error) {
              console.warn(`⚠️ Playback check ${i + 1} failed:`, error);
              // Try anyway
              try {
                await player.playVideo();
              } catch (e) {
                // Ignore
              }
            }
          }

          // Clear loading flag when done
          setIsLoadingVideo(false);
        };

        ensurePlayback();
      };

      loadAndPlay();
    } else {
      // Use cueVideoById which loads but doesn't play
      console.log('⏸️ Cueing video (not playing)');
      player.cueVideoById(videoId);
    }
  }, [player, roomData?.currentVideo?.videoId]);

  // Control player based on roomData.controls
  useEffect(() => {
    if (!player || !roomData) return;

    // Skip if currently loading a new video (to avoid interference)
    if (isLoadingVideo) {
      console.log('⏭️ Skipping playback control (video loading in progress)');
      return;
    }

    const { isPlaying } = roomData.controls;

    // Get current player state with error handling
    try {
      const statePromise = player.getPlayerState();

      // Check if getPlayerState returned a Promise
      if (statePromise && typeof statePromise.then === 'function') {
        statePromise.then((state) => {
          // 1 = playing, 2 = paused
          const isCurrentlyPlaying = state === 1;

          if (isPlaying && !isCurrentlyPlaying) {
            console.log('▶️ Playing video (from remote control)');
            player.playVideo();
          } else if (!isPlaying && isCurrentlyPlaying) {
            console.log('⏸️ Pausing video (from remote control)');
            player.pauseVideo();
          }
        }).catch((error) => {
          console.warn('⚠️ Could not get player state:', error);
        });
      } else {
        // If player not ready, just call play/pause directly
        console.log('⚠️ Player not ready, calling play/pause directly');
        if (isPlaying) {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
      }
    } catch (error) {
      console.error('❌ Error controlling player:', error);
    }
  }, [player, roomData?.controls.isPlaying, isLoadingVideo]);

  // Sync mute state from Remote (only when user explicitly controls it)
  useEffect(() => {
    if (!player || !roomData) return;

    const shouldMute = roomData.controls.isMuted === true;

    const syncMute = async () => {
      try {
        const state = await player.getPlayerState();
        // Skip if player not ready
        if (state === -1) {
          console.log('⏳ Player not ready, skipping mute sync');
          return;
        }

        if (shouldMute) {
          await player.mute();
          console.log('🔇 Muted from Remote');
        }
        // Don't auto-unmute - let user unmute via YouTube controls
        // Browser blocks auto-unmute without user interaction
      } catch (error) {
        console.warn('⚠️ Mute failed:', error);
      }
    };

    syncMute();
  }, [player, roomData?.controls.isMuted]);

  // Command Executor - Process commands from Remote
  useEffect(() => {
    if (!roomCode || !realtimeDb || !isAuthReady) return;

    const dbURL = realtimeDb.app.options.databaseURL;
    let processedCommandIds = new Set<string>();

    const commandPollInterval = setInterval(async () => {
      try {
        // Fetch all pending commands
        const response = await fetch(`${dbURL}/rooms/${roomCode}/commands.json`);
        if (!response.ok) return;

        const commands = await response.json() as Record<string, CastCommandEnvelope> | null;
        if (!commands) return;

        // Process pending commands
        for (const [commandId, envelope] of Object.entries(commands)) {
          // Skip if already processed or not pending
          if (processedCommandIds.has(commandId) || envelope.status !== 'pending') {
            continue;
          }

          console.log('⚙️ Executing command:', envelope.command.type);
          processedCommandIds.add(commandId);

          // Execute command and update state
          try {
            const newState = await executeCommand(envelope.command, roomData);

            // Add lastConnected timestamp for CONNECT command
            const stateToWrite = envelope.command.type === 'CONNECT'
              ? { ...newState, lastConnected: Date.now() }
              : newState;

            // Update state in Firebase
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : null;
            const stateURL = token
              ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
              : `${dbURL}/rooms/${roomCode}/state.json`;

            const stateResponse = await fetch(stateURL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(stateToWrite),
            });

            if (!stateResponse.ok) {
              console.error('❌ Failed to write state:', stateResponse.status);
            } else {
              console.log('💾 State written to Firebase:', {
                command: envelope.command.type,
                currentIndex: newState.currentIndex,
                currentVideo: newState.currentVideo?.title,
              });
            }

            // Mark command as completed
            const cmdURL = token
              ? `${dbURL}/rooms/${roomCode}/commands/${commandId}/status.json?auth=${token}`
              : `${dbURL}/rooms/${roomCode}/commands/${commandId}/status.json`;

            await fetch(cmdURL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify('completed'),
            });

            console.log('✅ Command executed:', envelope.command.type);
          } catch (error) {
            console.error('❌ Command execution failed:', error);
          }
        }
      } catch (error) {
        console.error('❌ Command polling error:', error);
      }
    }, 500); // Poll commands every 500ms

    return () => clearInterval(commandPollInterval);
  }, [roomCode, isAuthReady, roomData]);

  // Execute a command and return new state
  const executeCommand = async (command: CastCommand, currentState: RoomData | null): Promise<RoomData> => {
    if (!currentState) {
      currentState = {
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false },
      };
    }

    const newState = { ...currentState };

    switch (command.type) {
      case 'CONNECT':
        console.log('🔗 Remote connected');
        // CONNECT doesn't modify roomData, but we need to update state with lastConnected
        // This will be handled by returning the state with lastConnected added
        break;

      case 'ADD_TO_QUEUE':
        newState.queue = [...newState.queue, command.payload.video];
        // If no current video, start playing the first one
        if (!newState.currentVideo && newState.queue.length > 0) {
          newState.currentVideo = newState.queue[0];
          newState.currentIndex = 0;
          newState.controls.isPlaying = true;
        }
        break;

      case 'PLAY_NOW':
        // Check if video already exists in queue (by videoId)
        const existingIndex = newState.queue.findIndex(v => v.videoId === command.payload.video.videoId);

        if (existingIndex >= 0) {
          // Video already in queue - just play it
          console.log('🔄 Video already in queue, skipping to it');
          newState.currentIndex = existingIndex;
          newState.currentVideo = newState.queue[existingIndex];
        } else {
          // New video - add to front of queue
          newState.queue = [command.payload.video, ...newState.queue];
          newState.currentVideo = command.payload.video;
          newState.currentIndex = 0;
        }
        newState.controls.isPlaying = true;
        break;

      case 'PLAY_NEXT':
        newState.queue.splice(newState.currentIndex + 1, 0, command.payload.video);
        break;

      case 'PLAY':
        newState.controls.isPlaying = true;
        break;

      case 'PAUSE':
        newState.controls.isPlaying = false;
        break;

      case 'NEXT':
        console.log('🎵 NEXT command - Current state:', {
          currentIndex: newState.currentIndex,
          queueLength: newState.queue.length,
          currentVideo: newState.currentVideo?.title,
        });

        if (newState.currentIndex < newState.queue.length - 1) {
          newState.currentIndex++;
          newState.currentVideo = newState.queue[newState.currentIndex];
          newState.controls.isPlaying = true;

          console.log('🎵 NEXT command - New state:', {
            currentIndex: newState.currentIndex,
            newVideo: newState.currentVideo?.title,
          });
        } else {
          console.log('⚠️ NEXT command - Already at last video');
        }
        break;

      case 'PREVIOUS':
        if (newState.currentIndex > 0) {
          newState.currentIndex--;
          newState.currentVideo = newState.queue[newState.currentIndex];
          newState.controls.isPlaying = true;
        }
        break;

      case 'SKIP_TO':
        if (command.payload.index >= 0 && command.payload.index < newState.queue.length) {
          newState.currentIndex = command.payload.index;
          newState.currentVideo = newState.queue[command.payload.index];
          newState.controls.isPlaying = true;
        }
        break;

      case 'REMOVE_AT':
        if (command.payload.index >= 0 && command.payload.index < newState.queue.length) {
          newState.queue.splice(command.payload.index, 1);
          // Adjust currentIndex if needed
          if (command.payload.index < newState.currentIndex) {
            newState.currentIndex--;
          } else if (command.payload.index === newState.currentIndex) {
            // Removed current video, play next one
            if (newState.queue.length > 0) {
              newState.currentVideo = newState.queue[newState.currentIndex] || newState.queue[0];
            } else {
              newState.currentVideo = null;
              newState.controls.isPlaying = false;
            }
          }
        }
        break;

      case 'SET_PLAYLIST':
        newState.queue = command.payload.playlist;
        if (newState.queue.length > 0) {
          newState.currentIndex = 0;
          newState.currentVideo = newState.queue[0];
          newState.controls.isPlaying = true; // Auto-play when playlist is set
        } else {
          newState.currentIndex = 0;
          newState.currentVideo = null;
          newState.controls.isPlaying = false;
        }
        break;

      case 'CLEAR_QUEUE':
        newState.queue = [];
        newState.currentIndex = 0;
        newState.currentVideo = null;
        newState.controls.isPlaying = false;
        break;

      case 'MUTE':
        newState.controls.isMuted = true;
        break;

      case 'UNMUTE':
        newState.controls.isMuted = false;
        break;

      case 'TOGGLE_MUTE':
        newState.controls.isMuted = !newState.controls.isMuted;
        break;
    }

    return newState;
  };

  // Handle player ready
  const onPlayerReady = async (event: { target: YouTubePlayer }) => {
    console.log('🎬 Player ready');
    setPlayer(event.target);

    // If user has interacted, unmute immediately
    if (hasUserInteraction) {
      try {
        await event.target.unMute();
        console.log('🔊 Unmuted on player ready (user has interacted)');
      } catch (error) {
        console.warn('⚠️ Unmute failed:', error);
      }
    } else {
      console.log('🔇 Player ready but muted (waiting for user interaction)');
    }
  };

  // Temporarily show queue when songs are added or removed
  useEffect(() => {
    if (roomData) {
      const currentLength = roomData.queue.length;
      const previousLength = lastQueueLengthRef.current;

      // Show queue when queue changes (added or removed)
      if (currentLength !== previousLength && previousLength !== 0) {
        if (currentLength > previousLength) {
          console.log('📋 New song added - forcing queue display for 20 seconds');
        } else {
          console.log('📋 Song removed - forcing queue display for 20 seconds');
        }

        setForceShowQueue(true);
        setShowQueue(true);

        const timer = setTimeout(() => {
          console.log('📋 Returning to normal queue visibility');
          setForceShowQueue(false);
        }, 20000); // 20 seconds

        lastQueueLengthRef.current = currentLength;
        return () => clearTimeout(timer);
      }

      lastQueueLengthRef.current = currentLength;
    }
  }, [roomData?.queue.length]);

  // Check remaining time and show/hide queue
  useEffect(() => {
    if (!player || !isPlaying) {
      setShowQueue(true); // Show queue when not playing
      return;
    }

    const checkTime = setInterval(async () => {
      try {
        const currentTime = await player.getCurrentTime();
        const duration = await player.getDuration();
        const remaining = duration - currentTime;

        // Show queue at the beginning (first 15s) OR near the end (last 60s) OR when forced (song added/removed)
        const showAtStart = currentTime < 15;
        const showAtEnd = remaining < 60;

        setShowQueue(forceShowQueue || showAtStart || showAtEnd);
      } catch (error) {
        console.error('❌ Queue visibility check error:', error);
      }
    }, 1000);

    return () => clearInterval(checkTime);
  }, [player, isPlaying, forceShowQueue]);

  // Handle player state change
  const onPlayerStateChange = async (event: { data: number }) => {
    // YouTube player states: 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0 && roomData) {
      // Video ended - play next song
      console.log('🎬 Video ended, playing next...');

      const nextIndex = roomData.currentIndex + 1;
      if (nextIndex < roomData.queue.length) {
        // Play next song
        const nextVideo = roomData.queue[nextIndex];

        try {
          const dbURL = realtimeDb.app.options.databaseURL;
          const user = auth.currentUser;
          const token = user ? await user.getIdToken() : null;

          const stateURL = token
            ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
            : `${dbURL}/rooms/${roomCode}/state.json`;

          const newState = {
            queue: roomData.queue,
            currentIndex: nextIndex,
            currentVideo: nextVideo,
            controls: {
              isPlaying: true,
              isMuted: roomData.controls.isMuted
            },
          };

          const response = await fetch(stateURL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newState),
          });

          if (response.ok) {
            console.log('✅ Auto-played next song:', nextVideo.title);
          } else {
            console.error('❌ Failed to update state:', response.status);
          }
        } catch (error) {
          console.error('❌ Error playing next song:', error);
        }
      } else {
        console.log('🏁 Queue finished');
      }
    } else if (event.data === 1) {
      console.log('▶️ Video playing');
      setIsPlaying(true);

      // Unmute if user has interacted
      if (hasUserInteraction && player) {
        try {
          await player.unMute();
          console.log('🔊 Unmuted (user has interacted)');
        } catch (error) {
          console.warn('⚠️ Unmute failed:', error);
        }
      } else {
        console.log('🔇 Playing muted (waiting for user interaction)');
      }
    } else if (event.data === 2) {
      console.log('⏸️ Video paused');
      setIsPlaying(false);
    }
  };

  // Handle player error
  const onPlayerError = (event: { data: number }) => {
    console.error('Player error:', event.data);
  };

  // Mouse movement tracking for auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Control handlers
  const handlePlayPause = async () => {
    if (!player || !roomData) return;

    try {
      const dbURL = realtimeDb.app.options.databaseURL;
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const stateURL = token
        ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
        : `${dbURL}/rooms/${roomCode}/state.json`;

      const newState = {
        ...roomData,
        controls: {
          ...roomData.controls,
          isPlaying: !roomData.controls.isPlaying,
        },
      };

      const response = await fetch(stateURL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controls: newState.controls }),
      });

      if (response.ok) {
        if (!roomData.controls.isPlaying) {
          await player.playVideo();
          console.log('▶️ Manual play');
        } else {
          await player.pauseVideo();
          console.log('⏸️ Manual pause');
        }
      }
    } catch (error) {
      console.error('❌ Play/Pause failed:', error);
    }
  };

  const handleNext = async () => {
    if (!roomData || !player) return;

    const nextIndex = roomData.currentIndex + 1;
    if (nextIndex >= roomData.queue.length) {
      console.log('🏁 No next song');
      return;
    }

    try {
      const nextVideo = roomData.queue[nextIndex];
      const dbURL = realtimeDb.app.options.databaseURL;
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const stateURL = token
        ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
        : `${dbURL}/rooms/${roomCode}/state.json`;

      const newState = {
        ...roomData,
        currentIndex: nextIndex,
        currentVideo: nextVideo,
        controls: {
          ...roomData.controls,
          isPlaying: true,
        },
      };

      const response = await fetch(stateURL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });

      if (response.ok) {
        console.log('⏭️ Manual next:', nextVideo.title);
      }
    } catch (error) {
      console.error('❌ Next failed:', error);
    }
  };

  const handlePrevious = async () => {
    if (!roomData || !player) return;

    const prevIndex = roomData.currentIndex - 1;
    if (prevIndex < 0) {
      console.log('🏁 No previous song');
      return;
    }

    try {
      const prevVideo = roomData.queue[prevIndex];
      const dbURL = realtimeDb.app.options.databaseURL;
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const stateURL = token
        ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
        : `${dbURL}/rooms/${roomCode}/state.json`;

      const newState = {
        ...roomData,
        currentIndex: prevIndex,
        currentVideo: prevVideo,
        controls: {
          ...roomData.controls,
          isPlaying: true,
        },
      };

      const response = await fetch(stateURL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });

      if (response.ok) {
        console.log('⏮️ Manual previous:', prevVideo.title);
      }
    } catch (error) {
      console.error('❌ Previous failed:', error);
    }
  };

  // Remove song from queue (only for host)
  const handleRemoveSong = async (queueIndex: number) => {
    if (hostId !== 'monitor') {
      console.warn('⚠️ Only host can remove songs');
      return;
    }

    try {
      await sendCommand(roomCode, {
        type: 'REMOVE_AT',
        payload: { index: queueIndex },
      }, 'monitor');
      console.log('🗑️ Remove command sent for index:', queueIndex);
    } catch (error) {
      console.error('❌ Failed to remove song:', error);
    }
  };

  const handleToggleMute = async () => {
    if (!player || !roomData) return;

    try {
      const newMuteState = !roomData.controls.isMuted;
      const dbURL = realtimeDb.app.options.databaseURL;
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const stateURL = token
        ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
        : `${dbURL}/rooms/${roomCode}/state.json`;

      const newState = {
        ...roomData,
        controls: {
          ...roomData.controls,
          isMuted: newMuteState,
        },
      };

      const response = await fetch(stateURL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controls: newState.controls }),
      });

      if (response.ok) {
        if (newMuteState) {
          await player.mute();
          console.log('🔇 Muted');
        } else {
          await player.unMute();
          console.log('🔊 Unmuted');
        }
      }
    } catch (error) {
      console.error('❌ Toggle mute failed:', error);
    }
  };

  const handleToggleFullscreen = async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        console.log('📺 Enter fullscreen');
      } else {
        await document.exitFullscreen();
        console.log('📺 Exit fullscreen');
      }
    } catch (error) {
      console.error('❌ Fullscreen toggle failed:', error);
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as 1,
      controls: 0 as 0,  // Hide YouTube controls - use custom controls
      modestbranding: 1 as 1,
      rel: 0 as 0,
      disablekb: 1 as 1,  // Disable keyboard controls
    },
  };

  // Show waiting for connection (room code is auto-generated)
  if (!isConnected || !roomData) {
    // Use dynamic base URL (auto-detects youoke.vercel.app, play.okeforyou.com, localhost, etc.)
    const qrCodeUrl = baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : '';

    return (
      <div
        className="relative h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white cursor-pointer overflow-hidden"
        onClick={() => {
          if (!hasUserInteraction) {
            console.log('👆 User clicked on QR screen - enabling audio');
            setHasUserInteraction(true);
          }
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-6 sm:px-8 md:px-12">
          {/* Logo/Title */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-primary">
              YouOke TV
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              คาราโอเกะออนไลน์
            </p>
          </div>

          {/* Main Content Container */}
          <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
            <div className="bg-black/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: QR Code Section */}
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 bg-black">
                  {qrCodeUrl && (
                    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl mb-4 sm:mb-6">
                      <QRCodeSVG
                        value={qrCodeUrl}
                        size={window.innerWidth < 640 ? 160 : window.innerWidth < 768 ? 180 : 220}
                        level="M"
                      />
                    </div>
                  )}

                  {/* Room Code */}
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-white/70 mb-2">เลขห้อง</p>
                    <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-widest text-primary">
                      {roomCode}
                    </p>
                  </div>

                  {/* Shareable Link */}
                  {qrCodeUrl && (
                    <div className="mt-4 sm:mt-6 text-center">
                      <p className="text-xs text-white/50 mb-2">หรือแชร์ลิงก์นี้</p>
                      <div className="bg-white/10 rounded-lg px-3 py-2 max-w-xs mx-auto">
                        <p className="text-xs font-mono text-primary/90 truncate">
                          {qrCodeUrl}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Instructions Section */}
                <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12 space-y-4 sm:space-y-5 md:space-y-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <DevicePhoneMobileIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                    วิธีใช้งาน
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm sm:text-base">1</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-white">
                          <span className="font-semibold text-primary">Scan QR Code</span> ด้วยกล้องมือถือ
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-9 sm:pl-11">
                      <div className="flex-1 border-t border-white/30"></div>
                      <span className="text-xs text-white/70">หรือ</span>
                      <div className="flex-1 border-t border-white/30"></div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm sm:text-base">2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-white break-words">
                          เปิด <span className="font-mono font-semibold text-primary">{baseUrl ? new URL(baseUrl).hostname : 'youoke.vercel.app'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm sm:text-base">3</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-white">
                          กดปุ่ม <span className="font-semibold text-primary">"Cast to TV"</span>
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm sm:text-base">4</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-white">
                          กรอกเลขห้อง <span className="font-bold text-primary">{roomCode}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Hint */}
                  {!hasUserInteraction && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                      <p className="text-xs sm:text-sm text-primary flex items-center gap-2">
                        <LightBulbIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="font-medium">คลิกหน้าจอเพื่อเริ่มเสียง</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <p className="text-sm sm:text-base md:text-lg text-white/70 mt-6 sm:mt-8 animate-pulse flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
            รอเชื่อมต่อจากมือถือ...
          </p>
        </div>
      </div>
    );
  }

  // Show player when connected
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      {/* YouTube Player */}
      <div ref={playerContainerRef} className="flex-1 relative">
        {roomData.currentVideo ? (
          <YouTube
            videoId={roomData.currentVideo.videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={onPlayerError}
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
              <p className="text-3xl mb-6">เลขห้อง: {roomCode}</p>
              <p className="text-2xl text-gray-400">พร้อมเล่น ✅</p>
              <p className="text-xl text-gray-500 mt-4">
                เพิ่มเพลงจากมือถือเพื่อเริ่มเล่น
              </p>
            </div>
          </div>
        )}

        {/* Audio hint overlay - บังคับให้ต้องกดก่อนเปิดเสียง */}
        {!hasUserInteraction && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer z-50"
            onClick={async () => {
              console.log('👆 User clicked to enable audio');
              setHasUserInteraction(true);

              // Unmute and ensure playback
              if (player) {
                try {
                  await player.unMute();
                  console.log('🔊 Unmuted after user click');

                  // Make sure video is playing
                  const state = await player.getPlayerState();
                  if (state !== 1) {
                    await player.playVideo();
                    console.log('▶️ Playing after unmute');
                  }
                } catch (error) {
                  console.warn('⚠️ Unmute/Play failed:', error);
                }
              }
            }}
          >
            <div className="text-center bg-primary px-16 py-12 rounded-3xl shadow-2xl animate-pulse">
              <div className="flex items-center justify-center gap-4 mb-6">
                <DevicePhoneMobileIcon className="w-20 h-20" />
                <ArrowRightIcon className="w-12 h-12" />
                <TvIcon className="w-20 h-20" />
              </div>
              <h2 className="text-5xl font-bold mb-6">กดเพื่อเริ่มใช้งาน</h2>
              <p className="text-2xl text-white/90">
                {roomData.currentVideo ? 'วิดีโอพร้อมเล่น' : 'กดที่หน้าจอเพื่อเริ่มต้น'}
              </p>
            </div>
          </div>
        )}

        {/* Room Code Display - Top Left (Always visible when playing) */}
        {roomData.currentVideo && (
          <div className="absolute top-8 left-8 z-50">
            <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Room Code</p>
              <p className="text-2xl font-bold text-primary tracking-widest">{roomCode}</p>
            </div>
          </div>
        )}

        {/* Mini Control Player - Bottom Center (Auto-hide) */}
        {roomData.currentVideo && showControls && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300">
            <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl border border-white/10">
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={roomData.currentIndex === 0}
                className="p-3 rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="เพลงก่อนหน้า"
              >
                <BackwardIcon className="w-6 h-6 text-white" />
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="p-4 rounded-full bg-primary hover:bg-primary/80 transition-all"
                title={roomData.controls.isPlaying ? 'หยุดชั่วคราว' : 'เล่น'}
              >
                {roomData.controls.isPlaying ? (
                  <PauseIcon className="w-7 h-7 text-white" />
                ) : (
                  <PlayIcon className="w-7 h-7 text-white" />
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={roomData.currentIndex >= roomData.queue.length - 1}
                className="p-3 rounded-full hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="เพลงถัดไป"
              >
                <ForwardIcon className="w-6 h-6 text-white" />
              </button>

              {/* Divider */}
              <div className="ml-2 pl-2 border-l border-white/20"></div>

              {/* Mute Toggle */}
              <button
                onClick={handleToggleMute}
                className="p-3 rounded-full hover:bg-white/20 transition-all"
                title={roomData.controls.isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
              >
                {roomData.controls.isMuted ? (
                  <SpeakerXMarkIcon className="w-6 h-6 text-white" />
                ) : (
                  <SpeakerWaveIcon className="w-6 h-6 text-white" />
                )}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={handleToggleFullscreen}
                className="p-3 rounded-full hover:bg-white/20 transition-all"
                title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-6 h-6 text-white" />
                ) : (
                  <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Queue Display - Right Side Vertical */}
        {roomData.queue.length > 0 && showQueue && (
        <div className="absolute top-0 right-0 h-full w-80 lg:w-96 z-50 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md p-6 overflow-y-auto transition-all duration-500">
          <div className="space-y-6">
            {/* Now Playing */}
            {roomData.currentVideo && (
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">กำลังเล่น</p>
                <div className="bg-primary/20 border border-primary/30 rounded-xl p-4">
                  <h2 className="text-lg font-bold mb-1 line-clamp-2">
                    {roomData.currentVideo.title}
                  </h2>
                  {roomData.currentVideo.author && (
                    <p className="text-sm text-gray-300 truncate">{roomData.currentVideo.author}</p>
                  )}
                </div>
              </div>
            )}

            {/* Next in Queue */}
            {roomData.queue.length > roomData.currentIndex + 1 && (
              <div>
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <MusicalNoteIcon className="w-5 h-5" />
                  <span>คิวถัดไป</span>
                  <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    {roomData.queue.length - roomData.currentIndex - 1} เพลง
                  </span>
                </p>
                <div className="space-y-2">
                  {roomData.queue
                    .slice(roomData.currentIndex + 1, roomData.currentIndex + 8)
                    .map((video, index) => (
                      <div
                        key={video.key}
                        className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm line-clamp-2 mb-0.5">
                              {video.title}
                            </p>
                            {video.author && (
                              <p className="text-xs text-gray-400 truncate">
                                {video.author}
                              </p>
                            )}
                            {video.addedBy && (
                              <p className="text-xs text-primary/80 truncate mt-0.5">
                                โดย: {video.addedBy.displayName}
                                {video.addedBy.isGuest && ' (Guest)'}
                              </p>
                            )}
                          </div>
                          {/* Remove Button (only for host) */}
                          {hostId === 'monitor' && (
                            <button
                              onClick={() => handleRemoveSong(roomData.currentIndex + 1 + index)}
                              className="flex-shrink-0 w-7 h-7 rounded-full bg-error/20 hover:bg-error/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="ลบเพลง"
                            >
                              <XMarkIcon className="w-4 h-4 text-error" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* More songs indicator */}
                {roomData.queue.length > roomData.currentIndex + 9 && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400">
                      + อีก {roomData.queue.length - roomData.currentIndex - 9} เพลง
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Monitor;
