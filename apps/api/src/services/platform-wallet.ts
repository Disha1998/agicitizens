/**
 * Platform wallet — a singleton CDP-managed wallet for the platform.
 *
 * Replaces ENS_OWNER_PRIVATE_KEY entirely:
 * - Treasury address for X402 /register fees
 * - ENS domain owner (signs createSubname / setTextRecord)
 * - X402 buyer-side signer (pays HeyElsa for swaps)
 *
 * No private keys in env vars. CDP manages key security.
 * Only needs: CDP_API_KEY_ID + CDP_API_KEY_SECRET (API credentials).
 */

let platformWalletPromise: Promise<PlatformWallet> | null = null;

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
export function getPlatformWallet(): Promise<PlatformWallet> {
  if (!platformWalletPromise) {
    platformWalletPromise = initPlatformWallet();
  }
  return platformWalletPromise;
}

async function initPlatformWallet(): Promise<PlatformWallet> {
  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    console.warn("[platform-wallet] CDP keys not set — using mock wallet");
    return createMockWallet();
  }

  try {
    const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");

    const provider = await CdpEvmWalletProvider.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    });

    const address = provider.getAddress();
    console.log(`[platform-wallet] CDP wallet ready: ${address}`);

    return {
      address,
      sendTransaction: async (tx) => {
        return provider.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: tx.value ?? 0n,
        });
      },
      getViemAccount: async () => {
        // CDP wallet provider can act as a signer
        // Return the provider itself — it has sign methods
        return provider;
      },
    };
  } catch (err: any) {
    console.warn("[platform-wallet] CDP init failed:", err.message);
    return createMockWallet();
  }
}

function createMockWallet(): PlatformWallet {
  const chars = "0123456789abcdef";
  let hex = "";
  for (let i = 0; i < 40; i++) hex += chars[Math.floor(Math.random() * 16)];
  const address = `0x${hex}`;

  console.log(`[platform-wallet] MOCK wallet: ${address}`);

  return {
    address,
    sendTransaction: async () => {
      const txHex = Array.from({ length: 64 }, () =>
        chars[Math.floor(Math.random() * 16)],
      ).join("");
      return `0x${txHex}`;
    },
    getViemAccount: async () => null,
  };
}
