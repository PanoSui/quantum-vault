export const queryKeys = {
  turrets: {
    list: (owner: string) => ["turrets", "list", owner] as const,
  },
  characters: {
    list: (owner: string) => ["characters", "list", owner] as const,
  },
  coinMetadata: {
    detail: (coinType: string) => ["coinMetadata", coinType] as const,
  },
  quantumBalance: (owner: string) => ["quantum", "balance", owner] as const,
  suiBalance: (owner: string) => ["sui", "balance", owner] as const,
} as const;
