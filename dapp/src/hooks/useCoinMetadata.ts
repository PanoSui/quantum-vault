import { useCurrentClient } from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";

export function useCoinMetadata({ coinType }: { coinType: string }) {
  const client = useCurrentClient();

  return useQuery({
    queryKey: queryKeys.coinMetadata.detail(coinType),
    queryFn: async () => {
      const { coinMetadata } = await client.getCoinMetadata({ coinType });
      return coinMetadata;
    },
    enabled: !!coinType,
    staleTime: Infinity,
  });
}
