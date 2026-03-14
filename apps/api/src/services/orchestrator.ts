import type { RegisterResponse, SpawnTemplate } from "@agicitizens/shared";
import { parseCitizenMd } from "./citizen-md.js";
import { registerCitizen } from "./register.js";
import { fundAgent, fundAgentEth } from "./platform-wallet.js";
import { addFeedEntry } from "./store.js";

/**
 * Full citizen.md execution flow:
 * 1. Parse citizen.md
 * 2. Register parent agent
 * 3. Spawn each child agent defined in templates
 * 4. Post feed entries for each step
 */

export interface OrchestrationResult {
  parent: RegisterResponse;
  children: RegisterResponse[];
}

const PARENT_NAME = "agicitizens-core";

export async function executeCitizenMd(
  markdown: string,
): Promise<OrchestrationResult> {
  console.log("[orchestrator] Parsing citizen.md...");
  const spec = parseCitizenMd(markdown);
  console.log(`[orchestrator] Found ${spec.spawnTemplates.length} agent template(s) to spawn`);

  // 1. Ensure parent orchestrator is registered
  console.log("[orchestrator] Step 1/3: Registering parent agent (agicitizens-core)...");
  const parent = await registerCitizen({
    name: PARENT_NAME,
    category: "Orchestrator",
    description: "AGICitizens main orchestrator — spawns and manages all child agents",
    capabilities: ["Agent spawning", "Wallet generation", "Task delegation", "Fund distribution"],
    system_prompt: "You are the AGICitizens orchestrator. Parse citizen.md and spawn child agents.",
    price_per_task: "0",
    spawned_by: null,
  });

  console.log(`[orchestrator] Parent registered: ${parent.ens_name} (${parent.wallet})`);
  addFeedEntry(parent.ens_name, "citizen-md", "Parsed citizen.md, spawning children...");

  // 2. Spawn children
  console.log("[orchestrator] Step 2/3: Spawning child agents...");
  const children: RegisterResponse[] = [];

  for (let i = 0; i < spec.spawnTemplates.length; i++) {
    const template = spec.spawnTemplates[i];
    console.log(`[orchestrator] Spawning child ${i + 1}/${spec.spawnTemplates.length}: ${template.name} (${template.category})...`);
    const child = await spawnChild(parent.ens_name, template);
    children.push(child);
  }

  console.log(`[orchestrator] Step 3/3: All ${children.length} child agent(s) spawned successfully`);
  addFeedEntry(
    parent.ens_name,
    "spawn-complete",
    `Spawned ${children.length} child agent(s)`,
  );

  return { parent, children };
}

async function spawnChild(
  parentEns: string,
  template: SpawnTemplate,
): Promise<RegisterResponse> {
  console.log(`[orchestrator]   Creating wallet for ${template.name}...`);
  const child = await registerCitizen({
    name: template.name,
    category: template.category,
    description: template.description,
    capabilities: template.capabilities,
    system_prompt: template.systemPrompt,
    price_per_task: template.pricePerTask,
    spawned_by: parentEns,
  });
  console.log(`[orchestrator]   ${child.ens_name} registered at ${child.wallet}`);

  addFeedEntry(
    parentEns,
    "spawn",
    `Spawned ${child.ens_name} (${template.category})`,
    child.tx_hash,
  );

  // Fund the child agent with ETH (gas) + USDC from platform treasury
  const GAS_ETH = 0.001; // enough for many txs on Base Sepolia
  try {
    console.log(`[orchestrator]   Sending ${GAS_ETH} ETH to ${child.ens_name} for gas...`);
    const ethTx = await fundAgentEth(child.wallet, GAS_ETH);
    console.log(`[orchestrator]   Gas funded! tx: ${ethTx}`);
    addFeedEntry(parentEns, "fund", `Sent ${GAS_ETH} ETH to ${child.ens_name} for gas`, ethTx);
  } catch (err: any) {
    console.warn(`[orchestrator]   FAILED to send ETH to ${child.ens_name}:`, err.message);
  }

  if (template.seedFundUsdc > 0) {
    try {
      console.log(`[orchestrator]   Funding ${child.ens_name} with ${template.seedFundUsdc} USDC from treasury...`);
      const fundTx = await fundAgent(child.wallet, template.seedFundUsdc);
      console.log(`[orchestrator]   Funded! tx: ${fundTx}`);
      addFeedEntry(
        parentEns,
        "fund",
        `Funded ${child.ens_name} with ${template.seedFundUsdc} USDC`,
        fundTx,
      );
    } catch (err: any) {
      console.warn(`[orchestrator]   FAILED to fund ${child.ens_name}:`, err.message);
      addFeedEntry(
        parentEns,
        "fund",
        `Fund ${child.ens_name} failed: ${err.message}`,
      );
    }
  }

  return child;
}
