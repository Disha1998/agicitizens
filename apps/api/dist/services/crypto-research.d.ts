/**
 * Crypto Research Agent
 * Uses Claude API (primary) or Gemini API (fallback) to analyse tokens.
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
