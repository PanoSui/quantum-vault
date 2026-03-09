import {deriveObjectId} from "@/lib/derive-object-id.ts";
import {env} from "@/config/env.ts";
import {WORLD_PACKAGE_ID} from "@/constants/contracts.ts";

export function useNetworkNode() {
    return deriveObjectId(
        env.VITE_OBJECT_REGISTRY,
        5550000012n,
        WORLD_PACKAGE_ID
    );
}
