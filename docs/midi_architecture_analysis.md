# MIDI Integration & Universal Player Architecture Analysis

## 🎯 Objective
To integrate MIDI Karaoke support into play.youoke while maintaining the "Premium" and "Easy-to-use" philosophy of the application. The goal is to determine the best UX pattern for users who want to sing, regardless of the song's format (YouTube Video or MIDI File).

## 🧩 Approaches

### Option A: split Modes (YouTube Mode vs MIDI Mode)
**Concept**: The app has a switch or separate page for MIDI.

**Workflow**: User goes to "MIDI Player" page -> Uploads/Selects MIDI -> Plays.
*   **Pros**:
    *   Easiest to implement. Zero risk of breaking existing YouTube player.
    *   Clear distinction of capabilities (MIDI allows key change/mute channels, YouTube does not).
*   **Cons**:
    *   High Friction: Users have to "decide" where to search. "Is 'Zombie' in my MIDI folder or YouTube?"
    *   Fragmented UX: Queuing a YouTube song after a MIDI song is impossible or difficult.
    *   Not "Premium": Feels like two different apps glued together.

### Option B: Unified "Universal" Library (Recommended) ✅
**Concept**: A single "Search" and "Playlist" that handles Music, not file formats.

**Workflow**: User searches "Zombie". Results show:
*   📺 Zombie - The Cranberries (YouTube)
*   🎹 Zombie - The Cranberries (MIDI)

*   **Pros**:
    *   **Seamless**: User just clicks "Play". The app handles the rest.
    *   **Mixed Queue**: Can queue a YouTube song, then a MIDI song, then a YouTube song.
    *   **Premium Feel**: The technology fades away; only the music remains.
*   **Cons**:
    *   **Complex Implementation**: Requires a UniversalPlayer abstraction that switches engines instantly.
    *   **Metadata Sync**: Need to index MIDI files into a searchable local database (IndexedDB) to appear in global search.

## 🏗 Technical Architecture for Option B (Unified)
To achieve the Unified experience, we need to refactor the core Audio/Video engine:

### 1. New Component: `<UniversalPlayer />`
Instead of `SidebarPlayer` directly using react-youtube, it will become a container:

```tsx
export const UniversalPlayer = () => {
  const { currentVideo } = usePlayerStore();
  
  if (currentVideo.sourceType === 'midi') {
     return <MidiCanvasRenderer songData={currentVideo.data} />;
  }
  
  return <YouTubePlayer videoId={currentVideo.id} />;
}
```

### 2. Global Audio Context (`MidiEngineContext`)
YouTube handles its own audio. For MIDI, we need a global browser-based synthesizer (SoundFont Player).

*   **Challenge**: MIDI sound must persist even if the visual canvas is hidden (e.g., navigating menus).
*   **Solution**: A background context handles the Audio (Synth), while the Visuals (Lyrics) are rendered only when the Player is visible.

### 3. Database & Search (IndexedDB)
Since MIDI files are local (or uploaded to cloud later), we cannot search them via YouTube API.

*   We need a local **Dexie.js** (IndexedDB) instance.
*   When user imports a folder/file, we parse metadata (Title, Artist) and save it to Dexie.
*   **Global Search**: Queries both YouTube Data API + Local Dexie DB and merges results.

## 🚀 Recommended Roadmap

### Phase 1: Foundation (The Engine)
*   Create `MidiEngineContext` (Audio logic).
*   Create `MidiCanvasRenderer` (Visual logic).
*   Test simply in a hidden "Lab" page to ensure it works.

### Phase 2: The Universal Player
*   Refactor `SidebarPlayer` to accept a "Source Type".
*   Integrate the MIDI Engine into the main sidebar.

### Phase 3: The Library (Indexing)
*   Build the "Import MIDI" flow.
*   Index files into IndexedDB.
*   Update `ListPlaylistsGrid` or Search to show local results.

## 💡 Recommendation
Go with **Option B (Unified)**. Although it requires more initial setup (Indexing & Player abstraction), it enables the "Premium" experience you want. A karaoke system where you can't mix-and-match sources feels dated. The "Universal" approach positions youoke as a modern, professional-grade platform.
