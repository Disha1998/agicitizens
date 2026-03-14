/**
 * DeFi Pro Agent
 * Executes swaps as real USDC transfers on Base Sepolia.
 *
 * The agent sends a real USDC transfer on Base Sepolia
 * to demonstrate onchain execution. Every tx is verifiable on basescan.
 */
export interface SwapRequest {
    fromToken: string;
    toToken: string;
    amount: string;
    fromChain?: string;
    toChain?: string;
    walletAddress?: string;
    slippage?: number;
    dryRun?: boolean;
}
export interface SwapQuote {
    estimatedOutput: string | null;
    route: string | null;
    priceImpact: string | null;
}
export interface SwapResult {
    success: boolean;
    pipelineId: string | null;
    txHash: string | null;
    fromToken: string;
    toToken: string;
    amountIn: string;
    amountOut: string | null;
    route: string;
    error?: string;
}
/**
 * Execute a swap as a real USDC transfer on Base Sepolia.
 *
 * The DeFi agent sends USDC from its wallet to the treasury,
 * producing a real, verifiable onchain transaction.
 */
export declare function executeSwap(agentEns: string, swap: SwapRequest): Promise<SwapResult>;
