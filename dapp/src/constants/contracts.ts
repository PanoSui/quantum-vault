import { env } from "@/config/env";

export const PACKAGE_ID = env.VITE_PACKAGE_ID;
export const WORLD_PACKAGE_ID = env.VITE_WORLD_PACKAGE_ID;
export const QUANTUM_COIN_TYPE = `${PACKAGE_ID}::quantum::QUANTUM`;
export const TENANT = "dev";
