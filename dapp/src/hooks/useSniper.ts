import {useCurrentAccount, useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
  PACKAGE_ID,
} from "@/constants/contracts";
import {env} from "@/config/env.ts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";

export function useSnipe() {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const {character} = useMyCharacter();

  return useMutation({
    mutationFn: async (characterId: string) => {
      if (!character) {
        return
      }

      const transaction = new Transaction();

      transaction.moveCall({
        target: `${PACKAGE_ID}::sniper_turret::snipe`,
        arguments: [
          transaction.object(env.VITE_SNIPER_REGISTRY),
          transaction.object(characterId),
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
    },
    onError: (error) => {
      console.error("Failed to snipe character:", error);
    },
  });
}

export function useUnsnipe() {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const {character} = useMyCharacter();

  return useMutation({
    mutationFn: async (characterId: string) => {
      if (!character) {
        return
      }

      const transaction = new Transaction();

      transaction.moveCall({
        target: `${PACKAGE_ID}::sniper_turret::unsnipe`,
        arguments: [
          transaction.object(env.VITE_SNIPER_REGISTRY),
          transaction.object(characterId),
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
    },
    onError: (error) => {
      console.error("Failed to unsnipe character:", error);
    },
  });
}
