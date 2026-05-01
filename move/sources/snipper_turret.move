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
    turret::{Self, Turret, OnlineReceipt, ReturnTargetPriorityList}
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

public struct PriorityListUpdatedEvent has copy, drop {
    turret_id: ID,
    target_character_id: u32,
    target_in_candidates: bool,
    total_candidates: u64,
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

/// Targeting logic - returns the locked target if present in the candidate list,
/// otherwise an empty priority list.
public fun get_target_priority_list(
    turret: &Turret,
    registry: &SniperTargetRegistry,
    _character: &Character,
    target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
    _ctx: &TxContext,
): vector<u8> {
    assert!(receipt.turret_id() == object::id(turret), EInvalidOnlineReceipt);

    let candidates = turret::unpack_candidate_list(target_candidate_list);
    let target_id = registry.target;

    let mut return_list = vector::empty<ReturnTargetPriorityList>();
    let mut target_found = false;

    if (target_id != NO_TARGET) {
        let mut i = 0;
        let len = candidates.length();
        while (i < len) {
            let candidate = &candidates[i];
            if (turret::character_id(candidate) == target_id) {
                return_list.push_back(turret::new_return_target_priority_list(
                    turret::item_id(candidate),
                    SNIPE_PRIORITY,
                ));
                target_found = true;
                break
            };
            i = i + 1;
        };
    };

    let result = bcs::to_bytes(&return_list);

    turret::destroy_online_receipt(receipt, SniperTurretAuth {});

    event::emit(PriorityListUpdatedEvent {
        turret_id: object::id(turret),
        target_character_id: target_id,
        target_in_candidates: target_found,
        total_candidates: candidates.length(),
    });

    result
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
