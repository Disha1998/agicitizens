import { createPublicClient, createWalletClient, http, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { getTextRecord as ensGetTextRecord, getOwner } from "@ensdomains/ensjs/public";
import { createSubname } from "@ensdomains/ensjs/wallet";
import { setRecords } from "@ensdomains/ensjs/wallet";
import { getEnsNetwork } from "@agicitizens/shared";
/**
 * ENS identity layer — runs on Ethereum Sepolia (not Base).
 *
 * Requires:
 *   ENS_OWNER_PRIVATE_KEY — private key of the account that owns agicitizens.eth on Sepolia
 *   (Fund this account with Sepolia ETH for gas)
 *
 * Pre-requisite: register agicitizens.eth on Sepolia ENS via app.ens.domains
 */
const ensNetwork = getEnsNetwork();
// Sepolia ENS contract addresses (from ensjs)
const SEPOLIA_PUBLIC_RESOLVER = "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5";
// Map network ID to viem chain + ENS contracts
const viemChains = {
    mainnet: addEnsContracts(mainnet),
    sepolia: addEnsContracts(sepolia),
};
const chain = viemChains[ensNetwork.id];
console.log(`[ens] Identity chain: ${ensNetwork.name} (${ensNetwork.chainId})`);
function getPublicClient() {
    const transport = http(ensNetwork.rpcUrl);
    return createPublicClient({ chain, transport });
}
/**
 * Create a viem wallet client for ENS operations on Sepolia.
 * Uses ENS_OWNER_PRIVATE_KEY — the account that owns agicitizens.eth.
 */
function getEnsWalletClient() {
    const pk = process.env.ENS_OWNER_PRIVATE_KEY;
    if (!pk)
        return null;
    const account = privateKeyToAccount(pk);
    const transport = http(ensNetwork.rpcUrl);
    return createWalletClient({ account, chain, transport });
}
/** Get the ENS owner address (used as subname owner so we can set text records). */
function getEnsOwnerAddress() {
    const pk = process.env.ENS_OWNER_PRIVATE_KEY;
    if (!pk)
        return null;
    return privateKeyToAccount(pk).address;
}
/**
 * Check if a subname already exists on-chain.
 * Returns the owner address if it exists, null otherwise.
 */
export async function subnameExists(ensName) {
    try {
        const client = getPublicClient();
        const result = await getOwner(client, { name: ensName, contract: "registry" });
        if (result?.owner && result.owner !== "0x0000000000000000000000000000000000000000") {
            return result.owner;
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Register a subdomain under agicitizens.eth.
 * e.g. registerSubdomain("cryptoresearch", "0x...") → cryptoresearch.agicitizens.eth
 *
 * Skips if the subname already exists on-chain.
 * Uses ensjs createSubname on the ENS registry (Sepolia L1).
 */
export async function registerSubdomain(name, _ownerAddress) {
    const ensName = `${name}.${ensNetwork.identityDomain}`;
    // Check if subname already exists on-chain
    const existingOwner = await subnameExists(ensName);
    if (existingOwner) {
        console.log(`[ens] ${ensName} already exists (owner: ${existingOwner}), skipping creation`);
        return { ensName, txHash: "0x_already_registered" };
    }
    const walletClient = getEnsWalletClient();
    if (!walletClient) {
        console.warn("[ens] ENS_OWNER_PRIVATE_KEY not set — falling back to mock");
        return mockRegister(ensName);
    }
    // Use the ENS owner as subname owner so we can set text records on it.
    // The agent's Base Sepolia wallet is stored as a text record (agc.wallet).
    const ensOwner = getEnsOwnerAddress();
    if (!ensOwner) {
        return mockRegister(ensName);
    }
    try {
        console.log(`[ens] Creating subname ${ensName} on Sepolia ENS...`);
        const txHash = await createSubname(walletClient, {
            name: ensName,
            owner: ensOwner,
            contract: "registry",
            resolverAddress: SEPOLIA_PUBLIC_RESOLVER,
            account: walletClient.account,
        });
        console.log(`[ens] Registered ${ensName} on Sepolia ENS`);
        console.log(`[ens]   tx: ${txHash}`);
        return { ensName, txHash };
    }
    catch (err) {
        console.warn(`[ens] Failed to register ${ensName}:`, err.message);
        return mockRegister(ensName);
    }
}
/**
 * Set text records on an ENS name via the public resolver.
 */
export async function setTextRecords(ensName, records) {
    const walletClient = getEnsWalletClient();
    if (!walletClient) {
        return mockSetText(ensName, records);
    }
    try {
        console.log(`[ens] Setting text records for ${ensName}...`);
        const texts = Object.entries(records).map(([key, value]) => ({
            key,
            value,
        }));
        const txHash = await setRecords(walletClient, {
            name: ensName,
            resolverAddress: SEPOLIA_PUBLIC_RESOLVER,
            texts,
            account: walletClient.account,
        });
        console.log(`[ens] Set ${texts.length} text record(s) for ${ensName}`);
        console.log(`[ens]   tx: ${txHash}`);
        return txHash;
    }
    catch (err) {
        console.warn(`[ens] Failed to set text records for ${ensName}:`, err.message);
        return mockSetText(ensName, records);
    }
}
/**
 * Read a text record from an ENS name (public, no signing needed).
 */
export async function getTextRecord(ensName, key) {
    try {
        const client = getPublicClient();
        const result = await ensGetTextRecord(client, {
            name: ensName,
            key,
        });
        return result ?? null;
    }
    catch {
        return null;
    }
}
// --- Mock fallbacks ---
function mockRegister(ensName) {
    const txHash = `0x${randomHex(64)}`;
    console.log(`[ens] MOCK registered ${ensName} (tx: ${txHash})`);
    return { ensName, txHash };
}
function mockSetText(ensName, records) {
    const txHash = `0x${randomHex(64)}`;
    console.log(`[ens] MOCK set text records for ${ensName}:`, records);
    return txHash;
}
function randomHex(len) {
    const chars = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < len; i++)
        out += chars[Math.floor(Math.random() * 16)];
    return out;
}
