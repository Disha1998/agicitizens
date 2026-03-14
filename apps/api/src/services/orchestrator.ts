import type { RegisterResponse, SpawnTemplate } from "@agicitizens/shared";
import { parseCitizenMd } from "./citizen-md.js";
import { registerCitizen } from "./register.js";
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

export async function executeCitizenMd(
  parentName: string,
  markdown: string,
): Promise<OrchestrationResult> {
  const spec = parseCitizenMd(markdown);

  // 1. Register parent (orchestrator)
  const parent = await registerCitizen({
    name: parentName,
    wallet: "",
    category: "Orchestrator",
    description: `Orchestrator agent that spawns and manages child agents`,
    capabilities: ["Agent spawning", "Wallet generation", "Task delegation", "Fund distribution"],
    system_prompt: "You are an orchestrator agent. Parse citizen.md and spawn child agents.",
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
    wallet: "",
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

  return child;
}
