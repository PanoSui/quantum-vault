import {useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
    ORIGINAL_WORLD_PACKAGE_ID,
    WORLD_PACKAGE_ID,
} from "@/constants/contracts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";
import {Turret} from "@/types/turret.ts";
import {env} from "@/config/env.ts";
import {useNetworkNode} from "@/hooks/useNetworkNode.ts";
import {sleep} from "@/lib/utils.ts";


function buildOnlineOfflineTx(tx: Transaction, characterId: string, turret: Turret, networkNodeId: string) {
    const [ownerCap, receipt] = tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
        typeArguments: [`${ORIGINAL_WORLD_PACKAGE_ID}::turret::Turret`],
        arguments: [tx.object(characterId), tx.object(turret.owner_cap_id)],
    });

    const action = turret.status.status["@variant"].toLowerCase() === 'online' ? 'offline' : 'online'

    tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::turret::${action}`,
        arguments: [
            tx.object(turret.id),
            tx.object(networkNodeId),
            tx.object(env.VITE_ENERGY_CONFIG),
            ownerCap
        ],
    });

    tx.moveCall({
        target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
        typeArguments: [`${ORIGINAL_WORLD_PACKAGE_ID}::turret::Turret`],
        arguments: [tx.object(characterId), ownerCap, receipt],
    });
}

export function useOnlineOffline() {
    const dAppKit = useDAppKit();
    const client = useCurrentClient();
    const queryClient = useQueryClient();
    const {data: networkNode} = useNetworkNode();
    const {data: character} = useMyCharacter();

    return useMutation({
        mutationFn: async (turret: Turret) => {
            if (!character) return
            if (!networkNode) return

            const tx = new Transaction();

            buildOnlineOfflineTx(tx, character.id, turret, networkNode.id);

            const result = await dAppKit.signAndExecuteTransaction({
                transaction: tx,
            });

            await client.waitForTransaction({ result });

            return result;
        },
        onSuccess: async (_data) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.turrets.list(),
            });
        },
        onError: (error) => {
            console.error("Failed to online/offline turret:", error);
        },
    });
}

export function useManyOnlineOffline() {
    const dAppKit = useDAppKit();
    const client = useCurrentClient();
    const queryClient = useQueryClient();
    const {data: networkNode} = useNetworkNode();
    const {data: character} = useMyCharacter();

    return useMutation({
        mutationFn: async (turrets: Turret[]) => {
            if (!character) return
            if (!networkNode) return

            const tx = new Transaction();

            turrets.forEach(turret => {
                buildOnlineOfflineTx(tx, character.id, turret, networkNode.id)
            })

            const result = await dAppKit.signAndExecuteTransaction({
                transaction: tx,
            });

            await client.waitForTransaction({ result });

            return result;
        },
        onSuccess: async (_data) => {
            await sleep(2000)
            await queryClient.invalidateQueries({
                queryKey: queryKeys.turrets.list(),
            });
        },
        onError: (error) => {
            console.error("Failed to online/offline turret:", error);
        },
    });
}