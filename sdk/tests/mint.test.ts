import { describe, it, beforeAll } from 'vitest'

import { ADMIN_KEYPAIR } from '@easysui/sdk'
import { Quantum } from '../src/tokens/quantum'
import { deploy } from '../src/utils/deploy'

describe('Mint Quantum test', () => {
    beforeAll(async () => {
        await deploy()
    })

    it('should mint Quantum coins for admin', async () => {
        await Quantum.mint(1_000_000n, ADMIN_KEYPAIR!)
        await Quantum.assertBalance(ADMIN_KEYPAIR!, 1_000_000n)
    })
})
