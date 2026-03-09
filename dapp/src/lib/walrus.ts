import { normalizeStructTag } from "@mysten/sui/utils";
import type { SuiGraphQLClient } from "@mysten/sui/graphql";
import { walrusClient } from "@/config/walrusClient";

let cachedWalType: string | null = null;

const WAL_TYPE_QUERY = `
  query WalType($packageId: SuiAddress!) {
    object(address: $packageId) {
      asMovePackage {
        module(name: "staking") {
          function(name: "stake_with_pool") {
            parameters {
              repr
            }
          }
        }
      }
    }
  }
`;

interface WalTypeQueryResult {
  object: {
    asMovePackage: {
      module: {
        function: {
          parameters: Array<{
            repr: string;
          }>;
        };
      };
    };
  };
}

/**
 * Resolves the WAL coin type from the Walrus staking module.
 * Parses the string representation of the Coin<WAL> parameter type.
 */
export async function resolveWalType({
  client,
}: {
  client: SuiGraphQLClient;
}): Promise<string> {
  if (cachedWalType) return cachedWalType;

  const { package_id: packageId } = await walrusClient.walrus.systemObject();

  const result = await client.query({
    query: WAL_TYPE_QUERY,
    variables: { packageId },
  });

  if (result.errors?.length) {
    throw new Error(
      `Failed to resolve WAL type: ${result.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const data = result.data as unknown as WalTypeQueryResult | null;
  const params =
    data?.object?.asMovePackage?.module?.function?.parameters ?? [];

  // Parameter [1] is Coin<WAL> — extract WAL type from the repr string
  // repr looks like "0x2::coin::Coin<0x...::wal::WAL>"
  const coinRepr = params[1]?.repr;
  if (!coinRepr) {
    throw new Error("Could not find Coin parameter in staking function");
  }

  const match = coinRepr.match(/<(.+)>/);
  if (!match) {
    throw new Error(`Could not extract WAL type from: ${coinRepr}`);
  }

  cachedWalType = normalizeStructTag(match[1]);
  return cachedWalType;
}

export async function getLatestWalrusEpoch() {
  const state = await walrusClient.walrus.systemState();
  return state.committee.epoch;
}
