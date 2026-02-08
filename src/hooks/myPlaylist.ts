import { useLocalStorageValue } from "@react-hookz/web";

export function useMyPlaylistState(): { myPlaylist: any[]; setMyPlaylist: (v: any[]) => void } {
  const { value: myPlaylist, set: setMyPlaylist } = useLocalStorageValue<any[]>(
    "myPlaylist",
    { defaultValue: [] }
  );

  return {
    myPlaylist: myPlaylist || [],
    setMyPlaylist,
  };
}
