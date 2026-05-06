import {useCurrentAccount, useCurrentClient} from "@mysten/dapp-kit-react";
import { useQuery } from "@tanstack/react-query";
import type { GraphQLQueryResult, SuiGraphQLClient } from "@mysten/sui/graphql";
import { queryKeys } from "@/constants/queryKeys";
import {
    PACKAGE_ID,
    TURRET_TYPE,
} from "@/constants/contracts";
import {Turret} from "@/types/turret.ts";
import {useMyCharacter} from "@/hooks/useCharacter.ts";
import {Character} from "@/types/character.ts";
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
        address
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
        }>;
    };
}

const PAGE_SIZE = 50;
const MAX_PAGES = 1;

async function fetchTurretIds(client: SuiGraphQLClient): Promise<string[]> {
    const turretIds: string[] = [];
    let cursor: string | null = null;

    console.log(TURRET_TYPE);

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

        console.log(result.errors?.length);
        
        if (result.errors?.length) {
            continue
            // throw new Error(result.errors.map((e) => e.message).join(", "));
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

async function fetchTurrets(client: SuiGraphQLClient, character?: Character): Promise<Turret[]> {
    const turretIds = await fetchTurretIds(client);

    if (turretIds.length === 0) return [];

    const { objects } = await client.getObjects({
        objectIds: turretIds,
        include: { json: true },
    });

    const objs = objects
        .filter((obj): obj is Exclude<typeof obj, Error> => !(obj instanceof Error))
        .filter((obj) => obj.json != null)

    const turrets = []
    for(const obj of objs) {
        const turret = obj.json as unknown as Turret
        turret.isBribable = `0x${turret.extension?.name}` === `${PACKAGE_ID}::quantum_turret::QuantumTurretAuth`
        turret.isSniper = `0x${turret.extension?.name}` === `${PACKAGE_ID}::snipper_turret::SniperTurretAuth`
        if (character && character.id) {
            const {object} = await client.getObject({
                objectId: turret.owner_cap_id,
                include: {json: true},
            });
            turret.isMine = character.id === object.owner.AddressOwner

            if (turret.isBribable && character.character_address) {
                turret.remainingDays = await getImmunityRemainingEpochs(turret.id, parseInt(character.key.item_id), character.character_address)
            }
        }

        turrets.push(turret)
    }
    return turrets
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
    const client = useCurrentClient() as SuiGraphQLClient;
    const {data: character, isLoading} = useMyCharacter();

    return useQuery({
        queryKey: queryKeys.turrets.list(currentAccount?.address ?? ""),
        queryFn: () => fetchTurrets(client, character),
        enabled: !!currentAccount && !isLoading,
        staleTime: 10000
    });
}
