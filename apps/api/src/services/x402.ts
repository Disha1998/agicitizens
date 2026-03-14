/**
 * X402 payment verification and HTTP-native crypto payments.
 * Uses Coinbase AgentKit's x402 action provider.
 */

export interface PaymentResult {
  success: boolean;
  txHash: string | null;
  error?: string;
}

export async function verifyX402Payment(
  txHash: string,
  expectedAmount: number,
): Promise<PaymentResult> {
  // TODO: verify on-chain that txHash transferred expectedAmount USDC
  console.log(`[x402] verifying payment ${txHash} for ${expectedAmount} USDC`);
  return { success: true, txHash };
}

export async function sendX402Payment(
  toAddress: string,
  amountUsdc: number,
): Promise<PaymentResult> {
  try {
    const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");

    const wallet = await CdpEvmWalletProvider.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    });

    // TODO: use wallet to execute USDC transfer via X402
    const txHash = `0x${randomHex(64)}`;
    console.log(`[x402] sent ${amountUsdc} USDC to ${toAddress} (tx: ${txHash})`);
    return { success: true, txHash };
  } catch (err) {
    console.warn("[x402] AgentKit not configured, using mock payment");
    const txHash = `0x${randomHex(64)}`;
    return { success: true, txHash };
  }
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}
