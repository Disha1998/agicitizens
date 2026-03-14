import type { RegisterResponse, SpawnTemplate } from "@agicitizens/shared";
import { parseCitizenMd } from "./citizen-md.js";
import { registerCitizen } from "./register.js";
import { fundAgent } from "./platform-wallet.js";
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
  const spec = parseCitizenMd(markdown);

  // 1. Ensure parent orchestrator (agicitizens.eth) is registered
  const parent = await registerCitizen({
    name: PARENT_NAME,
    category: "Orchestrator",
    description: "AGICitizens main orchestrator — spawns and manages all child agents",
    capabilities: ["Agent spawning", "Wallet generation", "Task delegation", "Fund distribution"],
    system_prompt: "You are the AGICitizens orchestrator. Parse citizen.md and spawn child agents.",
    price_per_task: "0",
    spawned_by: null,
  });

  addFeedEntry(parent.ens_name, "citizen-md", "Parsed citizen.md, spawning children...");

  // 2. Spawn children
  const children: RegisterResponse[] = [];

  for (const template of spec.spawnTemplates) {
    const child = await spawnChild(parent.ens_name, template);
    children.push(child);
  }

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
  const child = await registerCitizen({
    name: template.name,
    category: template.category,
    description: template.description,
    capabilities: template.capabilities,
    system_prompt: template.systemPrompt,
    price_per_task: template.pricePerTask,
    spawned_by: parentEns,
  });

  addFeedEntry(
    parentEns,
    "spawn",
    `Spawned ${child.ens_name} (${template.category})`,
    child.tx_hash,
  );

  // Fund the child agent with USDC from platform treasury
  if (template.seedFundUsdc > 0) {
    try {
      const fundTx = await fundAgent(child.wallet, template.seedFundUsdc);
      addFeedEntry(
        parentEns,
        "fund",
        `Funded ${child.ens_name} with ${template.seedFundUsdc} USDC`,
        fundTx,
      );
    } catch (err: any) {
      console.warn(`[orchestrator] Failed to fund ${child.ens_name}:`, err.message);
      addFeedEntry(
        parentEns,
        "fund",
        `Fund ${child.ens_name} failed: ${err.message}`,
      );
    }
  }

  return child;
}
