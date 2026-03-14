/**
 * Wallet creation via CDP SDK.
 *
 * Uses cdp.evm.getOrCreateAccount({ name }) for idempotent wallet management.
 * Name is the key — same name always returns the same wallet/address.
 * Then wraps in CdpEvmWalletProvider for signing transactions.
 */
export interface WalletInfo {
    address: string;
    walletId: string;
    /** CDP wallet provider instance — null in mock mode */
    provider: any | null;
}
/**
 * Get or create a CDP wallet by name.
 * - First call with a name: creates the account
 * - Subsequent calls with same name: returns the same account (same address)
 *
 * Then wraps in CdpEvmWalletProvider for sendTransaction support.
 */
export declare function getOrCreateWallet(agentName: string): Promise<WalletInfo>;
/**
 * @deprecated Use getOrCreateWallet(name) instead.
 * Creates a new anonymous wallet (no name = no persistence).
 */
export declare function createWallet(): Promise<WalletInfo>;
