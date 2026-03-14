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
 * No private keys in env vars. Treasury address comes from CDP platform wallet.
 *
 * Docs: https://docs.x402.org/getting-started/quickstart-for-sellers
 */
import { createPublicClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { getPaymentNetwork } from "@agicitizens/shared";
import { services, citizens } from "./store.js";
import { getPlatformWallet } from "./platform-wallet.js";
const paymentNet = getPaymentNetwork();
// CAIP-2 identifier for X402 (always Base chain)
function getNetwork() {
    return `eip155:${paymentNet.chainId}`;
}
function getChain() {
    return paymentNet.chainId === 8453 ? base : baseSepolia;
}
/**
 * Find an agent's wallet by matching their ENS name prefix.
 * e.g. "cryptoresearch" matches "cryptoresearch.agicitizens.eth"
 */
function findAgentWallet(namePrefix) {
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
async function resolveRoutePricing(req) {
    const method = req.method;
    const path = req.path;
    // POST /api/v1/register → $1.00 → treasury (CDP platform wallet)
    if (method === "POST" && path.endsWith("/register")) {
        const wallet = await getPlatformWallet();
        return {
            price: "$1.00",
            payTo: wallet.address,
            description: "Register a new citizen on AGICitizens",
        };
    }
    // POST /api/v1/agents/research → $0.01 → cryptoresearch agent
    if (method === "POST" && path.endsWith("/agents/research")) {
        const agentWallet = findAgentWallet("cryptoresearch");
        if (!agentWallet)
            return null; // agent not registered yet, let it through
        return {
            price: "$0.01",
            payTo: agentWallet,
            description: "AI-powered crypto research via Claude",
        };
    }
    // POST /api/v1/agents/swap → $0.02 → defipro agent
    if (method === "POST" && path.endsWith("/agents/swap")) {
        const agentWallet = findAgentWallet("defipro");
        if (!agentWallet)
            return null; // agent not registered yet, let it through
        return {
            price: "$0.02",
            payTo: agentWallet,
            description: "Execute DeFi swap on Base Sepolia",
        };
    }
    // POST /api/v1/hire → dynamic price → target agent's wallet
    if (method === "POST" && path.endsWith("/hire")) {
        const { service_id, to_ens } = req.body || {};
        if (!service_id || !to_ens)
            return null; // let handler return 400
        const service = services.get(service_id);
        if (!service)
            return null; // let handler return 404
        const target = citizens.get(to_ens);
        if (!target)
            return null; // let handler return 404
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
 * Server never touches anyone's money — only verifies proof of payment.
 */
export async function buildPaymentMiddleware() {
    const { x402ResourceServer } = await import("@x402/express");
    const { ExactEvmScheme } = await import("@x402/evm/exact/server");
    const { HTTPFacilitatorClient } = await import("@x402/core/server");
    const facilitatorClient = new HTTPFacilitatorClient({
        url: "https://x402.org/facilitator",
    });
    const network = getNetwork();
    const resourceServer = new x402ResourceServer(facilitatorClient).register(network, new ExactEvmScheme());
    const wallet = await getPlatformWallet();
    console.log(`[x402] Payment middleware configured on ${network}`);
    console.log(`[x402] Treasury: ${wallet.address}`);
    return async function paymentMiddleware(req, res, next) {
        const pricing = await resolveRoutePricing(req);
        if (!pricing)
            return next();
        const { price, payTo, description } = pricing;
        const paymentHeader = req.headers["x-payment"];
        if (!paymentHeader) {
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
        try {
            const paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
            const paymentRequirements = await resourceServer.buildPaymentRequirements({
                scheme: "exact",
                price,
                network,
                payTo,
            });
            const matchedRequirements = resourceServer.findMatchingRequirements(paymentRequirements, paymentPayload);
            if (!matchedRequirements) {
                res.status(402).json({
                    error: "No matching payment requirements",
                    accepts: paymentRequirements,
                });
                return;
            }
            const verification = await resourceServer.verifyPayment(paymentPayload, matchedRequirements);
            if (!verification.isValid) {
                res.status(402).json({
                    error: "Payment verification failed",
                    reason: verification.invalidReason,
                    accepts: paymentRequirements,
                });
                return;
            }
            req.x402Payment = {
                verified: true,
                payer: verification.payer || null,
                amount: parseFloat(price.replace("$", "")),
                payTo,
            };
            resourceServer
                .settlePayment(paymentPayload, matchedRequirements)
                .catch((err) => console.error("[x402] settle failed:", err.message));
            next();
        }
        catch (err) {
            console.error("[x402] verification error:", err.message);
            res.status(500).json({ error: "Payment verification error" });
        }
    };
}
/**
 * Create an X402-enabled fetch client (buyer side).
 * Uses CDP platform wallet to sign payments — no private keys needed.
 */
export async function createX402Fetch() {
    const wallet = await getPlatformWallet();
    const viemAccount = await wallet.getViemAccount();
    if (!viemAccount) {
        console.warn("[x402] No platform wallet configured — using plain fetch");
        return fetch;
    }
    try {
        const { wrapFetchWithPayment } = await import("@x402/fetch");
        const { x402Client } = await import("@x402/core/client");
        const { registerExactEvmScheme } = await import("@x402/evm/exact/client");
        const { toClientEvmSigner } = await import("@x402/evm");
        const chain = getChain();
        const publicClient = createPublicClient({ chain, transport: http() });
        const signer = toClientEvmSigner(viemAccount, publicClient);
        // registerExactEvmScheme handles both v2 (eip155:*) and v1 (all known network names)
        const client = new x402Client();
        registerExactEvmScheme(client, { signer });
        return wrapFetchWithPayment(fetch, client);
    }
    catch (err) {
        console.warn("[x402] X402 fetch init failed:", err.message, "— using plain fetch");
        return fetch;
    }
}
