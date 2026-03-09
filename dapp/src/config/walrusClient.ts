import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { walrus } from "@mysten/walrus";
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";
import { env } from "@/config/env";

export const walrusAggregatorUrl = env.VITE_WALRUS_AGGREGATOR_URL;

export const walrusClient = new SuiGraphQLClient({
  network: env.VITE_SUI_NETWORK,
  url: env.VITE_SUI_GRAPHQL_URL,
}).$extend(
  walrus({
    wasmUrl: walrusWasmUrl,
    uploadRelay: {
      host: env.VITE_WALRUS_UPLOAD_RELAY_URL,
      sendTip: { max: 1_000 },
    },
  }),
);
