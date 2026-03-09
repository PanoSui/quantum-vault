import {useCurrentAccount, useCurrentClient} from "@mysten/dapp-kit-react";
import {useQuery} from "@tanstack/react-query";
import {QUANTUM_COIN_TYPE} from "@/constants/contracts";
import {queryKeys} from "@/constants/queryKeys";
import {useQuantumMetadata} from "@/hooks/useQuantumMetadata";
import {formatBalance} from "@/lib/format.ts";

export function useQuantumBalance() {
    const account = useCurrentAccount();
    const client = useCurrentClient();
    const {data: quantumMetadata} = useQuantumMetadata();

    const {data, isPending, error} = useQuery({
        queryKey: queryKeys.quantumBalance(account?.address ?? ""),
        queryFn: async () => {
            const balance = await client.getBalance({
                owner: account!.address,
                coinType: QUANTUM_COIN_TYPE,
            });
            return balance.balance;
        },
        enabled: !!account?.address && !!quantumMetadata,
    });

    return {
        balance: data?.coinBalance || "0",
        formattedBalance: formatBalance({
            rawBalance: data?.coinBalance || "0",
            decimals: quantumMetadata?.decimals || 6
        }),
        isPending,
        error,
    };
}
