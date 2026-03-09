import { env } from "@/config/env";

type ExplorerEntity = "object" | "txblock" | "account";

export function explorerUrl({
  type,
  id,
}: {
  type: ExplorerEntity;
  id: string;
}): string {
  return `${env.VITE_SUIVISION_URL}/${type}/${id}`;
}

export function walruscanBlobUrl({ blobId }: { blobId: string }): string {
  return `${env.VITE_WALRUSCAN_URL}/blob/${blobId}`;
}
