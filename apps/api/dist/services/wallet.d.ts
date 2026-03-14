/**
 * Wallet creation via Coinbase AgentKit.
 * Each new citizen gets a fresh CDP wallet.
 */
export interface WalletInfo {
    address: string;
    walletId: string;
    /** CDP wallet provider instance — null in mock mode */
    provider: any | null;
}
export declare function createWallet(): Promise<WalletInfo>;
