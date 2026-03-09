import {useCurrentAccount, useCurrentClient, useDAppKit} from "@mysten/dapp-kit-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { queryKeys } from "@/constants/queryKeys";
import {
  PACKAGE_ID,
} from "@/constants/contracts";
import {env} from "@/config/env.ts";

export function useBuyQuantum() {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      const transaction = new Transaction();

      const amountInMist = BigInt(Math.floor(Number(amount) * 1_000_000_000));

      transaction.moveCall({
        target: `${PACKAGE_ID}::quantum::buy`,
        arguments: [
          transaction.object(env.VITE_QUANTUM_TREASURY_ID),
          coinWithBalance({ type: '0x2::sui::SUI', balance: amountInMist }),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({
        transaction,
      });

      await client.waitForTransaction({ result });

      return result;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quantumBalance(account?.address || ""),
      });
    },
    onError: (error) => {
      console.error("Failed to buy quantums:", error);
    },
  });
}
