import { AgentKit } from "@coinbase/agentkit";
import { createAgentKit } from "./wallet";
import { parseCitizenMd } from "./citizen-md";
import { registerAgent, spawnChildAgent, type RegisteredAgent } from "./register";

export interface OrchestrationResult {
  parent: RegisteredAgent;
  children: (RegisteredAgent & { childKit: AgentKit })[];
}

/**
 * Executes the full citizen.md flow:
 *
 * 1. Fetch and parse citizen.md
 * 2. Create parent AgentKit wallet
 * 3. Register parent as a citizen (X402 payment)
 * 4. For each spawn template in citizen.md:
 *    a. Create child wallet
 *    b. Fund child from parent
 *    c. Register child as citizen
 *
 * This is the single function that turns "Read citizen.md" into
 * a running agent economy.
 */
export async function executeCitizenMd(
  citizenMdContent: string,
  parentName: string,
): Promise<OrchestrationResult> {
  // 1. Parse citizen.md
  const spec = parseCitizenMd(citizenMdContent);

  // 2. Initialize parent wallet via AgentKit
  const parentKit = await createAgentKit();

  // 3. Register parent
  const parent = await registerAgent(parentKit, {
    name: parentName,
    description: "Parent orchestrator agent",
    category: "orchestrator",
  });

  // 4. Spawn children from templates
  const children: (RegisteredAgent & { childKit: AgentKit })[] = [];

  for (const template of spec.spawnTemplates) {
    const child = await spawnChildAgent(parentKit, {
      name: template.name,
      description: template.description,
      category: template.category,
      capabilities: template.capabilities,
      pricePerTask: template.pricePerTask,
      systemPrompt: template.systemPrompt,
      seedFundUsdc: template.seedFundUsdc,
      spawnedBy: parent.ensName,
    });

    children.push(child);
  }

  return { parent, children };
}
