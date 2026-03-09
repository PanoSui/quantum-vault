import {useCurrentAccount, useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
    WORLD_PACKAGE_ID,
} from "@/constants/contracts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";
import {env} from "@/config/env.ts";
import {useNetworkNode} from "@/hooks/useNetworkNode.ts";
import {useLocationHash} from "@/hooks/useLocation.ts";


export function useAnchorTurret() {
    const dAppKit = useDAppKit();
    const client = useCurrentClient();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const networkNodeId = useNetworkNode();
    const locationHash = useLocationHash();
    const {character} = useMyCharacter();

    return useMutation({
        mutationFn: async () => {
            if (!character) {
                return
            }

            const tx = new Transaction();

            function randomInt(min: number, max: number): number {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            const [turret] = tx.moveCall({
                target: `${WORLD_PACKAGE_ID}::turret::anchor`,
                arguments: [
                    tx.object(env.VITE_OBJECT_REGISTRY),
                    tx.object(networkNodeId),
                    tx.object(character.id),
                    tx.object(env.VITE_ADMIN_ACL),
                    tx.pure.u64(randomInt(1000, 10000000)),
                    tx.pure.u64(5555),
                    tx.pure(locationHash),
                ],
            });

            tx.moveCall({
                target: `${WORLD_PACKAGE_ID}::turret::share_turret`,
                arguments: [turret, tx.object(env.VITE_ADMIN_ACL)],
            });

            const result = await dAppKit.signAndExecuteTransaction({
                transaction: tx,
            });

            await client.waitForTransaction({ result });

            return result;
        },
        onSuccess: async (_data) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.turrets.list(account?.address || ""),
            });
        },
        onError: (error) => {
            console.error("Failed to anchor turret:", error);
        },
    });
}
