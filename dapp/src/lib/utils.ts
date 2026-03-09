import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexToBytes(hexString: string): Uint8Array {
  const hex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const normalizedHex = hex.length % 2 === 0 ? hex : "0" + hex;

  const bytes = new Uint8Array(normalizedHex.length / 2);
  for (let i = 0; i < normalizedHex.length; i += 2) {
    bytes[i / 2] = parseInt(normalizedHex.substring(i, i + 2), 16);
  }
  return bytes;
}