/**
 * X402 payment integration using the official @x402 SDK.
 *
 * Seller side: paymentMiddleware protects paid API endpoints.
 * Buyer side: x402Fetch wraps fetch to auto-pay for X402-protected APIs.
 *
 * Docs: https://docs.x402.org/getting-started/quickstart-for-sellers
 */

import { createPublicClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export interface PaymentResult {
  success: boolean;
  txHash: string | null;
  error?: string;
}

// Base Sepolia CAIP-2 network identifier
const BASE_SEPOLIA_CAIP2 = "eip155:84532";
const BASE_MAINNET_CAIP2 = "eip155:8453";

function getNetwork() {
  return (process.env.NETWORK_ID || "base-sepolia") === "base"
    ? BASE_MAINNET_CAIP2
    : BASE_SEPOLIA_CAIP2;
}

function getChain() {
  return (process.env.NETWORK_ID || "base-sepolia") === "base"
    ? base
    : baseSepolia;
}

/**
 * Get the wallet address that receives X402 payments (seller).
 */
export function getPayToAddress(): string {
  if (process.env.X402_PAY_TO_ADDRESS) {
    return process.env.X402_PAY_TO_ADDRESS;
  }
  // Derive from ENS owner key if available
  if (process.env.ENS_OWNER_PRIVATE_KEY) {
    const account = privateKeyToAccount(
      process.env.ENS_OWNER_PRIVATE_KEY as `0x${string}`,
    );
    return account.address;
  }
  return "0x0000000000000000000000000000000000000000";
}

/**
 * Build the X402 payment middleware + resource server for Express.
 * Protects specified routes with per-call micropayments.
 *
 * Usage in server.ts:
 *   const { middleware } = await buildX402Middleware();
 *   app.use(middleware);
 */
export async function buildX402Middleware() {
  const { paymentMiddleware, x402ResourceServer } = await import(
    "@x402/express"
  );
  const { ExactEvmScheme } = await import("@x402/evm/exact/server");
  const { HTTPFacilitatorClient } = await import("@x402/core/server");

  const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://x402.org/facilitator",
  });

  const network = getNetwork();
  const payTo = getPayToAddress();

  // Define pricing for paid endpoints
  const routePricing: Record<string, any> = {
    "POST /api/v1/agents/research": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.01",
          network,
          payTo,
        },
      ],
      description: "AI-powered crypto research via Claude",
      mimeType: "application/json",
    },
    "POST /api/v1/agents/swap": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.02",
          network,
          payTo,
        },
      ],
      description: "Execute DeFi swap via HeyElsa X402",
      mimeType: "application/json",
    },
    "POST /api/v1/hire": {
      accepts: [
        {
          scheme: "exact",
          price: "$0.005",
          network,
          payTo,
        },
      ],
      description: "Hire an agent to perform a task",
      mimeType: "application/json",
    },
  };

  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    network,
    new ExactEvmScheme(),
  );

  const middleware = paymentMiddleware(routePricing, resourceServer);

  console.log(`[x402] Payment middleware configured on ${network}`);
  console.log(`[x402] Pay-to address: ${payTo}`);

  return { middleware };
}

/**
 * Create an X402-enabled fetch client (buyer side).
 * Used by our agents to call X402-protected external APIs (e.g., HeyElsa).
 * Automatically handles 402 responses, signs payments, and retries.
 */
export async function createX402Fetch(): Promise<typeof fetch> {
  if (!process.env.ENS_OWNER_PRIVATE_KEY) {
    console.warn("[x402] No private key configured — using plain fetch");
    return fetch;
  }

  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactEvmScheme } = await import("@x402/evm/exact/client");
  const { toClientEvmSigner } = await import("@x402/evm");

  const chain = getChain();
  const account = privateKeyToAccount(
    process.env.ENS_OWNER_PRIVATE_KEY as `0x${string}`,
  );
  const publicClient = createPublicClient({ chain, transport: http() });

  // Compose a full ClientEvmSigner from account + publicClient
  const signer = toClientEvmSigner(account, publicClient);

  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(signer));

  return wrapFetchWithPayment(fetch, client);
}

/**
 * Send a USDC payment to an address using AgentKit wallet.
 * Used for hire flow — direct wallet-to-wallet USDC transfer.
 */
export async function sendX402Payment(
  toAddress: string,
  amountUsdc: number,
): Promise<PaymentResult> {
  if (!process.env.CDP_API_KEY_ID) {
    console.warn("[x402] CDP keys not configured — cannot send payment");
    return { success: false, txHash: null, error: "CDP keys not configured" };
  }

  try {
    const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");
    const { encodeFunctionData, parseAbi } = await import("viem");

    const wallet = await CdpEvmWalletProvider.configureWithWallet({
      networkId: process.env.NETWORK_ID || "base-sepolia",
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    });

    // USDC addresses per network
    const usdcAddress =
      (process.env.NETWORK_ID || "base-sepolia") === "base"
        ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        : "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    const amountRaw = BigInt(Math.floor(amountUsdc * 1_000_000));

    const data = encodeFunctionData({
      abi: parseAbi([
        "function transfer(address to, uint256 amount) returns (bool)",
      ]),
      functionName: "transfer",
      args: [toAddress as `0x${string}`, amountRaw],
    });

    const txHash = await wallet.sendTransaction({
      to: usdcAddress as `0x${string}`,
      data,
      value: 0n,
    });

    console.log(`[x402] Sent ${amountUsdc} USDC to ${toAddress} (tx: ${txHash})`);
    return { success: true, txHash };
  } catch (err: any) {
    console.error("[x402] Payment failed:", err.message);
    return { success: false, txHash: null, error: err.message };
  }
}
