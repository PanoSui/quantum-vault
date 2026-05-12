import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const VAR_MAP: Record<string, string> = {
    PACKAGE_ID: 'VITE_PACKAGE_ID',
    QUANTUM_TREASURY_ID: 'VITE_QUANTUM_TREASURY_ID',
    BRIBE_REGISTRY: 'VITE_BRIBE_REGISTRY',
    SNIPER_REGISTRY: 'VITE_SNIPER_REGISTRY',
}

function upsertEnvLine(contents: string, key: string, value: string): string {
    const formatted = `${key}="${value}"`
    const regex = new RegExp(`^${key}\\s*=.*$`, 'm')
    if (regex.test(contents)) {
        return contents.replace(regex, formatted)
    }
    const needsLeadingNewline = contents.length > 0 && !contents.endsWith('\n')
    return contents + (needsLeadingNewline ? '\n' : '') + formatted + '\n'
}

export function syncDappEnv() {
    const network = process.env.NETWORK
    if (!network) {
        console.warn('[syncDappEnv] NETWORK is not set, skipping')
        return
    }

    const sourcePath = path.resolve(process.cwd(), `.env.${network}`)
    if (!fs.existsSync(sourcePath)) {
        console.warn(`[syncDappEnv] ${sourcePath} not found, skipping`)
        return
    }

    const dappEnvPath = path.resolve(process.cwd(), '../dapp/.env')
    if (!fs.existsSync(dappEnvPath)) {
        console.warn(`[syncDappEnv] ${dappEnvPath} not found, skipping`)
        return
    }

    const sourceVars = dotenv.parse(fs.readFileSync(sourcePath))
    let dappContents = fs.readFileSync(dappEnvPath, 'utf8')

    const updated: string[] = []
    const missing: string[] = []
    for (const [srcKey, dappKey] of Object.entries(VAR_MAP)) {
        const value = sourceVars[srcKey]
        if (!value) {
            missing.push(srcKey)
            continue
        }
        dappContents = upsertEnvLine(dappContents, dappKey, value)
        updated.push(`${dappKey}=${value}`)
    }

    fs.writeFileSync(dappEnvPath, dappContents)

    console.log(`[syncDappEnv] Updated ${dappEnvPath} from ${sourcePath}`)
    for (const line of updated) console.log(`  ${line}`)
    if (missing.length > 0) {
        console.warn(`[syncDappEnv] Missing in source: ${missing.join(', ')}`)
    }
}
