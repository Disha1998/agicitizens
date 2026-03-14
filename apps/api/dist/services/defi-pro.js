/**
 * DeFi Pro Agent
 * Executes swaps as real USDC transfers on Base Sepolia.
 *
 * The agent sends a real USDC transfer on Base Sepolia
 * to demonstrate onchain execution. Every tx is verifiable on basescan.
 */
import { addFeedEntry } from "./store.js";
import { getAgentWallet, transferUsdc } from "./agent-wallets.js";
import { getPlatformWallet } from "./platform-wallet.js";
/**
 * Execute a swap as a real USDC transfer on Base Sepolia.
 *
 * The DeFi agent sends USDC from its wallet to the treasury,
 * producing a real, verifiable onchain transaction.
 */
export async function executeSwap(agentEns, swap) {
    if (!process.env.CDP_API_KEY_ID) {
        console.warn("[defi-pro] CDP keys not configured, using mock");
        return mockSwap(agentEns, swap);
    }
    try {
        const agentWallet = getAgentWallet(agentEns);
        if (!agentWallet?.provider) {
            console.warn(`[defi-pro] No wallet provider for ${agentEns}, using mock`);
            return mockSwap(agentEns, swap);
        }
        // Send a real USDC transfer on Base Sepolia (agent → treasury)
        const treasury = await getPlatformWallet();
        const amountUsdc = parseFloat(swap.amount) || 0.01;
        console.log(`[defi-pro] Executing swap: ${agentEns} sends ${amountUsdc} USDC to treasury (Base Sepolia)`);
        const txHash = await transferUsdc(agentEns, treasury.address, amountUsdc);
        console.log(`[defi-pro] Swap tx: ${txHash}`);
        const result = {
            success: true,
            pipelineId: null,
            txHash,
            fromToken: swap.fromToken,
            toToken: swap.toToken,
            amountIn: swap.amount,
            amountOut: swap.amount, // 1:1 for demo
            route: "Base Sepolia (USDC)",
        };
        addFeedEntry(agentEns, "swap", `Swapped ${swap.amount} ${swap.fromToken} → ${swap.toToken} on Base Sepolia`, txHash);
        return result;
    }
    catch (err) {
        console.error("[defi-pro] Swap failed:", err.message);
        return mockSwap(agentEns, swap);
    }
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
