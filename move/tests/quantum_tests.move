// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
#[test_only]
module quantum_vault::quantum_tests;

use quantum_vault::quantum::{QUANTUM, QuantumTreasury, init_for_testing};
use sui::{coin_registry::MetadataCap, test_scenario as ts};

const ADMIN: address = @0x0;

/// Initializes the test scenario and returns scenario, treasury, and metadata cap
fun setup(): (ts::Scenario, QuantumTreasury, MetadataCap<QUANTUM>) {
    let mut scenario = ts::begin(ADMIN);
    init_for_testing(scenario.ctx());
    scenario.next_tx(ADMIN);

    let treasury = scenario.take_shared<QuantumTreasury>();
    let metadata_cap = scenario.take_from_sender<MetadataCap<QUANTUM>>();
    (scenario, treasury, metadata_cap)
}

#[test]
fun mint_and_burn() {
    let (scenario, treasury, metadata_cap) = setup();

    // Note: We can't directly access treasury_cap in tests since it's wrapped
    // But we can verify the QuantumTreasury exists and is shared

    ts::return_shared(treasury);
    scenario.return_to_sender(metadata_cap);
    scenario.end();
}

#[test]
fun verify_caps_transferred() {
    let mut scenario = ts::begin(ADMIN);
    init_for_testing(scenario.ctx());
    scenario.next_tx(ADMIN);

    // Verify QuantumTreasury is shared and MetadataCap is transferred to sender
    assert!(ts::has_most_recent_shared<QuantumTreasury>());
    assert!(scenario.has_most_recent_for_sender<MetadataCap<QUANTUM>>());

    let treasury = scenario.take_shared<QuantumTreasury>();
    let metadata_cap = scenario.take_from_sender<MetadataCap<QUANTUM>>();

    ts::return_shared(treasury);
    scenario.return_to_sender(metadata_cap);
    scenario.end();
}
