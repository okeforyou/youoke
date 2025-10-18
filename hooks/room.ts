import { useLocalStorageValue } from "@react-hookz/web";

import { generateRandomString } from "../utils/random";

export function useRoomState() {
  const { value: room, set: setRoom } = useLocalStorageValue("room", {
    defaultValue: generateRandomString(6),
  });

  return {
    room,
    setRoom,
  };
}
