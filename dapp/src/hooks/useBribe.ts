import {useCurrentAccount, useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
  PACKAGE_ID,
  QUANTUM_COIN_TYPE,
} from "@/constants/contracts";
import {useQuantumMetadata} from "@/hooks/useQuantumMetadata.ts";
import {env} from "@/config/env.ts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";

interface BribeVariables {
  turretId: string;
  days: bigint;
}

export function useBribe() {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const {data: quantumMetadata} = useQuantumMetadata();
  const {character} = useMyCharacter();

  return useMutation({
    mutationFn: async ({
      turretId,
      days,
    }: BribeVariables) => {
      if (!character) {
        return
      }

      const transaction = new Transaction();

      const amount = days * 2n * 10n ** BigInt(quantumMetadata?.decimals || 6)

      transaction.moveCall({
        target: `${PACKAGE_ID}::quantum_turret::bribe_turret`,
        arguments: [
          transaction.object(env.VITE_BRIBE_REGISTRY),
          transaction.object(turretId),
          transaction.object(character.id),
          coinWithBalance({ type: QUANTUM_COIN_TYPE, balance: amount }),
          transaction.pure.u64(days)
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({
        transaction,
      });

      await client.waitForTransaction({ result });

      return result;
    },
    onSuccess: async (_data) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.turrets.list(account?.address || ""),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.quantumBalance(account?.address || ""),
      });
    },
    onError: (error) => {
      console.error("Failed to bribe turret:", error);
    },
  });
}
