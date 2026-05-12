/// Sniper Turret Extension - A turret that attacks a single designated character
///
/// The sniper system tracks exactly one locked target at any given time. Calling `snipe`
/// designates a character as that target; if a target is already set, the new one replaces
/// it. The turret's priority list returns only that character.
module quantum_vault::sniper_turret;

use sui::{bcs, event};
use world::{
    character::Character,
    in_game_id,
    turret::{
        Self,
        Turret,
        OnlineReceipt,
        ReturnTargetPriorityList,
        new_return_target_priority_list
    }
};

// === Constants ===

/// Priority weight assigned to the locked target.
const SNIPE_PRIORITY: u64 = 100_000;

/// Sentinel value meaning "no target set".
const NO_TARGET: u32 = 0;

// === Errors ===

#[error(code = 0)]
const EInvalidOnlineReceipt: vector<u8> = b"Invalid online receipt";

// === Structs ===

/// Witness type for authorization
public struct SniperTurretAuth has drop {}

/// One-time witness for initializing the global registry
public struct SNIPER_TURRET has drop {}

/// Global shared registry holding the single locked target. Only one target can be set
/// at any given time across the whole sniper turret system.
public struct SniperTargetRegistry has key {
    id: UID,
    target: u32,
}

// === Events ===

public struct SnipeTargetSetEvent has copy, drop {
    character_id: u32,
    /// 0 if no target was previously set
    previous_character_id: u32,
}

public struct SnipeTargetClearedEvent has copy, drop {
    /// 0 if no target was previously set
    previous_character_id: u32,
}

public struct RegistryCreatedEvent has copy, drop {
    registry_id: ID,
}

// === Module Initializer ===

/// Initialize the global target registry once when the module is published
fun init(_witness: SNIPER_TURRET, ctx: &mut TxContext) {
    let registry = SniperTargetRegistry {
        id: object::new(ctx),
        target: NO_TARGET,
    };

    let registry_id = object::id(&registry);

    event::emit(RegistryCreatedEvent { registry_id });

    transfer::share_object(registry);
}

// === Public Entry Functions ===

/// Designate a character as the sole sniper target. Replaces any existing target.
///
/// # Arguments
/// * `registry` - The global sniper target registry
/// * `target` - The character to mark as the locked target
#[allow(lint(public_entry))]
public entry fun snipe(
    registry: &mut SniperTargetRegistry,
    target: &Character,
    _ctx: &mut TxContext,
) {
    let character_key = target.key();
    let character_id = in_game_id::item_id(&character_key) as u32;

    let previous_character_id = registry.target;
    registry.target = character_id;

    event::emit(SnipeTargetSetEvent {
        character_id,
        previous_character_id,
    });
}

/// Clear the locked target, returning the registry to NO_TARGET.
#[allow(lint(public_entry))]
public entry fun unsnipe(
    registry: &mut SniperTargetRegistry,
    _ctx: &mut TxContext,
) {
    let previous_character_id = registry.target;
    registry.target = NO_TARGET;

    event::emit(SnipeTargetClearedEvent {
        previous_character_id,
    });
}

// === Public Functions ===

/// Targeting logic - returns a single-entry priority list containing the
/// `owner_character` at the highest priority weight (`SNIPE_PRIORITY`).
public fun get_target_priority_list(
    turret: &Turret,
    owner_character: &Character,
    _target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
    _ctx: &TxContext,
): vector<u8> {
    assert!(receipt.turret_id() == object::id(turret), EInvalidOnlineReceipt);

    let owner_character_id = in_game_id::item_id(&owner_character.key());

    let mut return_list = vector::empty<ReturnTargetPriorityList>();
    vector::push_back(
        &mut return_list,
        new_return_target_priority_list(owner_character_id, SNIPE_PRIORITY)
    );

    turret::destroy_online_receipt(receipt, SniperTurretAuth {});

    bcs::to_bytes(&return_list)
}

// === View Functions ===

/// Returns the character_id currently locked as the sniper target, or 0 if none.
public fun get_target(registry: &SniperTargetRegistry): u32 {
    registry.target
}

/// Whether a target is currently locked.
public fun has_target(registry: &SniperTargetRegistry): bool {
    registry.target != NO_TARGET
}
