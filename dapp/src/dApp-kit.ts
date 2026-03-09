import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { env } from "@/config/env";

export const dAppKit = createDAppKit({
  enableBurnerWallet: import.meta.env.DEV,
  networks: [env.VITE_SUI_NETWORK],
  defaultNetwork: env.VITE_SUI_NETWORK,
  createClient(network) {
    return new SuiGraphQLClient({
      network,
      url: env.VITE_SUI_GRAPHQL_URL,
    });
  },
});

// global type registration necessary for the hooks to work correctly
declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
