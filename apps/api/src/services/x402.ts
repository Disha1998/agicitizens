/**
 * X402 payment integration using the official @x402 SDK.
 *
 * The server is a NOTARY, not a bank:
 * - Middleware returns 402 with price + payTo address
 * - Caller pays directly from their wallet → target wallet
 * - Middleware verifies proof of payment via facilitator
 * - Server never touches anyone's money
 *
 * All paid routes use dynamic pricing/payTo:
 *   /register  → $1.00 → treasury wallet (platform)
 *   /research  → $0.01 → cryptoresearch agent's wallet
 *   /swap      → $0.02 → defipro agent's wallet
 *   /hire      → service price → target agent's wallet
 *
 * Agent wallets are looked up from the store at request time,
 * not at middleware setup time (they don't exist yet at startup).
 *
 * Docs: https://docs.x402.org/getting-started/quickstart-for-sellers
 */

import type { Request, Response, NextFunction } from "express";
import { createPublicClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { services, citizens } from "./store.js";

// CAIP-2 network identifiers
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
 * Get the treasury (platform) wallet address.
 */
function getTreasuryAddress(): string {
  if (process.env.X402_PAY_TO_ADDRESS) {
    return process.env.X402_PAY_TO_ADDRESS;
  }
  if (process.env.ENS_OWNER_PRIVATE_KEY) {
    const account = privateKeyToAccount(
      process.env.ENS_OWNER_PRIVATE_KEY as `0x${string}`,
    );
    return account.address;
  }
  return "0x0000000000000000000000000000000000000000";
}

/**
 * Find an agent's wallet by matching their ENS name prefix.
 * e.g. "cryptoresearch" matches "cryptoresearch.agicitizens.eth"
 */
function findAgentWallet(namePrefix: string): string | null {
  for (const [ensName, citizen] of citizens) {
    if (ensName.startsWith(namePrefix + ".")) {
      return citizen.wallet;
    }
  }
  return null;
}

/**
 * Route pricing config — resolved at request time.
 * Returns { price, payTo, description } or null if route is not paid.
 */
function resolveRoutePricing(
  req: Request,
): { price: string; payTo: string; description: string } | null {
  const method = req.method;
  const path = req.path;

  // POST /api/v1/register → $1.00 → treasury
  if (method === "POST" && path.endsWith("/register")) {
    return {
      price: "$1.00",
      payTo: getTreasuryAddress(),
      description: "Register a new citizen on AGICitizens",
    };
  }

  // POST /api/v1/agents/research → $0.01 → cryptoresearch agent
  if (method === "POST" && path.endsWith("/agents/research")) {
    const agentWallet = findAgentWallet("cryptoresearch");
    if (!agentWallet) return null; // agent not registered yet, let it through
    return {
      price: "$0.01",
      payTo: agentWallet,
      description: "AI-powered crypto research via Claude",
    };
  }

  // POST /api/v1/agents/swap → $0.02 → defipro agent
  if (method === "POST" && path.endsWith("/agents/swap")) {
    const agentWallet = findAgentWallet("defipro");
    if (!agentWallet) return null; // agent not registered yet, let it through
    return {
      price: "$0.02",
      payTo: agentWallet,
      description: "Execute DeFi swap via HeyElsa X402",
    };
  }

  // POST /api/v1/hire → dynamic price → target agent's wallet
  if (method === "POST" && path.endsWith("/hire")) {
    const { service_id, to_ens } = req.body || {};
    if (!service_id || !to_ens) return null; // let handler return 400

    const service = services.get(service_id);
    if (!service) return null; // let handler return 404

    const target = citizens.get(to_ens);
    if (!target) return null; // let handler return 404

    const priceUsdc = req.body.amount_usdc ?? service.priceUsdc;
    return {
      price: `$${priceUsdc}`,
      payTo: target.wallet,
      description: `Hire ${to_ens} for "${service.title}"`,
    };
  }

  return null; // not a paid route
}

/**
 * Build the unified X402 payment middleware.
 *
 * Handles ALL paid routes with dynamic pricing + payTo:
 *
 * Flow:
 * 1. Caller POSTs to a paid endpoint
 * 2. Middleware resolves price + payTo from store (at request time)
 * 3. No X-PAYMENT header → returns 402 with price + payTo
 * 4. Caller's wrapFetchWithPayment pays the target directly
 * 5. Caller retries with X-PAYMENT proof header
 * 6. Middleware verifies payment via facilitator
 * 7. Route handler runs
 *
 * Server never touches anyone's money.
 */
export async function buildPaymentMiddleware() {
  const { x402ResourceServer } = await import("@x402/express");
  const { ExactEvmScheme } = await import("@x402/evm/exact/server");
  const { HTTPFacilitatorClient } = await import("@x402/core/server");

  const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://x402.org/facilitator",
  });

  const network = getNetwork();

  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    network,
    new ExactEvmScheme(),
  );

  console.log(`[x402] Payment middleware configured on ${network}`);
  console.log(`[x402] Treasury: ${getTreasuryAddress()}`);

  return async function paymentMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Resolve pricing for this route (dynamic, at request time)
    const pricing = resolveRoutePricing(req);
    if (!pricing) return next(); // not a paid route or missing data

    const { price, payTo, description } = pricing;

    // Check if caller already provided payment proof
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      // No payment yet — return 402 with pricing
      res.status(402).json({
        error: "Payment Required",
        accepts: [
          { scheme: "exact", price, network, payTo },
        ],
        description,
        mimeType: "application/json",
      });
      return;
    }

    // Payment header present — verify via facilitator
    try {
      const paymentRequirements = [
        { scheme: "exact" as const, price, network, payTo },
      ];

      const verification = await resourceServer.verifyPayment(
        paymentHeader,
        paymentRequirements,
      );

      if (!verification.isValid) {
        res.status(402).json({
          error: "Payment verification failed",
          reason: verification.reason,
          accepts: paymentRequirements.map((r) => ({
            ...r,
            description,
            mimeType: "application/json",
          })),
        });
        return;
      }

      // Payment verified — attach proof for route handlers
      (req as any).x402Payment = {
        verified: true,
        txHash: verification.txHash || null,
        amount: parseFloat(price.replace("$", "")),
        payTo,
      };

      // Settle the payment (tell facilitator to release funds)
      resourceServer
        .settlePayment(paymentHeader, paymentRequirements)
        .catch((err: any) =>
          console.error("[x402] settle failed:", err.message),
        );

      next();
    } catch (err: any) {
      console.error("[x402] verification error:", err.message);
      res.status(500).json({ error: "Payment verification error" });
    }
  };
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

  const signer = toClientEvmSigner(account, publicClient);

  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(signer));

  return wrapFetchWithPayment(fetch, client);
}
