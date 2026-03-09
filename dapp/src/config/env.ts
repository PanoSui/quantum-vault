import { z } from "zod";

const envSchema = z.object({
  VITE_SUI_NETWORK: z.enum(["mainnet", "testnet", "devnet"]),
  VITE_PACKAGE_ID: z.string().startsWith("0x"),
  VITE_QUANTUM_TREASURY_ID: z.string().startsWith("0x"),
  VITE_BRIBE_REGISTRY: z.string().startsWith("0x"),
  VITE_WORLD_PACKAGE_ID: z.string().startsWith("0x"),
  VITE_OBJECT_REGISTRY: z.string().startsWith("0x"),
  VITE_ADMIN_ACL: z.string().startsWith("0x"),
  VITE_ENERGY_CONFIG: z.string().startsWith("0x"),
  VITE_SUI_GRAPHQL_URL: z.string().url(),
  VITE_WALRUS_AGGREGATOR_URL: z.string().url(),
  VITE_WALRUS_UPLOAD_RELAY_URL: z.string().url(),
  VITE_SUIVISION_URL: z.string().url(),
  VITE_WALRUSCAN_URL: z.string().url(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
  );
}

export const env = parsed.data;
