import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from monorepo root (works regardless of cwd)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config(); // also try cwd/.env as fallback

// Prevent unhandled rejections from crashing the process
process.on("unhandledRejection", (err: any) => {
  console.error("[server] Unhandled rejection (non-fatal):", err?.message || err);
});

import express from "express";
import cors from "cors";

import registerRoutes from "./routes/register.js";
import servicesRoutes from "./routes/services.js";
import hireRoutes from "./routes/hire.js";
import rateRoutes from "./routes/rate.js";
import feedRoutes from "./routes/feed.js";
import citizensRoutes from "./routes/citizens.js";
import agentsRoutes from "./routes/agents.js";
import statsRoutes from "./routes/stats.js";
import demoRoutes from "./routes/demo.js";
import { buildPaymentMiddleware } from "./services/x402.js";
import { bootstrapAgents } from "./services/seed.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// X402 payment middleware (server is a notary, not a bank)
// All pricing resolved dynamically at request time:
//   /register  → $1.00 → treasury (CDP platform wallet)
//   /research  → $0.01 → cryptoresearch agent wallet
//   /swap      → $0.02 → defipro agent wallet
//   /hire      → service price → target agent wallet
if (process.env.CDP_API_KEY_ID) {
  buildPaymentMiddleware()
    .then((middleware) => {
      app.use(middleware);
      console.log("[agicitizens-api] X402 payment middleware enabled");
    })
    .catch((err) => {
      console.warn("[agicitizens-api] X402 middleware failed to init:", err.message);
    });
}

// API v1 routes
const v1 = "/api/v1";
app.use(v1, registerRoutes);
app.use(v1, servicesRoutes);
app.use(v1, hireRoutes);
app.use(v1, rateRoutes);
app.use(v1, feedRoutes);
app.use(v1, citizensRoutes);
app.use(v1, agentsRoutes);
app.use(v1, statsRoutes);
app.use(v1, demoRoutes);

// Start
app.listen(PORT, () => {
  console.log(`[agicitizens-api] running on http://localhost:${PORT}`);

  // Bootstrap real agents after server is listening
  bootstrapAgents().catch((err) =>
    console.error("[bootstrap] Failed:", err.message),
  );
  console.log(`[agicitizens-api] endpoints:`);
  console.log(`  POST ${v1}/register`);
  console.log(`  POST ${v1}/spawn`);
  console.log(`  POST ${v1}/services`);
  console.log(`  GET  ${v1}/services`);
  console.log(`  POST ${v1}/hire`);
  console.log(`  POST ${v1}/rate`);
  console.log(`  GET  ${v1}/feed`);
  console.log(`  GET  ${v1}/citizens`);
  console.log(`  GET  ${v1}/citizens/:ensName`);
  console.log(`  POST ${v1}/agents/research`);
  console.log(`  POST ${v1}/agents/swap`);
  console.log(`  GET  ${v1}/stats`);
  console.log(`  POST ${v1}/demo/research`);
  console.log(`  POST ${v1}/demo/swap`);
  console.log(`  POST ${v1}/demo/hire`);
  console.log(`  GET  ${v1}/demo/agents`);
});

export default app;
