/// Quantum Turret Extension - A bribeable turret that grants immunity for quantum tokens
///
/// This extension allows characters to bribe the turret with QUANTUM tokens to avoid being
/// targeted for a specified duration. The turret tracks active bribes and excludes bribed
/// characters from the priority target list.
///
/// Features:
/// - Accept 2 QUANTUM tokens as a bribe
/// - Grant immunity from targeting for a duration
/// - Priority-based targeting of non-bribed enemies
///
/// IMPORTANT: The `get_target_priority_list` function must maintain exactly 4 parameters
/// as required by the World framework. Bribe data is managed outside this function call.
module quantum_vault::quantum_turret;

use sui::{bcs, coin::Coin, event, table::{Self, Table}};
use world::{
    character::Character,
    in_game_id,
    turret::{Self, Turret, OnlineReceipt, TargetCandidate, ReturnTargetPriorityList}
};
use quantum_vault::quantum::QUANTUM;

// === Constants ===
const TREASURY_ADDRESS: address = @0xe113d4948d863e8c4fcb9fdcbb8d632d8661d46dbc8f82b6d93cd0e8798c7226;

/// Amount of QUANTUM required to bribe (2 tokens * 10^6 decimals)
const BRIBE_AMOUNT: u64 = 2_000_000;

/// Duration of immunity in epochs (approximately 24 hours at 1 epoch per hour)
const IMMUNITY_DURATION_EPOCHS: u64 = 24;

// === Errors ===

#[error(code = 0)]
const EInvalidOnlineReceipt: vector<u8> = b"Invalid online receipt";

#[error(code = 1)]
const EInsufficientBribe: vector<u8> = b"Bribe amount must be exactly 2 QUANTUM per day";

// === Structs ===

/// Witness type for authorization
public struct QuantumTurretAuth has drop {}

/// One-time witness for initializing the global registry
public struct QUANTUM_TURRET has drop {}

/// Nested table structure: character_id -> expiry_epoch
public struct TurretBribes has store {
    bribes: Table<u32, u64>,
}

/// Global shared registry that tracks all bribe records across all turrets
/// Created once during module initialization
public struct GlobalBribeRegistry has key {
    id: UID,
    /// Maps turret_id -> TurretBribes (character_id -> expiry_epoch)
    turret_bribes: Table<ID, TurretBribes>,
}

// === Events ===

public struct BribeAcceptedEvent has copy, drop {
    turret_id: ID,
    character_id: u32,
    amount: u64,
    immunity_until_epoch: u64,
}

public struct PriorityListUpdatedEvent has copy, drop {
    turret_id: ID,
    excluded_count: u64,
    total_candidates: u64,
}

public struct GlobalRegistryCreatedEvent has copy, drop {
    registry_id: ID,
}

// === Module Initializer ===

/// Initialize the global bribe registry once when the module is published
fun init(_witness: QUANTUM_TURRET, ctx: &mut TxContext) {
    let registry = GlobalBribeRegistry {
        id: object::new(ctx),
        turret_bribes: table::new(ctx),
    };

    let registry_id = object::id(&registry);

    event::emit(GlobalRegistryCreatedEvent {
        registry_id,
    });

    // Share the global registry so anyone can access it
    transfer::share_object(registry);
}

// === Public Entry Functions ===

/// Allows a character to bribe a turret for immunity
///
/// # Arguments
/// * `registry` - The global bribe registry
/// * `turret` - The turret to bribe
/// * `character` - The character paying the bribe
/// * `payment` - Coin<QUANTUM> with exactly BRIBE_AMOUNT * days
/// * `days` - Number of days of immunity
/// * `ctx` - Transaction context for epoch tracking
#[allow(lint(public_entry))]
public entry fun bribe_turret(
    registry: &mut GlobalBribeRegistry,
    turret: &Turret,
    character: &Character,
    payment: Coin<QUANTUM>,
    days: u64,
    ctx: &mut TxContext,
) {
    // Verify payment amount
    let amount = payment.value();
    assert!(amount == BRIBE_AMOUNT * days, EInsufficientBribe);

    // Transfer payment to treasury
    transfer::public_transfer(payment, TREASURY_ADDRESS);

    // Calculate immunity expiry
    let current_epoch = ctx.epoch();
    let immunity_until = current_epoch + (days * IMMUNITY_DURATION_EPOCHS);

    // Get turret ID
    let turret_id = object::id(turret);

    // Store bribe record using character's game ID as key
    let character_key = character.key();
    let character_id = in_game_id::item_id(&character_key) as u32;

    // Get or create the TurretBribes for this turret
    if (!registry.turret_bribes.contains(turret_id)) {
        let turret_bribes = TurretBribes {
            bribes: table::new(ctx),
        };
        registry.turret_bribes.add(turret_id, turret_bribes);
    };

    // Access the turret's bribes table
    let turret_bribes = registry.turret_bribes.borrow_mut(turret_id);

    // Update or add bribe record
    if (turret_bribes.bribes.contains(character_id)) {
        let expiry = turret_bribes.bribes.borrow_mut(character_id);
        *expiry = immunity_until;
    } else {
        turret_bribes.bribes.add(character_id, immunity_until);
    };

    // Emit event
    event::emit(BribeAcceptedEvent {
        turret_id,
        character_id,
        amount,
        immunity_until_epoch: immunity_until,
    });
}

// === Public Functions ===

/// Main targeting logic - called by the game to get priority list
/// Excludes bribed characters from targeting and prioritizes others
///
/// # Arguments
/// * `turret` - The turret calculating targets
/// * `registry` - The global bribe registry for checking immunity
/// * `_character` - The character associated with the turret (owner)
/// * `target_candidate_list` - BCS-encoded list of potential targets
/// * `receipt` - OnlineReceipt proving turret is online (hot potato)
/// * `ctx` - Transaction context for epoch checking
///
/// # Returns
/// BCS-encoded vector<ReturnTargetPriorityList>
public fun get_target_priority_list(
    turret: &Turret,
    registry: &GlobalBribeRegistry,
    _character: &Character,
    target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
    ctx: &TxContext,
): vector<u8> {
    // Verify receipt matches this turret
    assert!(receipt.turret_id() == object::id(turret), EInvalidOnlineReceipt);

    // Unpack the candidate list
    let candidates = turret::unpack_candidate_list(target_candidate_list);

    // Get current epoch for immunity checking
    let current_epoch = ctx.epoch();
    let turret_id = object::id(turret);

    // Build return list, excluding characters with active immunity
    let mut return_list = vector::empty<ReturnTargetPriorityList>();
    let mut excluded_count = 0u64;

    let mut i = 0;
    let len = candidates.length();
    while (i < len) {
        let candidate = &candidates[i];
        let character_id = turret::character_id(candidate);

        // Check if this character has active immunity
        let is_immune = check_immunity(registry, turret_id, character_id, current_epoch);

        // Only add to target list if not immune
        if (!is_immune) {
            // Calculate priority weight based on behavior and threat level
            let priority = calculate_priority(candidate);

            return_list.push_back(turret::new_return_target_priority_list(
                turret::item_id(candidate),
                priority,
            ));
        } else {
            excluded_count = excluded_count + 1;
        };

        i = i + 1;
    };

    // Convert to bytes
    let result = bcs::to_bytes(&return_list);

    // Destroy the receipt (required to consume hot potato)
    turret::destroy_online_receipt(receipt, QuantumTurretAuth {});

    // Emit event
    event::emit(PriorityListUpdatedEvent {
        turret_id,
        excluded_count,
        total_candidates: len,
    });

    result
}

// === Helper Functions ===

/// Check if a character has active immunity (internal helper)
fun check_immunity(
    registry: &GlobalBribeRegistry,
    turret_id: ID,
    character_id: u32,
    current_epoch: u64,
): bool {
    if (character_id == 0) {
        return false
    };

    // Check if turret has any bribes
    if (!registry.turret_bribes.contains(turret_id)) {
        return false
    };

    // Check if character has bribed this turret
    let turret_bribes = registry.turret_bribes.borrow(turret_id);
    if (!turret_bribes.bribes.contains(character_id)) {
        return false
    };

    // Check if bribe is still active
    let expiry = turret_bribes.bribes.borrow(character_id);
    current_epoch < *expiry
}

/// Calculate priority weight for a target based on threat indicators
fun calculate_priority(candidate: &TargetCandidate): u64 {
    let mut priority = 1000u64; // Base priority

    // Heavily prioritize active aggressors
    if (turret::is_aggressor(candidate)) {
        priority = priority + 10000;
    };

    // Add some weight based on existing priority
    let base_weight = turret::priority_weight(candidate);
    priority = priority + base_weight;

    priority
}

// === View Functions ===

/// Check if a character has active immunity for a specific turret
public fun has_immunity(
    registry: &GlobalBribeRegistry,
    turret_id: ID,
    character_id: u32,
    ctx: &TxContext,
): bool {
    check_immunity(registry, turret_id, character_id, ctx.epoch())
}

/// Get immunity expiry epoch for a character on a specific turret (returns 0 if no immunity)
public fun get_immunity_expiry(
    registry: &GlobalBribeRegistry,
    turret_id: ID,
    character_id: u32,
): u64 {
    if (character_id == 0 || !registry.turret_bribes.contains(turret_id)) {
        return 0
    };

    let turret_bribes = registry.turret_bribes.borrow(turret_id);
    if (!turret_bribes.bribes.contains(character_id)) {
        return 0
    };

    *turret_bribes.bribes.borrow(character_id)
}

/// Get remaining epochs of immunity for a character on a specific turret
/// Returns 0 if no immunity or if immunity has expired
///
/// # Arguments
/// * `registry` - The global bribe registry
/// * `turret_id` - The turret to check immunity for
/// * `character_id` - The character to check
/// * `ctx` - Transaction context for current epoch
///
/// # Returns
/// Number of remaining epochs of immunity (0 if none or expired)
public fun get_immunity_remaining_epochs(
    registry: &GlobalBribeRegistry,
    turret_id: ID,
    character_id: u32,
    ctx: &TxContext,
): u64 {
    let expiry_epoch = get_immunity_expiry(registry, turret_id, character_id);
    if (expiry_epoch == 0) {
        return 0
    };

    let current_epoch = ctx.epoch();

    // If already expired, return 0
    if (current_epoch >= expiry_epoch) {
        return 0
    };

    // Return remaining epochs
    expiry_epoch - current_epoch
}
