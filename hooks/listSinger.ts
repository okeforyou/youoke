import { useLocalStorageValue } from "@react-hookz/web";

export function useListSingerState() {
  const { value: tagId, set: setTagId } = useLocalStorageValue("tagId", {
    defaultValue: "37i9dQZF1DWW1S2VXZ4bIj",
  });

  const { value: genreText, set: setGenreText } = useLocalStorageValue(
    "genreText",
    {
      defaultValue: "เพลงฮิตไทย",
    }
  );

  return {
    tagId,
    genreText,
    setTagId,
    setGenreText,
  };
}
