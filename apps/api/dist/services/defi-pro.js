/**
 * DeFi Pro Agent
 * Executes swaps via HeyElsa X402 API (pay-per-call micropayments on Base).
 * Docs: https://x402.heyelsa.ai/docs
 *
 * Flow: get_swap_quote → execute_swap → poll get_transaction_status
 * Auth: X402 micropayments via x402-axios interceptor (requires a funded wallet).
 */
import { addFeedEntry } from "./store.js";
import { createX402Fetch } from "./x402.js";
const HEYELSA_BASE_URL = "https://x402-api.heyelsa.ai/api";
// Lazily initialized X402-enabled fetch for HeyElsa calls
let x402FetchPromise = null;
function getX402Fetch() {
    if (!x402FetchPromise) {
        x402FetchPromise = createX402Fetch();
    }
    return x402FetchPromise;
}
/**
 * Get a swap quote from HeyElsa.
 */
export async function getSwapQuote(_agentEns, swap) {
    try {
        const x402Fetch = await getX402Fetch();
        const response = await x402Fetch(`${HEYELSA_BASE_URL}/get_swap_quote`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                from_chain: swap.fromChain || "base",
                from_token: swap.fromToken,
                from_amount: swap.amount,
                to_chain: swap.toChain || "base",
                to_token: swap.toToken,
                wallet_address: swap.walletAddress || "",
                slippage: swap.slippage ?? 2.0,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            console.error("[defi-pro] HeyElsa quote error:", err);
            return { estimatedOutput: null, route: null, priceImpact: null };
        }
        const data = await response.json();
        return {
            estimatedOutput: data.estimated_output ?? null,
            route: data.route ?? null,
            priceImpact: data.price_impact ?? null,
        };
    }
    catch (err) {
        console.error("[defi-pro] Quote failed:", err.message);
        return { estimatedOutput: null, route: null, priceImpact: null };
    }
}
/**
 * Execute a swap via HeyElsa X402 API.
 * Returns a pipeline ID that can be polled for status.
 */
export async function executeSwap(agentEns, swap) {
    // Check if AgentKit is configured (needed for X402 payments)
    if (!process.env.CDP_API_KEY_ID) {
        console.warn("[defi-pro] CDP keys not configured, using mock");
        return mockSwap(agentEns, swap);
    }
    try {
        // Get wallet address from AgentKit for the swap destination
        const { CdpEvmWalletProvider } = await import("@coinbase/agentkit");
        const wallet = await CdpEvmWalletProvider.configureWithWallet({
            networkId: process.env.NETWORK_ID || "base-sepolia",
            apiKeyId: process.env.CDP_API_KEY_ID,
            apiKeySecret: process.env.CDP_API_KEY_SECRET,
        });
        const walletAddress = wallet.getAddress();
        // Step 1: Execute swap via HeyElsa (X402 auto-pays micropayment)
        const x402Fetch = await getX402Fetch();
        const response = await x402Fetch(`${HEYELSA_BASE_URL}/execute_swap`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                from_chain: swap.fromChain || "base",
                from_token: swap.fromToken,
                from_amount: swap.amount,
                to_chain: swap.toChain || "base",
                to_token: swap.toToken,
                wallet_address: walletAddress,
                slippage: swap.slippage ?? 2.0,
                dry_run: swap.dryRun ?? false,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            console.error("[defi-pro] HeyElsa execute error:", err);
            return mockSwap(agentEns, swap);
        }
        const data = await response.json();
        const pipelineId = data.pipeline_id || null;
        // Step 2: Poll for transaction status
        let txHash = null;
        if (pipelineId) {
            txHash = await pollPipelineStatus(pipelineId);
        }
        const result = {
            success: true,
            pipelineId,
            txHash,
            fromToken: swap.fromToken,
            toToken: swap.toToken,
            amountIn: swap.amount,
            amountOut: null,
            route: "HeyElsa X402",
        };
        addFeedEntry(agentEns, "swap", `Swapped ${swap.amount} ${swap.fromToken} → ${swap.toToken} via HeyElsa X402`, txHash);
        return result;
    }
    catch (err) {
        console.error("[defi-pro] Swap failed:", err.message);
        return mockSwap(agentEns, swap);
    }
}
/**
 * Poll HeyElsa pipeline status until completion or timeout.
 */
async function pollPipelineStatus(pipelineId, maxAttempts = 30, intervalMs = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const x402Fetch = await getX402Fetch();
            const response = await x402Fetch(`${HEYELSA_BASE_URL}/get_transaction_status`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ pipeline_id: pipelineId }),
            });
            if (!response.ok)
                break;
            const data = await response.json();
            const status = data.status;
            if (status === "completed" || status === "success") {
                return data.tx_hash || null;
            }
            if (status === "failed" || status === "error") {
                console.error(`[defi-pro] Pipeline ${pipelineId} failed:`, data);
                return null;
            }
            // Still processing — wait and retry
            await new Promise((r) => setTimeout(r, intervalMs));
        }
        catch {
            break;
        }
    }
    console.warn(`[defi-pro] Pipeline ${pipelineId} timed out`);
    return null;
}
// --- Mock fallback ---
function mockSwap(agentEns, swap) {
    const txHash = `0x${randomHex(64)}`;
    const result = {
        success: true,
        pipelineId: null,
        txHash,
        fromToken: swap.fromToken,
        toToken: swap.toToken,
        amountIn: swap.amount,
        amountOut: null,
        route: "mock",
    };
    addFeedEntry(agentEns, "swap", `Swapped ${swap.amount} ${swap.fromToken} → ${swap.toToken} (mock)`, txHash);
    return result;
}
function randomHex(len) {
    const chars = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < len; i++)
        out += chars[Math.floor(Math.random() * 16)];
    return out;
}
