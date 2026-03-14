/**
 * DeFi Pro Agent
 * Executes swaps via HeyElsa X402 API (pay-per-call micropayments on Base).
 * Docs: https://x402.heyelsa.ai/docs
 *
 * Flow: get_swap_quote → execute_swap → poll get_transaction_status
 * Auth: X402 micropayments via x402-axios interceptor (requires a funded wallet).
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
 * Get a swap quote from HeyElsa.
 */
export declare function getSwapQuote(_agentEns: string, swap: SwapRequest): Promise<SwapQuote>;
/**
 * Execute a swap via HeyElsa X402 API.
 * Returns a pipeline ID that can be polled for status.
 */
export declare function executeSwap(agentEns: string, swap: SwapRequest): Promise<SwapResult>;
