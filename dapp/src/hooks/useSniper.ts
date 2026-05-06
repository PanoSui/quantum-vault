import { useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
  PACKAGE_ID,
} from "@/constants/contracts";
import {env} from "@/config/env.ts";
import type {SuiGraphQLClient} from "@mysten/sui/graphql";
import {Character} from "@/types/character.ts";

export function useSnipe() {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (character: Character) => {
      const transaction = new Transaction();

      console.log(character);
      
      transaction.moveCall({
        target: `${PACKAGE_ID}::sniper_turret::snipe`,
        arguments: [
          transaction.object(env.VITE_SNIPER_REGISTRY),
          transaction.object(character.id),
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
        queryKey: queryKeys.sniper.target(),
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${PACKAGE_ID}::sniper_turret::unsnipe`,
        arguments: [
          transaction.object(env.VITE_SNIPER_REGISTRY),
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
        queryKey: queryKeys.sniper.target(),
      });
    },
    onError: (error) => {
      console.error("Failed to unsnipe character:", error);
    },
  });
}

export function useSniperTarget() {
  const client = useCurrentClient() as SuiGraphQLClient;

  return useQuery({
    queryKey: queryKeys.sniper.target(),
    queryFn: async () => {
      const object = await client.getObject({
        objectId: env.VITE_SNIPER_REGISTRY,
        include: {
          json: true
        }
      })

      return (object.object.json as any).target.toString()
    },
  });
}
