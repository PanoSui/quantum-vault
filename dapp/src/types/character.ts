export interface Character {
    id: string;
    key: ItemKey;

    tribe_id: number;
    character_address: string;

    metadata: CharacterMetadata;

    owner_cap_id: string;
}

export interface ItemKey {
    item_id: string;
    tenant: string;
}

export interface CharacterMetadata {
    assembly_id: string;
    name: string;
    description: string;
    url: string;
}