import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, off } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { CastCommand, CastCommandEnvelope } from '../types/castCommands';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
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
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

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
              controls: { isPlaying: false, isMuted: true },
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

            setIsConnected(true);

            // Read from data.state (nested structure from FirebaseCastContext)
            const state = data.state || data; // Fallback to flat if state doesn't exist
            setRoomData({
              queue: state.queue || [],
              currentIndex: state.currentIndex || 0,
              currentVideo: state.currentVideo || null,
              controls: state.controls || { isPlaying: false, isMuted: true },
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

  // Sync mute state from Remote
  useEffect(() => {
    if (!player || !roomData) return;

    const shouldMute = roomData.controls.isMuted !== false; // Default to muted

    const syncMute = async () => {
      try {
        const state = await player.getPlayerState();
        // Skip if player not ready (-1 = unstarted)
        if (state === -1) {
          console.log('⏳ Player not ready, skipping mute sync');
          return;
        }

        if (shouldMute) {
          await player.mute();
          console.log('🔇 Muted from Remote');
        } else {
          await player.unMute();
          console.log('🔊 Unmuted from Remote');
        }
      } catch (error) {
        console.warn('⚠️ Mute/Unmute failed:', error);
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

            // Update state in Firebase
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : null;
            const stateURL = token
              ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
              : `${dbURL}/rooms/${roomCode}/state.json`;

            const stateResponse = await fetch(stateURL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newState),
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
        controls: { isPlaying: false, isMuted: true },
      };
    }

    const newState = { ...currentState };

    switch (command.type) {
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
        newState.queue = [command.payload.video, ...newState.queue];
        newState.currentVideo = command.payload.video;
        newState.currentIndex = 0;
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
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    console.log('Player ready');
    setPlayer(event.target);
  };

  // Handle player state change
  const onPlayerStateChange = (event: { data: number }) => {
    // YouTube player states: 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0) {
      // Video ended
      console.log('Video ended');
      // Note: Auto-play next is handled by the sender updating currentIndex
    } else if (event.data === 1) {
      console.log('Video playing');
    } else if (event.data === 2) {
      console.log('Video paused');
    }
  };

  // Handle player error
  const onPlayerError = (event: { data: number }) => {
    console.error('Player error:', event.data);
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as 1,
      controls: 1 as 1,
      modestbranding: 1 as 1,
      rel: 0 as 0,
    },
  };

  // Show waiting for connection (room code is auto-generated)
  if (!isConnected || !roomData) {
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
          <p className="text-3xl mb-6">เลขห้อง: {roomCode}</p>
          <p className="text-xl text-gray-400">รอเชื่อมต่อจากมือถือ...</p>
          <p className="text-lg text-gray-500 mt-4">
            กด "Cast to TV" บนมือถือและกรอกเลขห้อง
          </p>
        </div>
      </div>
    );
  }

  // Show player when connected
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      {/* YouTube Player */}
      <div className="flex-1 relative">
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
              <p className="text-2xl text-gray-400">เชื่อมต่อแล้ว ✅</p>
              <p className="text-xl text-gray-500 mt-4">
                เพิ่มเพลงจากมือถือเพื่อเริ่มเล่น
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Queue Display */}
      {roomData.queue.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
          <div className="max-w-6xl mx-auto">
            {/* Now Playing */}
            {roomData.currentVideo && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">กำลังเล่น:</p>
                <h2 className="text-2xl font-bold truncate">
                  {roomData.currentVideo.title}
                </h2>
                {roomData.currentVideo.author && (
                  <p className="text-lg text-gray-300">{roomData.currentVideo.author}</p>
                )}
              </div>
            )}

            {/* Next in Queue */}
            {roomData.queue.length > roomData.currentIndex + 1 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">คิวถัดไป:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {roomData.queue
                    .slice(roomData.currentIndex + 1, roomData.currentIndex + 4)
                    .map((video, index) => (
                      <div
                        key={video.key}
                        className="bg-gray-900/50 rounded p-2 text-sm"
                      >
                        <p className="text-xs text-gray-400">
                          #{roomData.currentIndex + index + 2}
                        </p>
                        <p className="font-semibold truncate">{video.title}</p>
                        {video.author && (
                          <p className="text-xs text-gray-400 truncate">
                            {video.author}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Queue count */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">
                {roomData.currentIndex + 1} / {roomData.queue.length} เพลง
                {roomData.queue.length > roomData.currentIndex + 4 &&
                  ` (เหลืออีก ${roomData.queue.length - roomData.currentIndex - 1} เพลง)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection indicator */}
      <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
        🔗 เชื่อมต่อแล้ว
      </div>
    </div>
  );
};

export default Monitor;
