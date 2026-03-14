/**
 * Crypto Research Agent
 * Uses Claude API (primary) or Gemini API (fallback) to analyse tokens.
 */
import { addFeedEntry } from "./store.js";
const SYSTEM_PROMPT = 'You are a crypto research analyst. Respond with JSON only: { "analysis": string, "sentiment": "bullish"|"bearish"|"neutral", "confidence": number (0-100), "sources": string[] }. Be concise and data-driven. IMPORTANT: Only reference events and upgrades that have already happened. Do NOT mention upcoming events unless you are certain they have not occurred yet. The Dencun upgrade, Shapella upgrade, and Bitcoin halving (April 2024) have already happened.';
function buildPrompt(query) {
    const today = new Date().toISOString().split("T")[0];
    return query.question
        ? `Today is ${today}. Analyze the cryptocurrency ${query.token}. Specific question: ${query.question}. Provide sentiment (bullish/bearish/neutral), confidence (0-100), and a concise analysis. Only reference past events, not upcoming ones you're unsure about.`
        : `Today is ${today}. Analyze the cryptocurrency ${query.token}. Provide current sentiment (bullish/bearish/neutral), confidence score (0-100), key price drivers, and a concise analysis. Only reference events that have already occurred — do not speculate about upcoming upgrades or events.`;
}
function parseResponse(text, source) {
    try {
        // Try to extract JSON from the response (Gemini sometimes wraps in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        return {
            analysis: parsed.analysis || text,
            sentiment: parsed.sentiment || "neutral",
            confidence: parsed.confidence || 50,
            sources: parsed.sources || [source],
        };
    }
    catch {
        return {
            analysis: text,
            sentiment: "neutral",
            confidence: 50,
            sources: [source],
        };
    }
}
/* ── Claude API ── */
async function tryClaude(prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey)
        return null;
    try {
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
                messages: [{ role: "user", content: prompt }],
                system: SYSTEM_PROMPT,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            console.warn("[crypto-research] Claude API error:", err);
            return null;
        }
        const data = await response.json();
        return data.content?.[0]?.text || null;
    }
    catch (err) {
        console.warn("[crypto-research] Claude request failed:", err.message);
        return null;
    }
}
/* ── Gemini API ── */
async function tryGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        return null;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${SYSTEM_PROMPT}\n\n${prompt}` },
                        ],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.3,
                },
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            console.warn("[crypto-research] Gemini API error:", err);
            return null;
        }
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    catch (err) {
        console.warn("[crypto-research] Gemini request failed:", err.message);
        return null;
    }
}
/* ── Main ── */
export async function runResearch(agentEns, query) {
    const prompt = buildPrompt(query);
    // Try Claude first, then Gemini, then mock
    const claudeText = await tryClaude(prompt);
    if (claudeText) {
        console.log("[crypto-research] Using Claude API response");
        const parsed = parseResponse(claudeText, "Claude AI analysis");
        const result = { token: query.token, ...parsed };
        addFeedEntry(agentEns, "research", `Analyzed ${query.token} — ${result.sentiment} (${result.confidence}% confidence)`);
        return result;
    }
    const geminiText = await tryGemini(prompt);
    if (geminiText) {
        console.log("[crypto-research] Using Gemini API response (Claude unavailable)");
        const parsed = parseResponse(geminiText, "Gemini AI analysis");
        const result = { token: query.token, ...parsed };
        addFeedEntry(agentEns, "research", `Analyzed ${query.token} — ${result.sentiment} (${result.confidence}% confidence)`);
        return result;
    }
    console.warn("[crypto-research] No AI API available, returning mock");
    return mockResearch(agentEns, query);
}
function mockResearch(agentEns, query) {
    const result = {
        token: query.token,
        analysis: `Mock analysis for ${query.token}. Set ANTHROPIC_API_KEY or GEMINI_API_KEY for live AI-powered research.`,
        sentiment: "neutral",
        confidence: 50,
        sources: ["mock"],
    };
    addFeedEntry(agentEns, "research", `Analyzed ${query.token} (mock) — neutral`);
    return result;
}
