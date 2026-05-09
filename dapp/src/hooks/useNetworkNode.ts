import {getCharacterOwnedObjects, SmartAssemblyResponse} from "@evefrontier/dapp-kit";
import {useCurrentAccount} from "@mysten/dapp-kit-react";
import {useQuery} from "@tanstack/react-query";
import {queryKeys} from "@/constants/queryKeys.ts";

export function useNetworkNode() {
    const currentAccount = useCurrentAccount();

    return useQuery({
        queryKey: queryKeys.networkNodes.list(currentAccount?.address ?? ""),
        queryFn: async (): Promise<SmartAssemblyResponse | undefined> => {
            const ts = await getCharacterOwnedObjects(currentAccount!.address)
            return ts?.find((t: any) => t.type_id === "88092") as unknown as SmartAssemblyResponse
        },
        enabled: !!currentAccount,
    });
}
