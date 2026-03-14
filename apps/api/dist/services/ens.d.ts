/**
 * Check if a subname already exists on-chain.
 * Returns the owner address if it exists, null otherwise.
 */
export declare function subnameExists(ensName: string): Promise<string | null>;
/**
 * Register a subdomain under agicitizens.eth.
 * e.g. registerSubdomain("cryptoresearch", "0x...") → cryptoresearch.agicitizens.eth
 *
 * Skips if the subname already exists on-chain.
 * Uses ensjs createSubname on the ENS registry (Sepolia L1).
 */
export declare function registerSubdomain(name: string, _ownerAddress: string): Promise<{
    ensName: string;
    txHash: string;
}>;
/**
 * Set text records on an ENS name via the public resolver.
 */
export declare function setTextRecords(ensName: string, records: Record<string, string>): Promise<string>;
/**
 * Read a text record from an ENS name (public, no signing needed).
 */
export declare function getTextRecord(ensName: string, key: string): Promise<string | null>;
