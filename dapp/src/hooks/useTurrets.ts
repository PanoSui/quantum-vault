import {useCurrentAccount} from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import type { GraphQLQueryResult } from "@mysten/sui/graphql";
import { SuiGraphQLClient } from "@mysten/sui/graphql";

import { queryKeys } from "@/constants/queryKeys";
import {
    PACKAGE_ID,
    TURRET_TYPE,
} from "@/constants/contracts";
import {Turret} from "@/types/turret.ts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";
import type {CharacterInfo} from "@evefrontier/dapp-kit";
import {Transaction} from "@mysten/sui/transactions";
import {env} from "@/config/env.ts";
import {getJsonRpcFullnodeUrl, SuiJsonRpcClient} from "@mysten/sui/jsonRpc";
import {bcs} from "@mysten/sui/bcs";

const TURRETS_LOOKUP_QUERY = `
  query Turrets($type: String!, $first: Int!, $after: String) {
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

interface TurretsLookupResponse {
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
const MAX_PAGES = 100;

async function _fetchTurrets(client: SuiGraphQLClient): Promise<Turret[]> {
    const turrets: Turret[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < MAX_PAGES; page++) {
        const result: GraphQLQueryResult<TurretsLookupResponse> =
            await client.query({
                query: TURRETS_LOOKUP_QUERY,
                variables: {
                    type: TURRET_TYPE,
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
            turrets.push(node.asMoveObject?.contents.json as unknown as Turret);
        }

        if (!result.data.objects.pageInfo.hasNextPage) break;
        cursor = result.data.objects.pageInfo.endCursor;
    }

    return turrets;
}

async function fetchTurrets(client: SuiGraphQLClient, character?: CharacterInfo | null): Promise<Turret[]> {
    let turrets = await _fetchTurrets(client);

    turrets = turrets.filter((t) => t)

    const fullTurrets: Turret[] = []
    for(const turret of turrets) {
        turret.isBribable = `0x${turret.extension?.name}` === `${PACKAGE_ID}::quantum_turret::QuantumTurretAuth`
        turret.isSniper = `0x${turret.extension?.name}` === `${PACKAGE_ID}::snipper_turret::SniperTurretAuth`
        turret.isMine = character?._raw?.owner_cap_id === turret.owner_cap_id

        if (turret.isBribable && character?.address) {
            turret.remainingDays = await getImmunityRemainingEpochs(turret.id, character.characterId, character.address)
        }
        fullTurrets.push(turret)
    }

    return fullTurrets.filter((t) => [
        '0x2c81ba130d6e79acfd9fe5f12c4e4681de633b86da205d181403ae880f38171a',
        '0xc8009c558cf8bfb0f0943cb766f7c8ed8c3560ef356116af0fc55fd745ee7616',
        '0x738a18232b25fa07abc981a872599237fdc42f1f77f6f511055612277304ee9a',
    ].indexOf(t.id) !== -1);
}

async function getImmunityRemainingEpochs(turretId: string, characterId: number, sender: string) {
    const tx = new Transaction();

    const client = new SuiJsonRpcClient({
        network: env.VITE_SUI_NETWORK,
        url: getJsonRpcFullnodeUrl(env.VITE_SUI_NETWORK),
    });

    tx.moveCall({
        target: `${PACKAGE_ID}::quantum_turret::get_immunity_remaining_epochs`,
        arguments: [
            tx.object(env.VITE_BRIBE_REGISTRY),
            tx.pure.id(turretId),
            tx.pure.u32(characterId),
        ],
    });

    const result = await client.devInspectTransactionBlock({
        sender,
        transactionBlock: tx,
    });
    const value = result.results?.[0].returnValues?.[0]?.[0] || 0
    const epochs = value ? Number(bcs.u64().parse(new Uint8Array(value))) : 0

    return epochs / 24
}

export function useTurrets() {
    const currentAccount = useCurrentAccount();
    // const client = useCurrentClient() as SuiGraphQLClient;
    const {data: character, isLoading} = useMyCharacter();

    const client = new SuiGraphQLClient({
        network: env.VITE_SUI_NETWORK,
        url: env.VITE_SUI_GRAPHQL_URL,
    })

    return useQuery({
        queryKey: queryKeys.turrets.list(character?.id ?? ""),
        queryFn: () => fetchTurrets(client, character),
        enabled: !!currentAccount && !isLoading && !!character?.id,
        // staleTime: 10000
    });
}
