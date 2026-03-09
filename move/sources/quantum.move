// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
module quantum_vault::quantum;

use sui::{coin::{Self, Coin, TreasuryCap}, sui::SUI, coin_registry};

const DECIMALS: u8 = 6;
const SYMBOL: vector<u8> = b"QTM";
const NAME: vector<u8> = b"Quantum";
const DESCRIPTION: vector<u8> = b"Quantum token, an ancient token to access the quantum vaults.";
const ICON_URL: vector<u8> =
    b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/KJ_QqEVvXvKJnxLzeMdPNW4-bT9ijahRvM-xZybNMho";

// Treasury wallet address that receives SUI tokens
const TREASURY_ADDRESS: address = @0xe113d4948d863e8c4fcb9fdcbb8d632d8661d46dbc8f82b6d93cd0e8798c7226;

// The type identifier of coin. The coin will have a type
// tag of kind: `Coin<quantum_vault::quantum::QUANTUM>`
// Make sure that the name of the type matches the module's name.
public struct QUANTUM has drop {}

/// Shared object that wraps the TreasuryCap to allow public minting through buy function
public struct QuantumTreasury has key {
    id: UID,
    treasury_cap: TreasuryCap<QUANTUM>,
}

// Module initializer is called once on module publish using the new Coin Registry system.
// This creates a currency registered in the Sui Coin Registry at shared object address 0xc.
fun init(witness: QUANTUM, ctx: &mut TxContext) {
    // Create currency using OTW (One-Time Witness) for proof of uniqueness
    // This is the standard and recommended pattern for creating currencies in init functions
    let (builder, treasury_cap) = coin_registry::new_currency_with_otw(
        witness,
        DECIMALS,
        SYMBOL.to_string(),
        NAME.to_string(),
        DESCRIPTION.to_string(),
        ICON_URL.to_string(),
        ctx,
    );

    // Finalize registration and get the metadata cap
    // This creates the shared Currency object in the Coin Registry
    let metadata_cap = builder.finalize(ctx);

    // Wrap the treasury cap in a shared object so anyone can call buy()
    let quantum_treasury = QuantumTreasury {
        id: object::new(ctx),
        treasury_cap,
    };

    // Share the treasury object - now anyone can access it for buying
    transfer::share_object(quantum_treasury);

    // Transfer metadata cap to the sender for metadata updates
    transfer::public_transfer(metadata_cap, ctx.sender());
}

/// Buy QUANTUM tokens with SUI at a 1:1 ratio (adjusted for decimals)
///
/// This function is publicly accessible by any wallet since QuantumTreasury is a shared object.
///
/// Exchange rate: 1 SUI = 1 QUANTUM
/// - SUI has 9 decimals (1 SUI = 1,000,000,000 base units)
/// - QUANTUM has 6 decimals (1 QUANTUM = 1,000,000 base units)
/// - Conversion: sui_amount / 1000 = quantum_amount
///
/// Example:
/// - Pay 1 SUI (1,000,000,000 base units) → Get 1 QUANTUM (1,000,000 base units)
/// - Pay 0.001 SUI (1,000,000 base units) → Get 0.001 QUANTUM (1,000 base units)
///
/// # Arguments
/// * `treasury` - The shared QuantumTreasury object (anyone can access)
/// * `payment` - SUI coins to pay with
/// * `ctx` - Transaction context
///
/// # Returns
/// Minted QUANTUM tokens sent to the buyer
#[allow(lint(public_entry))]
public entry fun buy(
    treasury: &mut QuantumTreasury,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    // Get the amount of SUI being paid
    let sui_amount = payment.value();

    // Transfer SUI to treasury address
    transfer::public_transfer(payment, TREASURY_ADDRESS);

    // Mint equivalent amount of QUANTUM tokens
    // Note: SUI has 9 decimals, QUANTUM has 6 decimals
    // To maintain 1:1 ratio, we need to adjust: sui_amount / 1000
    let quantum_amount = sui_amount / 1000;

    // Mint QUANTUM tokens using the wrapped treasury cap
    let quantum_coin = coin::mint(&mut treasury.treasury_cap, quantum_amount, ctx);

    // Transfer minted QUANTUM to the buyer
    transfer::public_transfer(quantum_coin, ctx.sender());
}

#[test_only]
public(package) fun init_for_testing(ctx: &mut TxContext) {
    QUANTUM {}.init(ctx);
}
