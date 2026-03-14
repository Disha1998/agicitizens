/**
 * Bootstrap — replace static seed with real agent orchestration.
 *
 * On startup:
 * 1. Read citizen.md
 * 2. Register parent + children with real CDP wallets
 * 3. Fund children with real USDC from platform treasury
 * 4. Register services for each child
 * 5. Parent hires each child (real USDC transfer)
 *
 * All tx hashes are real and verifiable on basesepolia.basescan.org.
 */

import fs from "node:fs";
import path from "node:path";
import type { Service } from "@agicitizens/shared";
import { executeCitizenMd } from "./orchestrator.js";
import { transferUsdc } from "./agent-wallets.js";
import {
  citizens,
  services,
  tasks,
  nextServiceId,
  nextTaskId,
  addFeedEntry,
} from "./store.js";

export async function bootstrapAgents(): Promise<void> {
  // Skip if already bootstrapped
  if (citizens.has("agicitizens-core.agicitizens.eth")) {
    console.log("[bootstrap] Already bootstrapped, skipping");
    return;
  }

  console.log("[bootstrap] Starting real agent orchestration...");

  // 1. Read citizen.md
  const mdPath = path.resolve(process.cwd(), "citizen.md");
  if (!fs.existsSync(mdPath)) {
    console.warn("[bootstrap] citizen.md not found at", mdPath);
    return;
  }
  const markdown = fs.readFileSync(mdPath, "utf-8");

  // 2. Execute citizen.md — creates real CDP wallets, registers agents, funds children
  const result = await executeCitizenMd(markdown);
  console.log(`[bootstrap] Parent: ${result.parent.ens_name} (${result.parent.wallet})`);
  for (const child of result.children) {
    console.log(`[bootstrap] Child:  ${child.ens_name} (${child.wallet})`);
  }

  // 3. Register services for each child
  const serviceMap = new Map<string, string>(); // ensName → serviceId

  for (const child of result.children) {
    const citizen = citizens.get(child.ens_name);
    if (!citizen) continue;

    const svcId = nextServiceId();
    const svc: Service = {
      id: svcId,
      ownerEns: child.ens_name,
      title: citizen.category === "Research"
        ? "Crypto Research Report"
        : "Cross-Chain Swap Execution",
      description: citizen.description,
      priceUsdc: parseFloat(citizen.pricePerTask) || 0,
      createdAt: new Date().toISOString(),
      active: true,
    };
    services.set(svcId, svc);
    serviceMap.set(child.ens_name, svcId);

    addFeedEntry(
      child.ens_name,
      "service",
      `Listed "${svc.title}" — $${svc.priceUsdc} USDC`,
    );
  }

  // 4. Parent hires each child (real USDC transfer)
  const parentEns = result.parent.ens_name;

  for (const child of result.children) {
    const svcId = serviceMap.get(child.ens_name);
    if (!svcId) continue;

    const svc = services.get(svcId);
    if (!svc) continue;

    const citizen = citizens.get(child.ens_name);
    if (!citizen) continue;

    try {
      const txHash = await transferUsdc(parentEns, child.wallet, svc.priceUsdc);

      const taskId = nextTaskId();
      tasks.set(taskId, {
        id: taskId,
        serviceId: svcId,
        fromEns: parentEns,
        toEns: child.ens_name,
        amountUsdc: svc.priceUsdc,
        txHash,
        status: "paid",
        rating: null,
        review: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      });

      // Update balances
      const parent = citizens.get(parentEns);
      if (parent) {
        parent.totalSpent += svc.priceUsdc;
      }
      citizen.totalEarned += svc.priceUsdc;
      citizen.tasksCompleted += 1;

      addFeedEntry(
        parentEns,
        "hire",
        `Hired ${child.ens_name} for "${svc.title}" — ${svc.priceUsdc} USDC`,
        txHash,
      );

      console.log(`[bootstrap] Hired ${child.ens_name}: ${svc.priceUsdc} USDC  tx=${txHash}`);
    } catch (err: any) {
      console.warn(`[bootstrap] Failed to hire ${child.ens_name}:`, err.message);
      addFeedEntry(
        parentEns,
        "hire",
        `Hire ${child.ens_name} failed: ${err.message}`,
      );
    }
  }

  const txCount = [...tasks.values()].filter((t) => t.txHash).length;
  console.log(
    `[bootstrap] Done — ${citizens.size} agents, ${services.size} services, ${txCount} real transactions`,
  );
}
