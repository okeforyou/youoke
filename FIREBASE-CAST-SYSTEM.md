# Firebase Cast System Documentation

## Overview

YouOke's Firebase Cast System is a custom implementation of remote-controlled karaoke playback using Firebase Realtime Database. This system allows users to control a TV/Monitor display from their mobile devices using a simple 4-digit room code.

**Key Features:**
- ✅ Real-time synchronization using Firebase
- ✅ Command Pattern architecture
- ✅ Mobile-first remote control
- ✅ Auto-play queue management
- ✅ Dynamic multi-domain support
- ✅ Backup manual controls on Monitor

---

## Architecture

### Command Pattern Design

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Remote    │         │   Firebase   │         │   Monitor    │
│  (Controller)│────────▶│   Commands   │────────▶│   (Player)   │
│              │  Write  │   Database   │  Read   │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                                                   │
       │                                                   │
       │                 ┌──────────────┐                │
       └────────────────▶│   Firebase   │◀───────────────┘
            Read          │     State    │   Write
                          │   Database   │
                          └──────────────┘
```

**Roles:**
- **Remote (Controller):** Sends commands (write-only to `/commands`), reads state (read-only from `/state`)
- **Monitor (Player):** Executes commands (read `/commands`, write `/state`), controls YouTube player
- **Firebase:** Central hub for command passing and state synchronization

---

## Database Structure

### Firebase Realtime Database Schema

```json
{
  "rooms": {
    "1234": {  // 4-digit room code
      "hostId": "user123",
      "isHost": true,
      "createdAt": 1234567890,

      "state": {
        "queue": [
          {
            "videoId": "dQw4w9WgXcQ",
            "title": "Rick Astley - Never Gonna Give You Up",
            "author": "Rick Astley",
            "key": 1234567890
          }
        ],
        "currentIndex": 0,
        "currentVideo": { /* same structure as queue item */ },
        "controls": {
          "isPlaying": true,
          "isMuted": true
        },
        "lastConnected": 1234567890  // Timestamp for connection tracking
      },

      "commands": {
        "cmd_1234567890_abc123": {
          "id": "cmd_1234567890_abc123",
          "command": {
            "type": "PLAY_NOW",
            "payload": { /* video data */ }
          },
          "status": "pending",  // pending | executing | completed | failed
          "timestamp": 1234567890,
          "from": "remote"
        }
      },

      "participants": {
        "user123": true
      }
    }
  }
}
```

---

## Command Types

### Available Commands

```typescript
type CastCommand =
  | { type: 'CONNECT'; payload: null }
  | { type: 'PLAY_NOW'; payload: { video: QueueVideo } }
  | { type: 'ADD_TO_QUEUE'; payload: { video: QueueVideo } }
  | { type: 'PLAY_NEXT'; payload: { video: QueueVideo } }
  | { type: 'PLAY'; payload: null }
  | { type: 'PAUSE'; payload: null }
  | { type: 'NEXT'; payload: null }
  | { type: 'PREVIOUS'; payload: null }
  | { type: 'SKIP_TO'; payload: { index: number } }
  | { type: 'MUTE'; payload: null }
  | { type: 'UNMUTE'; payload: null }
  | { type: 'TOGGLE_MUTE'; payload: null }
  | { type: 'REMOVE_AT'; payload: { index: number } }
  | { type: 'MOVE_UP'; payload: { index: number } }
  | { type: 'MOVE_DOWN'; payload: { index: number } }
  | { type: 'CLEAR_QUEUE'; payload: null }
  | { type: 'SET_PLAYLIST'; payload: { playlist: QueueVideo[] } };
```

---

## How It Works

### 1. **Room Creation & Connection**

**Monitor Page** (`/monitor`):
1. Opens page → Auto-generates random 4-digit room code (0000-9999)
2. Creates room in Firebase with initial state
3. Displays QR code + room code on screen
4. Waits for Remote to connect

**Remote (Mobile/Desktop):**
1. User scans QR code or manually enters room code
2. Remote joins room via `joinRoom(code)`
3. Sends `CONNECT` command to notify Monitor
4. Monitor detects connection via `lastConnected` timestamp

### 2. **Command Flow**

**Remote sends command:**
```typescript
// Remote: Add song to queue
const queueVideo: QueueVideo = {
  videoId: "dQw4w9WgXcQ",
  title: "Never Gonna Give You Up",
  author: "Rick Astley",
  key: Date.now()
};

sendCommand(roomCode, {
  type: 'ADD_TO_QUEUE',
  payload: { video: queueVideo }
});
```

**Monitor receives & executes:**
```typescript
// Monitor: Listen to commands
useEffect(() => {
  const pollInterval = setInterval(async () => {
    // Fetch commands from Firebase
    const commands = await fetchCommands(roomCode);

    // Execute pending commands
    for (const cmd of commands) {
      if (cmd.status === 'pending') {
        await executeCommand(cmd);
        markCommandCompleted(cmd.id);
      }
    }
  }, 1000); // Poll every 1 second

  return () => clearInterval(pollInterval);
}, [roomCode]);
```

### 3. **State Synchronization**

**Monitor updates state:**
```typescript
// Monitor: Update state after executing command
const newState = {
  queue: [...currentQueue, newVideo],
  currentIndex: 0,
  currentVideo: queue[0],
  controls: { isPlaying: true, isMuted: true }
};

await updateState(roomCode, newState);
```

**Remote reads state:**
```typescript
// Remote: Poll state for UI updates
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const state = await fetchState(roomCode);
    setState(state);
  }, 500); // Poll every 500ms (faster than Monitor)

  return () => clearInterval(pollInterval);
}, [roomCode]);
```

---

## Key Files

### Core Implementation

| File | Purpose |
|------|---------|
| `pages/monitor.tsx` | TV display - receives commands, controls YouTube player |
| `components/YoutubePlayer.tsx` | Remote controller - sends commands, displays state |
| `context/FirebaseCastContext.tsx` | State management for Remote |
| `types/castCommands.ts` | TypeScript type definitions |
| `utils/castCommands.ts` | Command sending utilities |

### Important Functions

**`sendCommand(roomCode, command, from?)`**
- Sends command to Firebase via REST API
- Used by Remote to control Monitor
- Returns command ID

**`executeCommand(envelope)`**
- Monitor executes command based on type
- Updates YouTube player state
- Updates Firebase state

---

## Technical Details

### REST API Instead of Firebase SDK

**Problem:** Firebase SDK caused stack overflow errors in production.

**Solution:** Use Firebase REST API directly for all operations.

```typescript
// ❌ OLD (Firebase SDK - causes stack overflow)
import { ref, set } from 'firebase/database';
await set(ref(realtimeDb, `rooms/${roomCode}`), data);

// ✅ NEW (REST API - works perfectly)
const dbURL = realtimeDb.app.options.databaseURL;
const token = await user.getIdToken();
await fetch(`${dbURL}/rooms/${roomCode}.json?auth=${token}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### Browser Autoplay Policy

**Problem:** Browsers block auto-playing audio without user interaction.

**Solution:** Require user to click screen before enabling sound.

```typescript
// Monitor: Show overlay until user clicks
{!hasUserInteraction && (
  <div onClick={() => {
    setHasUserInteraction(true);
    player.unMute();
  }}>
    <DevicePhoneMobileIcon /> → <TvIcon />
    <h2>กดเพื่อเริ่มใช้งาน</h2>
  </div>
)}
```

### Queue Visibility Logic

**Smart Display Rules:**
- ✅ Show at video start (first 15 seconds)
- ✅ Show at video end (last 60 seconds)
- ✅ Show for 10 seconds when song added/removed
- ❌ Hide during middle of song

```typescript
// Time-based visibility
const showAtStart = currentTime < 15;
const showAtEnd = remaining < 60;
setShowQueue(showAtStart || showAtEnd);

// Show on queue changes
if (currentLength !== previousLength) {
  setShowQueue(true);
  setTimeout(() => {}, 10000); // Hide after 10s
}
```

### Connection Detection

**Previous Method:** Check if queue has songs → unreliable

**New Method:** Use CONNECT command + lastConnected timestamp

```typescript
// Remote: Send CONNECT on join
sendCommand(code, { type: 'CONNECT', payload: null });

// Monitor: Detect connection
const hasConnected = !!(state.lastConnected) || queueData.length > 0;
setIsConnected(hasConnected);
```

---

## Deployment

### Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Database Rules

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "auth != null",
        "commands": {
          ".indexOn": ["timestamp", "status"]
        }
      }
    }
  }
}
```

### Vercel Deployment

1. Push to GitHub
2. Vercel auto-deploys from `main` branch
3. Environment variables configured in Vercel dashboard
4. Domain: `youoke.vercel.app`, `play.okeforyou.com`

---

## Usage Guide

### For Karaoke Shop Owners

1. **Setup Monitor:**
   - Open `youoke.vercel.app/monitor` on TV/large screen
   - Room code displays automatically
   - Leave browser open

2. **Customer Usage:**
   - Customer scans QR code or visits website
   - Enters 4-digit room code
   - Searches and adds songs
   - Songs play automatically on TV

3. **Manual Controls:**
   - Move mouse to show control buttons
   - Play/Pause, Next, Previous, Mute
   - Buttons auto-hide after 3 seconds

### For Developers

**Run Locally:**
```bash
npm install
npm run dev
# Open localhost:3000/monitor on one tab
# Open localhost:3000 on another tab
# Connect using room code
```

**Test Cast System:**
1. Open `/monitor` → Get room code
2. Open `/` → Click "Cast to TV" → Enter room code
3. Add songs → Observe real-time sync
4. Test controls → Verify command execution

---

## Troubleshooting

### Common Issues

**1. Connection not detected:**
- Check Firebase rules (read/write permissions)
- Verify `CONNECT` command is sent
- Check `lastConnected` timestamp in database

**2. Commands not executing:**
- Verify Monitor is polling commands (check console)
- Check command status in Firebase (pending/completed)
- Ensure auth token is valid

**3. Audio not playing:**
- User must click screen first (browser policy)
- Check if video is muted in Firebase state
- Verify YouTube player is ready

**4. Stack overflow errors:**
- Use REST API instead of Firebase SDK
- Avoid nested `set()` calls
- Use `PATCH` for partial updates

---

## Future Improvements

### Planned Features
- [ ] Multi-room support (multiple monitors)
- [ ] Voice control integration
- [ ] Lyrics display
- [ ] Song history tracking
- [ ] User favorites sync
- [ ] MIDI file support (see ROADMAP-MIDI.md)

### Phase 2: Multi-User Features (Estimated: 2-3 hours)

**Goal:** Allow multiple people to join the same room and see who added which songs.

**Features:**
- [ ] **Guest Mode** - Allow non-logged-in users to join by entering their name
- [ ] **Show Song Owner** - Display who added each song in the queue
- [ ] **Owner Controls** - Host can delete songs added by others
- [ ] **Share Link** - Generate shareable link instead of manual room code entry
- [ ] **Participant List** - Show all users currently in the room

**Data Structure Changes:**
```typescript
interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
  addedBy?: {
    uid: string;           // User ID or guest ID
    displayName: string;   // User's name or guest name
    isGuest: boolean;      // true if not logged in
  };
}
```

**Implementation Tasks:**
1. Add guest name input on join (for non-logged-in users)
2. Update `addToQueue()` to include `addedBy` field
3. Update Queue Display UI to show who added each song
4. Add "Remove" button (visible only to host) next to each song
5. Generate shareable link: `youoke.vercel.app/?castRoom=1234`
6. Add participant list overlay (optional)

**UI Mockup:**
```
┌─────────────────────────────┐
│ คิวถัดไป (3 เพลง)           │
├─────────────────────────────┤
│ 1. Never Gonna Give You Up  │
│    โดย: John (Guest)    [×] │  ← Host can remove
│                              │
│ 2. Bohemian Rhapsody        │
│    โดย: user@example.com    │
│                              │
│ 3. Hotel California         │
│    โดย: Alice (Guest)   [×] │
└─────────────────────────────┘
```

### Performance Optimizations
- [ ] Reduce polling frequency when idle
- [ ] Implement WebSocket for real-time updates
- [ ] Add command debouncing
- [ ] Cache frequently played songs

---

## Credits

Built with:
- **Next.js** - React framework
- **Firebase** - Realtime database
- **YouTube IFrame API** - Video playback
- **Tailwind CSS** - Styling
- **Heroicons** - Icons

---

## Support

For issues or questions:
- GitHub: https://github.com/okeforyou/youoke
- Vercel: https://youoke.vercel.app
- Email: support@okeforyou.com

---

**Last Updated:** 2025-01-24 (Phase 2 roadmap added)
**Version:** 1.0.0
**Status:** Production Ready ✅
