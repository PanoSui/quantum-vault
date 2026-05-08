import { env } from "@/config/env";

export const PACKAGE_ID = env.VITE_PACKAGE_ID;
export const WORLD_PACKAGE_ID = env.VITE_EVE_WORLD_PACKAGE_ID;
export const ORIGINAL_WORLD_PACKAGE_ID = env.VITE_ORIGINAL_PACKAGE_ID;
export const CHARACTER_TYPE = `${env.VITE_ORIGINAL_PACKAGE_ID}::character::Character`;
export const TURRET_TYPE = `${env.VITE_ORIGINAL_PACKAGE_ID}::turret::Turret`;
export const QUANTUM_COIN_TYPE = `${PACKAGE_ID}::quantum::QUANTUM`;
export const TENANT = "dev";
