import { Router } from "express";
import { services, nextServiceId, addFeedEntry, authByCitizenKey } from "../services/store.js";
const router = Router();
/**
 * POST /api/v1/services
 * Create a service listing. Requires x-api-key header.
 */
router.post("/services", async (req, res) => {
    try {
        const citizen = authByCitizenKey(req.headers["x-api-key"]);
        if (!citizen) {
            res.status(401).json({ error: "invalid or missing x-api-key" });
            return;
        }
        const body = req.body;
        if (!body.title || body.price_usdc == null) {
            res.status(400).json({ error: "title and price_usdc are required" });
            return;
        }
        const service = {
            id: nextServiceId(),
            ownerEns: citizen.ensName,
            title: body.title,
            description: body.description || "",
            priceUsdc: body.price_usdc,
            createdAt: new Date().toISOString(),
            active: true,
        };
        services.set(service.id, service);
        addFeedEntry(citizen.ensName, "service-listed", `Listed "${service.title}" for ${service.priceUsdc} USDC`);
        res.status(201).json(service);
    }
    catch (err) {
        console.error("[services]", err);
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/v1/services
 * List all active services.
 */
router.get("/services", (_req, res) => {
    const all = Array.from(services.values()).filter((s) => s.active);
    res.json(all);
});
export default router;
