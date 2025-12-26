import { useLocalStorageValue } from '@react-hookz/web'

export function useKaraokeState() {
  const { value: playlist, set: setPlaylist } = useLocalStorageValue(
    "playlist",
    { defaultValue: [] }
  );
  const { value: curVideoId, set: setCurVideoId } = useLocalStorageValue(
    "videoId",
    { defaultValue: "" }
  );

  // Add currentIndex to track position in playlist (instead of removing songs)
  const { value: currentIndex, set: setCurrentIndex } = useLocalStorageValue(
    "currentIndex",
    { defaultValue: 0 }
  );

  const { value: searchTerm, set: setSearchTerm } = useLocalStorageValue(
    "searchTerm",
    { defaultValue: "" }
  );
  const { value: isKaraoke, set: setIsKaraoke } = useLocalStorageValue(
    "isKaraoke",
    { defaultValue: true }
  );
  const { value: activeIndex, set: setActiveIndex } = useLocalStorageValue(
    "bottomNavActiveIndex",
    { defaultValue: 1 } // 1 = แนะนำ (ศิลปิน/นักร้อง)
  );

  return {
    playlist,
    curVideoId,
    currentIndex,
    searchTerm,
    isKaraoke,
    activeIndex,
    setPlaylist,
    setCurVideoId,
    setCurrentIndex,
    setSearchTerm,
    setIsKaraoke,
    setActiveIndex,
  };
}
