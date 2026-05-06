import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import type { GraphQLQueryResult } from "@mysten/sui/graphql";
import { queryKeys } from "@/constants/queryKeys";
import {
    CHARACTER_TYPE,
} from "@/constants/contracts";
import {Turret} from "@/types/turret.ts";
import {CharacterInfo, parseCharacterFromJson} from "@evefrontier/dapp-kit";
import {env} from "@/config/env.ts";
import { SuiGraphQLClient } from "@mysten/sui/graphql";

const CHARACTERS_LOOKUP_QUERY = `
  query Characters($type: String!, $first: Int!, $after: String) {
    objects(
      filter: {
        type: $type
      }
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        asMoveObject {
          contents {
            json
          }
          address
        }
      }
    }
  }
`;

interface CharactersLookupResponse {
    objects: {
        pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
        };
        nodes: Array<{
            address: string;
            asMoveObject: {
                contents: {
                    json: Turret;
                };
            } | null;
        }>;
    };
}

const PAGE_SIZE = 50;
const MAX_PAGES = 1;

async function fetchCharacters(client: SuiGraphQLClient): Promise<CharacterInfo[]> {
    const characters: CharacterInfo[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
        const result: GraphQLQueryResult<CharactersLookupResponse> =
            await client.query({
                query: CHARACTERS_LOOKUP_QUERY,
                variables: {
                    type: CHARACTER_TYPE,
                    first: PAGE_SIZE,
                    after: cursor,
                },
            });

        if (result.errors?.length) {
            continue
            // throw new Error(result.errors.map((e) => e.message).join(", "));
        }

        if (!result.data) break;

        for (const node of result.data.objects.nodes) {
            const car = parseCharacterFromJson(node.asMoveObject?.contents.json)
            if (car) {
                characters.push(car);
            }
        }

        if (!result.data.objects.pageInfo.hasNextPage) break;
        cursor = result.data.objects.pageInfo.endCursor;
    }

    return characters.filter((c) => c);
}

export function useCharacters() {
    const currentAccount = useCurrentAccount();
    // const client = useCurrentClient() as SuiGraphQLClient;
    const client = new SuiGraphQLClient({
        network: env.VITE_SUI_NETWORK,
        url: env.VITE_SUI_GRAPHQL_URL,
    })
    return useQuery({
        queryKey: queryKeys.characters.list(currentAccount?.address ?? ""),
        queryFn: () => fetchCharacters(client),
        enabled: !!currentAccount,
    });
}
