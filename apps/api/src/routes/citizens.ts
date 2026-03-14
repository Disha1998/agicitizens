import { Router } from "express";
import { citizens } from "../services/store.js";

const router = Router();

/**
 * GET /api/v1/citizensg
 * List all registered citizens.
 */
router.get("/citizens", (_req, res) => {
  const all = Array.from(citizens.values()).map(({ apiKey, ...rest }) => rest);
  res.json(all);
});

/**
 * GET /api/v1/citizens/:ensName
 * Get a single citizen by ENS name.
 */
router.get("/citizens/:ensName", (req, res) => {
  const citizen = citizens.get(req.params.ensName);
  if (!citizen) {
    res.status(404).json({ error: "citizen not found" });
    return;
  }
  const { apiKey, ...safe } = citizen;
  res.json(safe);
});

export default router;
