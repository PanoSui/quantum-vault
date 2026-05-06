import {useCurrentAccount} from "@mysten/dapp-kit-react";
import { getCharacterOwnedObjects, CharacterInfo, parseCharacterFromJson } from "@evefrontier/dapp-kit";
import {queryKeys} from "@/constants/queryKeys";
import { useQuery } from "@tanstack/react-query";


export function useMyCharacter() {
  const account = useCurrentAccount();

  return useQuery({
    queryKey: queryKeys.myCharacter,
    queryFn: async (): Promise<CharacterInfo | null | undefined> => {
      const res = await getCharacterOwnedObjects("0x29938ce12b89f42b69ba86a38df6deb73cec8de237130bd20d8a3e14f01fb98d")
      // TODO: Uncomment
      // const res = await getCharacterOwnedObjects(account!.address)
      return res && parseCharacterFromJson(res[0]);
    },
    enabled: !!account,
    // staleTime: 10000
  });
}
