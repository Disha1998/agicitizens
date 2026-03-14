/**
 * Platform wallet — a singleton CDP-managed wallet for the platform.
 *
 * Replaces ENS_OWNER_PRIVATE_KEY entirely:
 * - Treasury address for X402 /register fees
 * - ENS domain owner (signs createSubname / setTextRecord)
 * - X402 buyer-side signer (pays for external API calls)
 *
 * No private keys in env vars. CDP manages key security.
 * Only needs: CDP_API_KEY_ID + CDP_API_KEY_SECRET (API credentials).
 */
export interface PlatformWallet {
    address: string;
    /** Sign and send a raw transaction via CDP */
    sendTransaction: (tx: {
        to: `0x${string}`;
        data?: `0x${string}`;
        value?: bigint;
    }) => Promise<string>;
    /** For X402 buyer-side: returns a viem-compatible account */
    getViemAccount: () => Promise<any>;
}
/**
 * Get or create the singleton platform wallet.
 * Returns a CDP-managed wallet — no private keys needed.
 */
export declare function getPlatformWallet(): Promise<PlatformWallet>;
/**
 * Fund an agent wallet with USDC from the platform treasury.
 * Returns the real tx hash.
 */
export declare function fundAgent(toAddress: string, amountUsdc: number): Promise<string>;
/**
 * Send ETH (for gas) from treasury to an agent wallet.
 * Returns the real tx hash.
 */
export declare function fundAgentEth(toAddress: string, amountEth: number): Promise<string>;
