import {useCoinMetadata} from "@/hooks/useCoinMetadata";
import {QUANTUM_COIN_TYPE} from "@/constants/contracts.ts";

export function useQuantumMetadata() {
  return useCoinMetadata({
    coinType: QUANTUM_COIN_TYPE
  });
}
