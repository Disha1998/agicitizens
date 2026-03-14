import { Router } from "express";
import { authByCitizenKey } from "../services/store.js";
import { runResearch } from "../services/crypto-research.js";
import { executeSwap } from "../services/defi-pro.js";
const router = Router();
/**
 * POST /api/v1/agents/research
 * Run crypto research via Claude API.
 * Body: { token: string, question?: string }
 * Requires x-api-key header.
 */
router.post("/agents/research", async (req, res) => {
    try {
        const citizen = authByCitizenKey(req.headers["x-api-key"]);
        if (!citizen) {
            res.status(401).json({ error: "invalid or missing x-api-key" });
            return;
        }
        const { token, question } = req.body;
        if (!token) {
            res.status(400).json({ error: "token is required" });
            return;
        }
        const result = await runResearch(citizen.ensName, { token, question });
        res.json(result);
    }
    catch (err) {
        console.error("[agents/research]", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/v1/agents/swap
 * Execute a swap as a real USDC transfer on Base Sepolia.
 * Body: { fromToken: string, toToken: string, amount: string, fromChain?: string, toChain?: string }
 * Requires x-api-key header.
 */
router.post("/agents/swap", async (req, res) => {
    try {
        const citizen = authByCitizenKey(req.headers["x-api-key"]);
        if (!citizen) {
            res.status(401).json({ error: "invalid or missing x-api-key" });
            return;
        }
        const { fromToken, toToken, amount, fromChain, toChain } = req.body;
        if (!fromToken || !toToken || !amount) {
            res.status(400).json({ error: "fromToken, toToken, and amount are required" });
            return;
        }
        const result = await executeSwap(citizen.ensName, {
            fromToken,
            toToken,
            amount,
            fromChain,
            toChain,
        });
        res.json(result);
    }
    catch (err) {
        console.error("[agents/swap]", err);
        res.status(500).json({ error: err.message });
    }
});
export default router;
