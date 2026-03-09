import {useCurrentAccount, useCurrentClient} from "@mysten/dapp-kit-react";
import {useQuery} from "@tanstack/react-query";
import {queryKeys} from "@/constants/queryKeys";

export function useSuiBalance() {
    const account = useCurrentAccount();
    const client = useCurrentClient();

    const {data, isPending, error} = useQuery({
        queryKey: queryKeys.suiBalance(account?.address ?? ""),
        queryFn: async () => {
            const balance = await client.getBalance({
                owner: account!.address,
                coinType: "0x2::sui::SUI",
            });
            return balance.balance;
        },
        enabled: !!account?.address,
    });

    const balance = Number(data?.coinBalance || "0") / 1_000_000_000

    return {
        balance,
        formattedBalance: balance.toFixed(4),
        isPending,
        error,
    };
}
