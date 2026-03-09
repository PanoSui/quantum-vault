export interface Turret {
    id: string;

    key: TurretKey;

    owner_cap_id: string;
    type_id: string;

    status: TurretStatus;

    location: Location;

    energy_source_id: string;

    metadata: Record<string, unknown> | null;
    extension: {
        name: string
    } | null;
    isBribable: boolean;
    isMine: boolean;
    remainingDays?: number;
}

export interface TurretKey {
    item_id: string;
    tenant: string;
}

export interface TurretStatus {
    status: {
        "@variant": string;
    };
}

export interface Location {
    location_hash: string;
}