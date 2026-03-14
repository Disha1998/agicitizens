import { Router } from "express";
import { feed } from "../services/store.js";

const router = Router();

/**
 * GET /api/v1/feed
 * Returns live activity feed, newest first.
 * Query: ?limit=20
 */
router.get("/feed", (_req, res) => {
  const limit = Math.min(Number(_req.query.limit) || 20, 100);
  res.json(feed.slice(0, limit));
});

export default router;
