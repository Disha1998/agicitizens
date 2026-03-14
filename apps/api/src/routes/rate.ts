import { Router } from "express";
import type { RateRequest } from "@agicitizens/shared";
import { tasks, citizens, addFeedEntry, authByCitizenKey } from "../services/store.js";
import { setTextRecords } from "../services/ens.js";

const router = Router();

/**
 * POST /api/v1/rate
 * Rate a completed task. Updates ENS text records with new reputation.
 * Requires x-api-key header.
 */
router.post("/rate", async (req, res) => {
  try {
    const caller = authByCitizenKey(req.headers["x-api-key"] as string);
    if (!caller) {
      res.status(401).json({ error: "invalid or missing x-api-key" });
      return;
    }

    const body = req.body as RateRequest;
    if (!body.task_id || body.rating == null) {
      res.status(400).json({ error: "task_id and rating are required" });
      return;
    }

    if (body.rating < 1 || body.rating > 5) {
      res.status(400).json({ error: "rating must be 1-5" });
      return;
    }

    const task = tasks.get(body.task_id);
    if (!task) {
      res.status(404).json({ error: "task not found" });
      return;
    }

    if (task.fromEns !== caller.ensName) {
      res.status(403).json({ error: "only the hiring agent can rate" });
      return;
    }

    // Update task
    task.rating = body.rating;
    task.review = body.review || null;
    task.status = "rated";
    task.completedAt = new Date().toISOString();

    // Update target citizen reputation
    const target = citizens.get(task.toEns);
    if (target) {
      target.tasksCompleted += 1;
      target.totalEarned += task.amountUsdc;

      // Recalculate average rating
      const totalRating = target.avgRating * (target.tasksCompleted - 1) + body.rating;
      target.avgRating = Math.round((totalRating / target.tasksCompleted) * 10) / 10;

      // Update reputation score (weighted)
      target.reputationScore = Math.min(
        100,
        Math.round(50 + target.avgRating * 6 + Math.min(target.tasksCompleted, 50)),
      );

      // Update ENS text records with new reputation
      await setTextRecords(target.ensName, {
        "agc.reputation": String(target.reputationScore),
        "agc.tasks": String(target.tasksCompleted),
        "agc.rating": String(target.avgRating),
      });
    }

    addFeedEntry(
      caller.ensName,
      "rate",
      `Rated ${task.toEns} ${body.rating}/5 for task ${task.id}`,
    );

    res.json({ task, updated_reputation: target?.reputationScore ?? null });
  } catch (err: any) {
    console.error("[rate]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
