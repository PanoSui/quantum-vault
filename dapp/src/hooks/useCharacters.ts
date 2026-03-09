import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import type { GraphQLQueryResult, SuiGraphQLClient } from "@mysten/sui/graphql";
import { queryKeys } from "@/constants/queryKeys";
import {
    WORLD_PACKAGE_ID,
} from "@/constants/contracts";
import {Character} from "@/types/character.ts";

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
        address
        version
        digest
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
        }>;
    };
}

const PAGE_SIZE = 50;
const MAX_PAGES = 10;

async function fetchCharactersIds(client: SuiGraphQLClient): Promise<string[]> {
    const type = `${WORLD_PACKAGE_ID}::character::Character`;
    const turretIds: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
        const result: GraphQLQueryResult<CharactersLookupResponse> =
            await client.query({
                query: CHARACTERS_LOOKUP_QUERY,
                variables: {
                    type: type,
                    first: PAGE_SIZE,
                    after: cursor,
                },
            });

        if (result.errors?.length) {
            throw new Error(result.errors.map((e) => e.message).join(", "));
        }

        if (!result.data) break;

        for (const node of result.data.objects.nodes) {
            turretIds.push(node.address);
        }

        if (!result.data.objects.pageInfo.hasNextPage) break;
        cursor = result.data.objects.pageInfo.endCursor;
    }

    return turretIds;
}

async function fetchCharacters(client: SuiGraphQLClient): Promise<Character[]> {
    const turretIds = await fetchCharactersIds(client);

    if (turretIds.length === 0) return [];

    const { objects } = await client.getObjects({
        objectIds: turretIds,
        include: { json: true },
    });

    return objects
        .filter((obj): obj is Exclude<typeof obj, Error> => !(obj instanceof Error))
        .filter((obj) => obj.json != null)
        .map((obj) => obj.json as unknown as Character);
}

export function useCharacters() {
    const currentAccount = useCurrentAccount();
    const client = useCurrentClient() as SuiGraphQLClient;

    return useQuery({
        queryKey: queryKeys.characters.list(currentAccount?.address ?? ""),
        queryFn: () => fetchCharacters(client),
        enabled: !!currentAccount,
    });
}
