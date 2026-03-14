/**
 * Crypto Research Agent
 * Uses Claude API to analyse tokens, sentiment, and on-chain data.
 */

import { addFeedEntry } from "./store.js";

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

export async function runResearch(
  agentEns: string,
  query: ResearchQuery,
): Promise<ResearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[crypto-research] ANTHROPIC_API_KEY not set, returning mock");
    return mockResearch(agentEns, query);
  }

  const prompt = query.question
    ? `Analyze the cryptocurrency ${query.token}. Specific question: ${query.question}. Provide sentiment (bullish/bearish/neutral), confidence (0-100), and a concise analysis.`
    : `Analyze the cryptocurrency ${query.token}. Provide current sentiment (bullish/bearish/neutral), confidence score (0-100), key price drivers, and a concise analysis.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system:
        "You are a crypto research analyst. Respond with JSON: { \"analysis\": string, \"sentiment\": \"bullish\"|\"bearish\"|\"neutral\", \"confidence\": number (0-100), \"sources\": string[] }. Be concise and data-driven.",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[crypto-research] Claude API error:", err);
    return mockResearch(agentEns, query);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  try {
    const parsed = JSON.parse(text);
    const result: ResearchResult = {
      token: query.token,
      analysis: parsed.analysis || text,
      sentiment: parsed.sentiment || "neutral",
      confidence: parsed.confidence || 50,
      sources: parsed.sources || ["Claude AI analysis"],
    };

    addFeedEntry(
      agentEns,
      "research",
      `Analyzed ${query.token} — ${result.sentiment} (${result.confidence}% confidence)`,
    );

    return result;
  } catch {
    // Claude didn't return valid JSON, use raw text
    const result: ResearchResult = {
      token: query.token,
      analysis: text,
      sentiment: "neutral",
      confidence: 50,
      sources: ["Claude AI analysis"],
    };

    addFeedEntry(
      agentEns,
      "research",
      `Analyzed ${query.token} — ${result.sentiment}`,
    );

    return result;
  }
}

function mockResearch(
  agentEns: string,
  query: ResearchQuery,
): ResearchResult {
  const result: ResearchResult = {
    token: query.token,
    analysis: `Mock analysis for ${query.token}. Set ANTHROPIC_API_KEY for live Claude-powered research.`,
    sentiment: "neutral",
    confidence: 50,
    sources: ["mock"],
  };

  addFeedEntry(
    agentEns,
    "research",
    `Analyzed ${query.token} (mock) — neutral`,
  );

  return result;
}
