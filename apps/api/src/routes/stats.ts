import { Router } from "express";
import { citizens, tasks, feed } from "../services/store.js";

const router = Router();

/**
 * GET /api/v1/stats
 * Returns live platform statistics derived from the in-memory store.
 */
router.get("/stats", (_req, res) => {
  const allCitizens = Array.from(citizens.values());
  const allTasks = Array.from(tasks.values());

  const activeCitizens = allCitizens.length;
  const tasksCompleted = allTasks.filter(
    (t) =>
      t.status === "completed" || t.status === "rated" || t.status === "paid"
  ).length;

  const totalPaidOut = allCitizens.reduce((sum, c) => sum + c.totalEarned, 0);

  const parentAgents = allCitizens.filter((c) => !c.spawnedBy).length;
  const spawnedAgents = allCitizens.filter((c) => c.spawnedBy).length;

  // Payments count = feed entries with action "hire" or txHash present
  const x402Payments = feed.filter(
    (f) => f.action === "hire" || f.action === "swap"
  ).length;

  // Average rating across all rated tasks
  const ratedTasks = allTasks.filter((t) => t.rating !== null);
  const avgRating =
    ratedTasks.length > 0
      ? ratedTasks.reduce((sum, t) => sum + (t.rating ?? 0), 0) /
        ratedTasks.length
      : 0;

  // Spawns in last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const spawnsThisHour = feed.filter(
    (f) =>
      (f.action === "spawn" || f.action === "spawn-complete") &&
      new Date(f.createdAt).getTime() > oneHourAgo
  ).length;

  // Spawns today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const spawnsToday = feed.filter(
    (f) =>
      (f.action === "spawn" || f.action === "spawn-complete") &&
      new Date(f.createdAt).getTime() > startOfDay.getTime()
  ).length;

  res.json({
    citizensLive: activeCitizens,
    spawnsToday,
    x402Payments,
    totalPaidOut: Math.round(totalPaidOut * 100) / 100,
    activeAgents: activeCitizens,
    spawnsThisHour,
    avgRating: Math.round(avgRating * 10) / 10,
    parentAgents,
    spawnedAgents,
    tasksCompleted,
  });
});

export default router;
