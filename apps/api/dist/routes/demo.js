import { Router } from "express";
import { citizens, services, tasks, nextTaskId, addFeedEntry, saveState, } from "../services/store.js";
import { runResearch } from "../services/crypto-research.js";
import { executeSwap } from "../services/defi-pro.js";
import { transferUsdc } from "../services/agent-wallets.js";
const router = Router();
/** Find first citizen matching a category (or fallback to any) */
function findAgent(category) {
    for (const c of citizens.values()) {
        if (c.category === category)
            return c;
    }
    return null;
}
function findParent() {
    for (const c of citizens.values()) {
        if (!c.spawnedBy)
            return c;
    }
    return null;
}
/**
 * POST /api/v1/demo/research
 * Run crypto research — no auth needed, uses the research agent internally.
 * Body: { token: string }
 */
router.post("/demo/research", async (req, res) => {
    try {
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
        saveState();
        res.json({ agent: agent.ensName, ...result });
    }
    catch (err) {
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
        saveState();
        res.json({ agent: agent.ensName, ...result });
    }
    catch (err) {
        console.error("[demo/swap]", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/v1/demo/hire
 * Parent hires a child agent — no auth needed.
 * Body: { service_id: string }
 */
router.post("/demo/hire", async (req, res) => {
    try {
        const parent = findParent();
        if (!parent) {
            res.status(503).json({ error: "No parent agent available. Run bootstrap first." });
            return;
        }
        const { service_id } = req.body;
        if (!service_id) {
            res.status(400).json({ error: "service_id is required" });
            return;
        }
        const service = services.get(service_id);
        if (!service) {
            res.status(404).json({ error: "service not found" });
            return;
        }
        const target = citizens.get(service.ownerEns);
        if (!target) {
            res.status(404).json({ error: "target agent not found" });
            return;
        }
        // Attempt real USDC transfer from parent → target
        let txHash = null;
        try {
            txHash = await transferUsdc(parent.ensName, target.wallet, service.priceUsdc);
        }
        catch (err) {
            console.warn("[demo/hire] USDC transfer failed:", err.message);
        }
        const task = {
            id: nextTaskId(),
            serviceId: service.id,
            fromEns: parent.ensName,
            toEns: target.ensName,
            amountUsdc: service.priceUsdc,
            txHash,
            status: txHash ? "paid" : "pending",
            rating: null,
            review: null,
            createdAt: new Date().toISOString(),
            completedAt: null,
        };
        tasks.set(task.id, task);
        if (txHash) {
            parent.totalSpent += service.priceUsdc;
            target.totalEarned += service.priceUsdc;
            target.tasksCompleted += 1;
        }
        addFeedEntry(parent.ensName, "hire", `Hired ${target.ensName} for "${service.title}" — ${service.priceUsdc} USDC`, txHash);
        saveState();
        res.status(201).json({ ...task, paymentVerified: !!txHash });
    }
    catch (err) {
        console.error("[demo/hire]", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/v1/demo/agents
 * Returns available agents and services for the TryIt UI.
 */
router.get("/demo/agents", (_req, res) => {
    const agents = [...citizens.values()].map((c) => ({
        ensName: c.ensName,
        category: c.category,
        wallet: c.wallet,
        isParent: !c.spawnedBy,
    }));
    const svcList = [...services.values()].map((s) => ({
        id: s.id,
        title: s.title,
        ownerEns: s.ownerEns,
        priceUsdc: s.priceUsdc,
    }));
    res.json({ agents, services: svcList });
});
export default router;
