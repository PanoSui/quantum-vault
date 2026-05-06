import {useCurrentAccount} from "@mysten/dapp-kit-react";
import { getCharacterAndOwnedObjects } from "@evefrontier/dapp-kit";
import {queryKeys} from "@/constants/queryKeys";
import { useQuery } from "@tanstack/react-query";
import {Character} from "@/types/character.ts";


export function useMyCharacter() {
  const account = useCurrentAccount();

  return useQuery({
    queryKey: queryKeys.myCharacter,
    queryFn: async (): Promise<Character> => {
      const res = await getCharacterAndOwnedObjects("0x29938ce12b89f42b69ba86a38df6deb73cec8de237130bd20d8a3e14f01fb98d")
      // TODO: Uncomment
      // const res = await getCharacterAndOwnedObjects(account!.address)
      const car = res.data?.address.objects.nodes[0].contents.extract.asAddress.asObject?.asMoveObject?.contents.json
      return car as unknown as Character;
    },
    enabled: !!account,
    // staleTime: 10000
  });
}
