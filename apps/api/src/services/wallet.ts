/**
 * Wallet creation via Coinbase AgentKit.
 * Each new citizen gets a fresh CDP wallet, or reconnects to an existing one.
 */

export interface WalletInfo {
  address: string;
  walletId: string;
  /** CDP wallet provider instance — null in mock mode */
  provider: any | null;
}

/**
 * Create a new CDP wallet.
 */
export async function createWallet(): Promise<WalletInfo> {
  return getOrCreateWallet();
}

/**
 * Get or create a CDP wallet. If an address is provided, reconnects to that
 * existing wallet instead of creating a new one.
 */
export async function getOrCreateWallet(existingAddress?: string): Promise<WalletInfo> {
  try {
    const action = existingAddress ? "Reconnecting to" : "Creating";
    console.log(`[wallet] ${action} CDP wallet on`, process.env.NETWORK_ID || "base-sepolia", existingAddress ? `(${existingAddress})` : "", "...");
    const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");

    console.log("[wallet] CDP env check — API_KEY_ID:", process.env.CDP_API_KEY_ID ? "set" : "MISSING",
      "API_KEY_SECRET:", process.env.CDP_API_KEY_SECRET ? "set" : "MISSING",
      "WALLET_SECRET:", process.env.CDP_WALLET_SECRET ? "set" : "MISSING");

    const config: any = {
      networkId: process.env.NETWORK_ID || "base-sepolia",
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    };

    if (existingAddress) {
      config.address = existingAddress;
    }

    const wallet = await CdpEvmWalletProvider.configureWithWallet(config);

    const address = wallet.getAddress();
    console.log(`[wallet] CDP wallet ready: ${address}`);
    return { address, walletId: address, provider: wallet };
  } catch (err: any) {
    console.warn("[wallet] AgentKit wallet creation failed:", err.message);
    if (err.stack) console.warn("[wallet] Stack:", err.stack);
    if (err.cause) console.warn("[wallet] Cause:", err.cause);
    const address = existingAddress || `0x${randomHex(40)}`;
    console.log(`[wallet] Using MOCK wallet: ${address}`);
    return { address, walletId: address, provider: null };
  }
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}
