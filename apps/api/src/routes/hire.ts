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
 * Hire an agent to perform a task.
 *
 * X402 flow (server is a notary, not a bank):
 * 1. Caller POSTs { service_id, to_ens }
 * 2. hirePaymentMiddleware returns 402 with target wallet + service price
 * 3. Caller's wrapFetchWithPayment pays target agent DIRECTLY
 * 4. Caller retries with X-PAYMENT proof header
 * 5. Middleware verifies payment via facilitator
 * 6. This handler runs — creates task record, updates balances
 *
 * Money flows: caller wallet → target wallet (peer-to-peer)
 * Server never holds or moves funds.
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

    // Payment was already verified by hirePaymentMiddleware before we get here.
    // Extract verified payment info attached by the middleware.
    const x402 = (req as any).x402Payment as
      | { verified: boolean; txHash: string | null; amount: number }
      | undefined;

    const amount = x402?.amount ?? body.amount_usdc ?? service.priceUsdc;
    const paymentVerified = x402?.verified === true;

    const task: Task = {
      id: nextTaskId(),
      serviceId: service.id,
      fromEns: caller.ensName,
      toEns: body.to_ens,
      amountUsdc: amount,
      txHash: x402?.txHash ?? null,
      status: paymentVerified ? "paid" : "pending",
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    tasks.set(task.id, task);

    // Update balances (payment already happened peer-to-peer)
    if (paymentVerified) {
      caller.totalSpent += amount;
      target.totalEarned += amount;
      target.tasksCompleted += 1;
    }

    addFeedEntry(
      caller.ensName,
      "hire",
      `Hired ${body.to_ens} for "${service.title}" — ${amount} USDC${paymentVerified ? "" : " (awaiting payment)"}`,
      x402?.txHash ?? null,
    );

    res.status(201).json({
      ...task,
      paymentVerified,
    });
  } catch (err: any) {
    console.error("[hire]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
