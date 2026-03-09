import { Coin } from '@easysui/sdk'
import { Keypair } from '@mysten/sui/cryptography'
import {Config} from "../utils/config";

export class Quantum extends Coin {
    public static get coinType(): string {
        return Config.vars.PACKAGE_ID + '::quantum::QUANTUM'
    }

    public static async mint(amount: bigint, minter: Keypair) {
        const treasuryId = Config.vars.QUANTUM_TREASURY_ID
        await Quantum._mint(treasuryId, amount, minter)
    }
}
