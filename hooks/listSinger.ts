import { useLocalStorageValue } from "@react-hookz/web";

export function useListSingerState() {
  const { value: tagId, set: setTagId } = useLocalStorageValue("tagId", {
    defaultValue: "37i9dQZEVXbMnz8KIWsvf9", // Top 50 - Thailand (2025)
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
