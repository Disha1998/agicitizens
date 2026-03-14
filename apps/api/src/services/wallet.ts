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
export async function getOrCreateWallet(agentName: string): Promise<WalletInfo> {
  const walletName = `agicitizens-${agentName}`;

  try {
    console.log(`[wallet] getOrCreateAccount("${walletName}") on`, process.env.NETWORK_ID || "base-sepolia", "...");
    const { CdpClient } = await import("@coinbase/cdp-sdk");
    const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");

    // 1. Get or create the account by name (idempotent)
    const cdp = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    });

    const account = await cdp.evm.getOrCreateAccount({ name: walletName });
    const address = account.address;
    console.log(`[wallet] CDP account "${walletName}" → ${address}`);

    // 2. Create a wallet provider for signing (uses the same address)
    const provider = await CdpEvmWalletProvider.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
      address: address as `0x${string}`,
    });

    console.log(`[wallet] CDP wallet ready: ${provider.getAddress()}`);
    return { address, walletId: walletName, provider };
  } catch (err: any) {
    console.warn("[wallet] CDP wallet failed:", err.message);
    if (err.stack) console.warn("[wallet] Stack:", err.stack);
    const address = `0x${randomHex(40)}`;
    console.log(`[wallet] Using MOCK wallet: ${address}`);
    return { address, walletId: walletName, provider: null };
  }
}

/**
 * @deprecated Use getOrCreateWallet(name) instead.
 * Creates a new anonymous wallet (no name = no persistence).
 */
export async function createWallet(): Promise<WalletInfo> {
  // Fallback: create with a random name (not idempotent)
  const randomName = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return getOrCreateWallet(randomName);
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}
