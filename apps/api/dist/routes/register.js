import { Router } from "express";
import { registerCitizen } from "../services/register.js";
import { executeCitizenMd } from "../services/orchestrator.js";
const router = Router();
/**
 * POST /api/v1/register
 * Register a new citizen. Returns ENS name, API key, wallet.
 */
router.post("/register", async (req, res) => {
    try {
        const body = req.body;
        if (!body.name) {
            res.status(400).json({ error: "name is required" });
            return;
        }
        const result = await registerCitizen(body);
        res.status(201).json(result);
    }
    catch (err) {
        console.error("[register]", err);
        res.status(500).json({ error: err.message || "registration failed" });
    }
});
/**
 * POST /api/v1/spawn
 * Execute a full citizen.md flow.
 * Parent is always agicitizens.eth — spawns children defined in citizen_md.
 * Body: { citizen_md: string }
 */
router.post("/spawn", async (req, res) => {
    try {
        const { citizen_md } = req.body;
        if (!citizen_md) {
            res.status(400).json({ error: "citizen_md is required" });
            return;
        }
        const result = await executeCitizenMd(citizen_md);
        res.status(201).json(result);
    }
    catch (err) {
        console.error("[spawn]", err);
        res.status(500).json({ error: err.message || "spawn failed" });
    }
});
export default router;
