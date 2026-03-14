/**
 * Crypto Research Agent
 * Uses Claude API to analyse tokens, sentiment, and on-chain data.
 */
export interface ResearchQuery {
    token: string;
    question?: string;
}
export interface ResearchResult {
    token: string;
    analysis: string;
    sentiment: "bullish" | "bearish" | "neutral";
    confidence: number;
    sources: string[];
}
export declare function runResearch(agentEns: string, query: ResearchQuery): Promise<ResearchResult>;
