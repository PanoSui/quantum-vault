import {ADMIN_KEYPAIR, deploy as baseDeploy, PublishSingleton} from '@easysui/sdk'
import {Config} from "./config";
import {Quantum} from "../tokens/quantum";

export async function deploy() {
    // PublishSingleton.cleanPubFile()
    const deployMsg = await baseDeploy(Config)
    await Quantum.finalizeRegistration(ADMIN_KEYPAIR!)

    return deployMsg + `\nThe ${Quantum.coinType} was registered.`
}