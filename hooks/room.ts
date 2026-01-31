import { useLocalStorageValue } from "@react-hookz/web";

import { generateRandomString } from "../utils/random";

export function useRoomState() {
  const { value: room, set: setRoom } = useLocalStorageValue("youoke_room_pin", {
    defaultValue: Math.floor(1000 + Math.random() * 9000).toString(),
  });

  return {
    room,
    setRoom,
  };
}
