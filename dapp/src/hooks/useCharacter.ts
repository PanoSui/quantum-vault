import {useCurrentAccount} from "@mysten/dapp-kit-react";
import {
  getCharacterOwnedObjects,
  CharacterInfo,
  parseCharacterFromJson,
} from "@evefrontier/dapp-kit";
import {queryKeys} from "@/constants/queryKeys";
import { useQuery } from "@tanstack/react-query";


export function useMyCharacter() {
  const account = useCurrentAccount();

  return useQuery({
    queryKey: queryKeys.myCharacter,
    queryFn: async (): Promise<CharacterInfo | null | undefined> => {
      const res = await getCharacterOwnedObjects(account!.address)
      const car = res?.find((c) => c.character_address)
      return car && parseCharacterFromJson(car);
    },
    enabled: !!account,
    staleTime: 10000
  });
}
