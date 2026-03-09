import {Config as BaseConfig, BaseConfigVars, ExtraVarsMap} from '@easysui/sdk'

interface ConfigVars extends BaseConfigVars {
    QUANTUM_TREASURY_ID: string
    BRIBE_REGISTRY: string
}

export class Config extends BaseConfig<ConfigVars> {
    static override get vars(): ConfigVars {
        const baseVars = super.vars

        return {
            ...baseVars,
            QUANTUM_TREASURY_ID: process.env.QUANTUM_TREASURY_ID || '',
            BRIBE_REGISTRY: process.env.BRIBE_REGISTRY || '',
        }
    }

    static override get extraVars(): ExtraVarsMap {
        return {
            QUANTUM_TREASURY_ID: `{packageId}::quantum::QuantumTreasury`,
            BRIBE_REGISTRY: `{packageId}::quantum_turret::GlobalBribeRegistry`
        }
    }
}