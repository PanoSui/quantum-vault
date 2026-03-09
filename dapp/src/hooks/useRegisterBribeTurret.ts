import {useCurrentAccount, useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
    PACKAGE_ID, WORLD_PACKAGE_ID,
} from "@/constants/contracts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";
import {Turret} from "@/types/turret.ts";


export function useRegisterBribeTurret() {
    const dAppKit = useDAppKit();
    const client = useCurrentClient();
    const account = useCurrentAccount();
    const queryClient = useQueryClient();
    const {character} = useMyCharacter();

    return useMutation({
        mutationFn: async (turret: Turret) => {
            if (!character) {
                return
            }

            const tx = new Transaction();

            const [ownerCap, receipt] = tx.moveCall({
                target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
                typeArguments: [`${WORLD_PACKAGE_ID}::turret::Turret`],
                arguments: [tx.object(character.id), tx.object(turret.owner_cap_id)],
            });

            tx.moveCall({
                target: `${WORLD_PACKAGE_ID}::turret::authorize_extension`,
                typeArguments: [`${PACKAGE_ID}::quantum_turret::QuantumTurretAuth`],
                arguments: [tx.object(turret.id), ownerCap],
            });

            tx.moveCall({
                target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
                typeArguments: [`${WORLD_PACKAGE_ID}::turret::Turret`],
                arguments: [tx.object(character.id), ownerCap, receipt],
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
            console.error("Failed to bribe turret:", error);
        },
    });
}
