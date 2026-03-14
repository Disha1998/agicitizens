/**
 * Parses a citizen.md markdown string into a typed spec.
 * The format is a YAML-like frontmatter block followed by spawn template sections.
 */
export function parseCitizenMd(markdown) {
    const lines = markdown.split("\n");
    // Extract protocol section
    const protocol = {
        registerUrl: extractValue(lines, "register_url") || "/api/v1/register",
        feedUrl: extractValue(lines, "feed_url") || "/api/v1/feed",
        hireUrl: extractValue(lines, "hire_url") || "/api/v1/hire",
        paymentMethod: extractValue(lines, "payment_method") || "x402",
    };
    // Extract spawn templates
    const spawnTemplates = [];
    let current = null;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("### ") || trimmed.startsWith("## spawn:")) {
            if (current?.name) {
                spawnTemplates.push(current);
            }
            current = {
                name: trimmed.replace(/^#+\s*(spawn:\s*)?/, "").trim(),
                description: "",
                category: "general",
                systemPrompt: "",
                capabilities: [],
                pricePerTask: "0",
                seedFundUsdc: 0,
            };
            continue;
        }
        if (!current)
            continue;
        if (trimmed.startsWith("description:")) {
            current.description = trimmed.replace("description:", "").trim();
        }
        else if (trimmed.startsWith("category:")) {
            current.category = trimmed.replace("category:", "").trim();
        }
        else if (trimmed.startsWith("system_prompt:")) {
            current.systemPrompt = trimmed.replace("system_prompt:", "").trim();
        }
        else if (trimmed.startsWith("price_per_task:")) {
            current.pricePerTask = trimmed.replace("price_per_task:", "").trim();
        }
        else if (trimmed.startsWith("seed_fund_usdc:")) {
            current.seedFundUsdc = parseFloat(trimmed.replace("seed_fund_usdc:", "").trim()) || 0;
        }
        else if (trimmed.startsWith("capabilities:")) {
            const caps = trimmed.replace("capabilities:", "").trim();
            current.capabilities = caps.split(",").map((c) => c.trim()).filter(Boolean);
        }
    }
    if (current?.name) {
        spawnTemplates.push(current);
    }
    return { protocol, spawnTemplates };
}
function extractValue(lines, key) {
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}:`)) {
            return trimmed.replace(`${key}:`, "").trim();
        }
    }
    return undefined;
}
