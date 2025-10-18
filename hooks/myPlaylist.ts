import { useLocalStorageValue } from "@react-hookz/web";

export function useMyPlaylistState() {
  const { value: myPlaylist, set: setMyPlaylist } = useLocalStorageValue(
    "myPlaylist",
    { defaultValue: [] }
  );

  return {
    myPlaylist,
    setMyPlaylist,
  };
}
