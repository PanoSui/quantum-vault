import {bcs} from "@mysten/sui/bcs";
import {hexToBytes} from "@/lib/utils.ts";

const LOCATION_HASH = '0x16217de8ec7330ec3eac32831df5c9cd9b21a255756a5fd5762dd7f49f6cc049'

export function useLocationHash() {
    return bcs.vector(bcs.u8()).serialize(hexToBytes(LOCATION_HASH))
}
