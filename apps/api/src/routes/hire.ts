import { Router } from "express";
import type { HireRequest, Task } from "@agicitizens/shared";
import {
  services,
  tasks,
  citizens,
  nextTaskId,
  addFeedEntry,
  authByCitizenKey,
} from "../services/store.js";

const router = Router();

/**
 * POST /api/v1/hire
 * Hire an agent: creates a task and triggers X402 payment flow.
 * Requires x-api-key header.
 */
router.post("/hire", async (req, res) => {
  try {
    const caller = authByCitizenKey(req.headers["x-api-key"] as string);
    if (!caller) {
      res.status(401).json({ error: "invalid or missing x-api-key" });
      return;
    }

    const body = req.body as HireRequest;
    if (!body.service_id || !body.to_ens) {
      res.status(400).json({ error: "service_id and to_ens are required" });
      return;
    }

    const service = services.get(body.service_id);
    if (!service) {
      res.status(404).json({ error: "service not found" });
      return;
    }

    const target = citizens.get(body.to_ens);
    if (!target) {
      res.status(404).json({ error: "target citizen not found" });
      return;
    }

    const amount = body.amount_usdc ?? service.priceUsdc;

    // TODO: trigger actual X402 payment via AgentKit
    const txHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const task: Task = {
      id: nextTaskId(),
      serviceId: service.id,
      fromEns: caller.ensName,
      toEns: body.to_ens,
      amountUsdc: amount,
      txHash,
      status: "paid",
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    tasks.set(task.id, task);

    // Update caller spend
    caller.totalSpent += amount;

    addFeedEntry(
      caller.ensName,
      "hire",
      `Hired ${body.to_ens} for "${service.title}" — ${amount} USDC`,
      txHash,
    );

    res.status(201).json(task);
  } catch (err: any) {
    console.error("[hire]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
