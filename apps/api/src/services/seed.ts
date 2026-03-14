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
import { fundAgent, fundAgentEth } from "./platform-wallet.js";
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

  console.log("[bootstrap] ========================================");
  console.log("[bootstrap] Starting real agent orchestration...");
  console.log("[bootstrap] ========================================");

  // 1. Read citizen.md
  // Walk up from cwd to find citizen.md (may be at monorepo root)
  let mdPath = path.resolve(process.cwd(), "citizen.md");
  if (!fs.existsSync(mdPath)) {
    mdPath = path.resolve(process.cwd(), "../../citizen.md"); // apps/api → root
  }
  if (!fs.existsSync(mdPath)) {
    console.warn("[bootstrap] citizen.md not found at", mdPath);
    return;
  }
  const markdown = fs.readFileSync(mdPath, "utf-8");
  console.log("[bootstrap] Loaded citizen.md from", mdPath);

  // 2. Execute citizen.md — creates real CDP wallets, registers agents, funds children
  console.log("[bootstrap] Phase 1: Creating wallets & registering agents...");
  const result = await executeCitizenMd(markdown);
  console.log("[bootstrap] ----------------------------------------");
  console.log(`[bootstrap] Parent: ${result.parent.ens_name}`);
  console.log(`[bootstrap]   wallet: ${result.parent.wallet}`);
  for (const child of result.children) {
    console.log(`[bootstrap] Child:  ${child.ens_name}`);
    console.log(`[bootstrap]   wallet: ${child.wallet}`);
  }
  console.log("[bootstrap] ----------------------------------------");

  // 3. Register services for each child
  console.log("[bootstrap] Phase 2: Registering services...");
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
    console.log(`[bootstrap]   ${child.ens_name} → "${svc.title}" @ $${svc.priceUsdc} USDC`);

    addFeedEntry(
      child.ens_name,
      "service",
      `Listed "${svc.title}" — $${svc.priceUsdc} USDC`,
    );
  }

  // 4. Fund parent with ETH (gas) + USDC so it can hire children
  console.log("[bootstrap] Phase 3: Parent hiring children (USDC transfers)...");
  const parentEns = result.parent.ens_name;

  const totalNeeded = result.children.reduce((sum, child) => {
    const svcId = serviceMap.get(child.ens_name);
    const svc = svcId ? services.get(svcId) : undefined;
    return sum + (svc?.priceUsdc ?? 0);
  }, 0);

  // Fund parent with ETH for gas
  try {
    console.log(`[bootstrap]   Sending 0.001 ETH to parent ${parentEns} for gas...`);
    const ethTx = await fundAgentEth(result.parent.wallet, 0.001);
    console.log(`[bootstrap]   Parent gas funded: tx ${ethTx}`);
    addFeedEntry(parentEns, "fund", `Treasury sent 0.001 ETH for gas`, ethTx);
  } catch (err: any) {
    console.warn(`[bootstrap]   FAILED to send ETH to parent:`, err.message);
  }

  // Fund parent with USDC for hiring
  if (totalNeeded > 0) {
    try {
      console.log(`[bootstrap]   Funding parent ${parentEns} with ${totalNeeded} USDC from treasury...`);
      const usdcTx = await fundAgent(result.parent.wallet, totalNeeded);
      console.log(`[bootstrap]   Parent USDC funded: tx ${usdcTx}`);
      addFeedEntry(parentEns, "fund", `Treasury funded parent with ${totalNeeded} USDC`, usdcTx);
    } catch (err: any) {
      console.warn(`[bootstrap]   FAILED to fund parent USDC:`, err.message);
    }
  }

  // Wait for on-chain confirmation before parent tries to spend USDC
  console.log("[bootstrap]   Waiting 8s for USDC funding to confirm on-chain...");
  await new Promise((r) => setTimeout(r, 8000));

  for (const child of result.children) {
    const svcId = serviceMap.get(child.ens_name);
    if (!svcId) continue;

    const svc = services.get(svcId);
    if (!svc) continue;

    const citizen = citizens.get(child.ens_name);
    if (!citizen) continue;

    try {
      console.log(`[bootstrap]   ${parentEns} → ${child.ens_name}: ${svc.priceUsdc} USDC...`);
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

      console.log(`[bootstrap]   Hired ${child.ens_name}: ${svc.priceUsdc} USDC`);
      console.log(`[bootstrap]   tx: ${txHash}`);
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
  console.log("[bootstrap] ========================================");
  console.log(`[bootstrap] DONE`);
  console.log(`[bootstrap]   Agents:       ${citizens.size}`);
  console.log(`[bootstrap]   Services:     ${services.size}`);
  console.log(`[bootstrap]   Transactions: ${txCount} real`);
  console.log("[bootstrap] ========================================");
}
