# Quantum Vault

A specialized Sui smart contract that extends the EVE Frontier `world::storage_unit` module with capability-based access control for secure item withdrawals.

## Overview

The Quantum Vault is a special storage unit that adds an additional layer of security by requiring users to possess a `QuantumAccessCap` capability in order to withdraw items. This makes it ideal for scenarios where you want to control who can access stored items beyond just the owner.

## Key Features

- **Extension-based deposits**: Items can be deposited using the `QuantumVaultAuth` extension witness
- **Capability-based withdrawals**: Withdrawals require both extension authorization AND a valid `QuantumAccessCap`
- **Access control**: Owner can issue and revoke `QuantumAccessCap` capabilities to grant/deny withdrawal access
- **Extends storage_unit**: Built on top of the proven `world::storage_unit` module
- **Full compatibility**: Supports all standard storage_unit operations (online/offline, energy management, bridging)

## Architecture

The Quantum Vault follows the EVE Frontier extension pattern (Layer 3 - Player Extensions/Moddability):

```
┌─────────────────────────────────────┐
│      Quantum Vault Extension        │
│  (Cap-based withdrawal logic)       │
├─────────────────────────────────────┤
│      world::storage_unit            │
│  (Base storage functionality)       │
├─────────────────────────────────────┤
│      World Contracts Core           │
│  (Character, Inventory, etc.)       │
└─────────────────────────────────────┘
```

## Core Components

### Structs

- **`QuantumVaultAuth`**: Witness type for extension authorization
- **`QuantumAccessCap`**: Capability that grants withdrawal access to a specific vault

### Main Functions

#### Initialization

```move
public fun initialize_quantum_vault(
    storage_unit: &mut StorageUnit,
    owner_cap: &OwnerCap<StorageUnit>,
)
```

Initializes a storage unit as a quantum vault by authorizing the `QuantumVaultAuth` extension.

#### Access Management

```move
public fun issue_access_cap(
    storage_unit: &StorageUnit,
    owner_cap: &OwnerCap<StorageUnit>,
    recipient: address,
    ctx: &mut TxContext,
)
```

Issues a `QuantumAccessCap` to grant withdrawal access to a specific address.

```move
public fun revoke_access_cap(
    storage_unit: &StorageUnit,
    owner_cap: &OwnerCap<StorageUnit>,
    access_cap: &mut QuantumAccessCap,
)
```

Revokes a previously issued `QuantumAccessCap`.

#### Item Management

```move
public fun deposit_item(
    storage_unit: &mut StorageUnit,
    character: &Character,
    item: Item,
    ctx: &mut TxContext,
)
```

Deposits an item into the quantum vault (requires extension authorization).

```move
public fun withdraw_item(
    storage_unit: &mut StorageUnit,
    character: &Character,
    access_cap: &QuantumAccessCap,
    type_id: u64,
    ctx: &mut TxContext,
): Item
```

Withdraws an item from the quantum vault (requires valid `QuantumAccessCap`).

## Usage Example

### 1. Create and Initialize a Quantum Vault

```move
// Anchor a new storage unit
let storage_unit = quantum_vault::anchor_quantum_vault(
    &mut registry,
    &mut network_node,
    &character,
    &admin_acl,
    item_id,
    type_id,
    max_capacity,
    location_hash,
    ctx,
);

// Share the storage unit
quantum_vault::share_quantum_vault(storage_unit, &admin_acl, ctx);

// Initialize as quantum vault
quantum_vault::initialize_quantum_vault(&mut storage_unit, &owner_cap);
```

### 2. Grant Access to a User

```move
// Issue access cap to user
quantum_vault::issue_access_cap(
    &storage_unit,
    &owner_cap,
    user_address,
    ctx,
);
```

### 3. Deposit and Withdraw Items

```move
// Deposit item (anyone with extension auth)
quantum_vault::deposit_item(
    &mut storage_unit,
    &character,
    item,
    ctx,
);

// Withdraw item (requires QuantumAccessCap)
let item = quantum_vault::withdraw_item(
    &mut storage_unit,
    &character,
    &access_cap,
    type_id,
    ctx,
);
```

### 4. Revoke Access

```move
// Revoke access cap
quantum_vault::revoke_access_cap(
    &storage_unit,
    &owner_cap,
    &mut access_cap,
);
```

## Security Model

1. **Two-factor authorization for withdrawals**:
   - Extension authorization via `QuantumVaultAuth` witness
   - Valid `QuantumAccessCap` possession

2. **Owner controls**:
   - Only the storage unit owner (via `OwnerCap<StorageUnit>`) can issue/revoke access caps
   - Owner maintains full control over the vault

3. **Cap validation**:
   - Caps are bound to specific vault IDs
   - Revoked caps cannot be used
   - Caps are transferable objects (can be traded/transferred)

## Differences from Base Storage Unit

| Feature | Base Storage Unit | Quantum Vault |
|---------|------------------|---------------|
| Deposits | Owner or Extension | Extension only (QuantumVaultAuth) |
| Withdrawals | Owner or Extension | Extension + QuantumAccessCap |
| Access Control | Owner-based | Owner + Cap-based |
| Use Cases | General storage | Secure/restricted storage |

## Use Cases

- **Guild vaults**: Control which guild members can withdraw items
- **Escrow systems**: Secure item storage until conditions are met
- **Rental systems**: Grant temporary access to stored items
- **Shared storage**: Multiple parties with controlled access
- **Time-locked vaults**: Distribute caps based on time conditions

## Building

```bash
cd move-contracts/quantum_vault
sui move build
```

## Testing

```bash
sui move test
```

## Dependencies

- `world` contracts (EVE Frontier world-contracts)
- Sui framework

## License

Follow the license of the EVE Frontier world-contracts project.

## References

- [EVE Frontier World Contracts](https://github.com/evefrontier/world-contracts)
- [Storage Unit Architecture](https://github.com/evefrontier/world-contracts/blob/main/docs/architechture.md)
- [Sui Move Documentation](https://docs.sui.io/concepts/sui-move-concepts)
