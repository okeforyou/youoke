import { useLocalStorageValue } from "@react-hookz/web";

export function useListSingerState() {
  const { value: tagId, set: setTagId } = useLocalStorageValue("tagId", {
    defaultValue: "3oLUwlQTdzsCkTK72wCbv9", // Top 50 - Thailand (Working)
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
