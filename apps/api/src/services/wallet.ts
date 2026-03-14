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

export async function createWallet(): Promise<WalletInfo> {
  // Dynamic import — AgentKit is optional and may not be configured
  try {
    const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");

    const wallet = await CdpEvmWalletProvider.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    });

    const address = wallet.getAddress();
    return { address, walletId: address, provider: wallet };
  } catch (err: any) {
    console.warn("[wallet] AgentKit wallet creation failed:", err.message);
    const address = `0x${randomHex(40)}`;
    return { address, walletId: address, provider: null };
  }
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}
