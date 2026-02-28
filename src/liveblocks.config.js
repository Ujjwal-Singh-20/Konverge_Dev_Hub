import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
    publicApiKey: "pk_dev_oK7rj5GMU1GzBLz08-ZMhKJ-AauTBMbzJSZRFXViB3DiqzVC8T2gooNEv_Ww8z0e", // In a real app, use an environment variable
});

// Presence represents the properties that will be kept in sync for each person in the room.
// In Monaco, we'll sync the cursor position.
export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useStorage,
    useMutation,
    useSelf,
} = createRoomContext(client);
