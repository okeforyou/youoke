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
    searchTerm,
    isKaraoke,
    activeIndex,
    setPlaylist,
    setCurVideoId,
    setSearchTerm,
    setIsKaraoke,
    setActiveIndex,
  };
}
