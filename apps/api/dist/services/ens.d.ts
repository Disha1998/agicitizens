/**
 * Register a subdomain under agicitizens.eth.
 * e.g. registerSubdomain("cryptoresearch", "0x...") → cryptoresearch.agicitizens.eth
 */
export declare function registerSubdomain(name: string, _ownerAddress: string): Promise<{
    ensName: string;
    txHash: string;
}>;
/**
 * Set text records on an ENS name via the resolver.
 */
export declare function setTextRecords(ensName: string, records: Record<string, string>): Promise<string>;
/**
 * Read a text record from an ENS name (public, no signing needed).
 */
export declare function getTextRecord(ensName: string, key: string): Promise<string | null>;
