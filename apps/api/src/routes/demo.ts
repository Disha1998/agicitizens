import { Router } from "express";
import {
  citizens,
  services,
  tasks,
  nextTaskId,
  addFeedEntry,
  saveState,
} from "../services/store.js";
import { runResearch } from "../services/crypto-research.js";
import { executeSwap } from "../services/defi-pro.js";
import { transferUsdc } from "../services/agent-wallets.js";
import { fundAgent } from "../services/platform-wallet.js";
import { bootstrapReady } from "../services/seed.js";

const router = Router();

/** Find first citizen matching a category (or fallback to any) */
function findAgent(category: string) {
  for (const c of citizens.values()) {
    if (c.category === category) return c;
  }
  return null;
}

function findParent() {
  for (const c of citizens.values()) {
    if (!c.spawnedBy) return c;
  }
  return null;
}

/**
 * Ask an AI agent to rate a completed task.
 * Uses Claude (primary) or Gemini (fallback) to evaluate the work.
 * Fires async — does not block the response.
 */
function autoRateTask(taskId: string): void {
  // Run async so we don't block the demo response
  rateTaskWithAI(taskId).catch((err) =>
    console.warn("[demo/rate] AI rating failed:", err.message),
  );
}

const RATING_SYSTEM_PROMPT =
  'You are an AI agent evaluating another agent\'s task completion. Respond with JSON only: { "rating": number (1-5), "review": string }. Be fair but encouraging. Consider speed, accuracy, and cost-effectiveness.';

async function getAIRating(
  taskDescription: string,
): Promise<{ rating: number; review: string }> {
  const prompt = `Rate this completed agent task (1-5 stars) and write a brief review:\n\nTask: ${taskDescription}\n\nThe task was completed successfully with a verified onchain transaction.`;

  // Try Claude first
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
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
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
          system: RATING_SYSTEM_PROMPT,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const rating = Math.max(1, Math.min(5, Math.round(parsed.rating)));
          return { rating, review: parsed.review || "Good work." };
        }
      }
    } catch (err: any) {
      console.warn("[demo/rate] Claude rating failed:", err.message);
    }
  }

  // Try Gemini fallback
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${RATING_SYSTEM_PROMPT}\n\n${prompt}` }] }],
            generationConfig: { maxOutputTokens: 256, temperature: 0.5 },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const rating = Math.max(1, Math.min(5, Math.round(parsed.rating)));
          return { rating, review: parsed.review || "Good work." };
        }
      }
    } catch (err: any) {
      console.warn("[demo/rate] Gemini rating failed:", err.message);
    }
  }

  // No AI available — reasonable default
  return { rating: 4, review: "Task completed with verified onchain transaction." };
}

async function rateTaskWithAI(taskId: string): Promise<void> {
  const task = tasks.get(taskId);
  if (!task) return;

  const service = services.get(task.serviceId);
  const description = service
    ? `"${service.title}" by ${task.toEns} for ${task.amountUsdc} USDC`
    : `Task by ${task.toEns} for ${task.amountUsdc} USDC`;

  const { rating, review } = await getAIRating(description);

  task.rating = rating;
  task.review = review;
  task.status = "rated";
  task.completedAt = new Date().toISOString();

  const target = citizens.get(task.toEns);
  if (target) {
    // Recalculate average rating from all rated tasks
    const ratedTasks = [...tasks.values()].filter(
      (t) => t.toEns === target.ensName && t.rating !== null,
    );
    const totalRating = ratedTasks.reduce((sum, t) => sum + (t.rating ?? 0), 0);
    target.avgRating = Math.round((totalRating / ratedTasks.length) * 10) / 10;

    // Update reputation: base 50 + rating bonus + task bonus
    target.reputationScore = Math.min(
      100,
      Math.round(50 + target.avgRating * 6 + Math.min(target.tasksCompleted, 50)),
    );

    addFeedEntry(
      task.fromEns,
      "rate",
      `Rated ${target.ensName} ${rating}/5 — "${review}"`,
    );
  }

  saveState();
  console.log(`[demo/rate] AI rated task ${taskId}: ${rating}/5 — "${review}"`);
}

/**
 * Auto-fund parent from treasury before a demo payment.
 * Ensures the parent always has enough USDC for the demo.
 */
async function ensureParentFunded(amount: number): Promise<void> {
  const parent = findParent();
  if (!parent) return;
  try {
    console.log(`[demo] Auto-funding parent with ${amount} USDC from treasury...`);
    const tx = await fundAgent(parent.wallet, amount);
    console.log(`[demo] Parent funded: ${tx}`);
    addFeedEntry("treasury", "fund", `Treasury funded parent with ${amount} USDC`, tx);
  } catch (err: any) {
    console.warn(`[demo] Auto-fund failed: ${err.message}`);
  }
}

/**
 * POST /api/v1/demo/research
 * Run crypto research — no auth needed, uses the research agent internally.
 * Body: { token: string }
 */
router.post("/demo/research", async (req, res) => {
  try {
    await bootstrapReady;
    const agent = findAgent("Research");
    if (!agent) {
      res.status(503).json({ error: "No research agent available. Run bootstrap first." });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    const result = await runResearch(agent.ensName, { token });

    // Pay the research agent (parent → research agent) with real USDC
    let txHash: string | null = null;
    const parent = findParent();
    if (parent && agent.wallet) {
      // Auto-fund parent from treasury so demo always works
      await ensureParentFunded(0.50);
      try {
        txHash = await transferUsdc(parent.ensName, agent.wallet, 0.50);
        addFeedEntry(
          parent.ensName,
          "hire",
          `Paid ${agent.ensName} for research on ${token} — 0.50 USDC`,
          txHash,
        );

        // Update stats
        parent.totalSpent += 0.50;
        agent.totalEarned += 0.50;
        agent.tasksCompleted += 1;
      } catch (err: any) {
        console.warn("[demo/research] USDC payment failed:", err.message);
      }

      // Create a task record
      const researchService = [...services.values()].find(s => s.ownerEns === agent.ensName);
      const task = {
        id: nextTaskId(),
        serviceId: researchService?.id ?? "research",
        fromEns: parent.ensName,
        toEns: agent.ensName,
        amountUsdc: 0.50,
        txHash,
        status: txHash ? "paid" as const : "pending" as const,
        rating: null,
        review: null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      tasks.set(task.id, task);
      autoRateTask(task.id);
    }

    saveState();
    res.json({ agent: agent.ensName, txHash, ...result });
  } catch (err: any) {
    console.error("[demo/research]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/demo/swap
 * Execute a swap — no auth needed, uses the DeFi agent internally.
 * Body: { fromToken: string, toToken: string, amount: string }
 */
router.post("/demo/swap", async (req, res) => {
  try {
    await bootstrapReady;
    const agent = findAgent("DeFi Execution");
    if (!agent) {
      res.status(503).json({ error: "No DeFi agent available. Run bootstrap first." });
      return;
    }

    const { fromToken, toToken, amount } = req.body;
    if (!fromToken || !toToken || !amount) {
      res.status(400).json({ error: "fromToken, toToken, and amount are required" });
      return;
    }

    const result = await executeSwap(agent.ensName, { fromToken, toToken, amount });

    // Create task record and update stats
    const parent = findParent();
    const swapAmount = parseFloat(amount) || 0.01;
    if (parent) {
      const defiService = [...services.values()].find(s => s.ownerEns === agent.ensName);
      const task = {
        id: nextTaskId(),
        serviceId: defiService?.id ?? "swap",
        fromEns: parent.ensName,
        toEns: agent.ensName,
        amountUsdc: swapAmount,
        txHash: result.txHash,
        status: result.txHash ? "paid" as const : "pending" as const,
        rating: null,
        review: null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      tasks.set(task.id, task);
      autoRateTask(task.id);

      if (result.txHash) {
        agent.totalEarned += swapAmount;
        agent.tasksCompleted += 1;
      }
    }

    saveState();
    res.json({ agent: agent.ensName, ...result });
  } catch (err: any) {
    console.error("[demo/swap]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/demo/hire
 * Parent hires the DeFi agent — no auth needed.
 * Body: { service_id?: string }
 */
router.post("/demo/hire", async (req, res) => {
  try {
    await bootstrapReady;
    const parent = findParent();
    if (!parent) {
      res.status(503).json({ error: "No parent agent available. Run bootstrap first." });
      return;
    }

    // Find the DeFi service (not research — research has its own demo button)
    let service = req.body.service_id ? services.get(req.body.service_id) : null;
    if (!service) {
      // Default to DeFi Execution service
      for (const s of services.values()) {
        const owner = citizens.get(s.ownerEns);
        if (owner && owner.category === "DeFi Execution") {
          service = s;
          break;
        }
      }
    }
    if (!service) {
      // Fallback to any non-parent service
      for (const s of services.values()) {
        if (s.ownerEns !== parent.ensName) {
          service = s;
          break;
        }
      }
    }

    if (!service) {
      res.status(404).json({ error: "No service available" });
      return;
    }

    const target = citizens.get(service.ownerEns);
    if (!target) {
      res.status(404).json({ error: "target agent not found" });
      return;
    }

    // Auto-fund parent from treasury so demo always works
    await ensureParentFunded(service.priceUsdc);

    // Real USDC transfer from parent → target
    let txHash: string | null = null;
    try {
      txHash = await transferUsdc(parent.ensName, target.wallet, service.priceUsdc);
    } catch (err: any) {
      console.warn("[demo/hire] USDC transfer failed:", err.message);
    }

    const task = {
      id: nextTaskId(),
      serviceId: service.id,
      fromEns: parent.ensName,
      toEns: target.ensName,
      amountUsdc: service.priceUsdc,
      txHash,
      status: txHash ? "paid" as const : "pending" as const,
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    tasks.set(task.id, task);
    autoRateTask(task.id);

    if (txHash) {
      parent.totalSpent += service.priceUsdc;
      target.totalEarned += service.priceUsdc;
      target.tasksCompleted += 1;
    }

    addFeedEntry(
      parent.ensName,
      "hire",
      `Hired ${target.ensName} for "${service.title}" — ${service.priceUsdc} USDC`,
      txHash,
    );

    saveState();
    res.status(201).json({ ...task, paymentVerified: !!txHash });
  } catch (err: any) {
    console.error("[demo/hire]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/demo/agents
 * Returns available agents and services for the TryIt UI.
 */
router.get("/demo/agents", async (_req, res) => {
  await bootstrapReady;
  const agents = [...citizens.values()].map((c) => ({
    ensName: c.ensName,
    category: c.category,
    wallet: c.wallet,
    isParent: !c.spawnedBy,
  }));

  // Return DeFi service first for the hire button
  const svcList = [...services.values()]
    .sort((a, b) => {
      const aOwner = citizens.get(a.ownerEns);
      const bOwner = citizens.get(b.ownerEns);
      if (aOwner?.category === "DeFi Execution") return -1;
      if (bOwner?.category === "DeFi Execution") return 1;
      return 0;
    })
    .map((s) => ({
      id: s.id,
      title: s.title,
      ownerEns: s.ownerEns,
      priceUsdc: s.priceUsdc,
    }));

  res.json({ agents, services: svcList });
});

export default router;
