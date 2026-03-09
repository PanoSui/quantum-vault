import { Quantum } from '../tokens/quantum'
import {ADMIN_KEYPAIR} from '@easysui/sdk'

const amount = 1_000_000n
const to = ADMIN_KEYPAIR!.toSuiAddress()

Quantum.mint(100n*1_000_000n, ADMIN_KEYPAIR!).then(() => {
    return Quantum.send(amount, ADMIN_KEYPAIR!, to)
})
