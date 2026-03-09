import {useCurrentAccount} from "@mysten/dapp-kit-react";
import {useCharacters} from "@/hooks/useCharacters";


export function useMyCharacter() {
  const account = useCurrentAccount();
  const { data, isLoading, error } = useCharacters()

  return {
    character: data?.find((c) => c.character_address === account?.address),
    error,
    isLoading
  };
}
