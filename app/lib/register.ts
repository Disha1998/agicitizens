import { AgentKit } from "@coinbase/agentkit";
import { x402Pay } from "./x402";
import { createChildWallet } from "./wallet";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://agicitizens.xyz/api/v1";

export interface RegisterAgentInput {
  name: string;
  description: string;
  category?: string;
  capabilities?: string[];
  pricePerTask?: string;
  systemPrompt?: string;
  spawnedBy?: string;
}

export interface RegisteredAgent {
  ensName: string;
  wallet: string;
  txHash?: string;
}

/**
 * Registers an agent as a citizen using the parent's AgentKit wallet
 * to pay the X402 registration fee.
 *
 * Flow:
 * 1. POST /api/v1/register with X402 payment (1 USDC)
 * 2. Server mints ENS subdomain on Base
 * 3. Returns the new citizen's ENS name
 */
export async function registerAgent(
  parentKit: AgentKit,
  input: RegisterAgentInput,
): Promise<RegisteredAgent> {
  const result = await x402Pay(parentKit, `${API_BASE}/register`, {
    name: input.name,
    description: input.description,
    category: input.category || "general",
    capabilities: input.capabilities || [],
    price_per_task: input.pricePerTask || "0",
    system_prompt: input.systemPrompt || "",
    spawned_by: input.spawnedBy || null,
  });

  if (!result.success) {
    throw new Error(`Registration failed: ${JSON.stringify(result.data)}`);
  }

  const data = result.data as Record<string, string>;

  return {
    ensName: data.ens_name || `${input.name}.agicitizens.eth`,
    wallet: data.wallet || "",
    txHash: data.tx_hash,
  };
}

/**
 * Spawns a child agent: creates a fresh wallet, funds it from the parent,
 * and registers it as a new citizen.
 *
 * This is the core of the auto-spawn flow described in citizen.md.
 */
export async function spawnChildAgent(
  parentKit: AgentKit,
  template: RegisterAgentInput & { seedFundUsdc?: number },
): Promise<RegisteredAgent & { childKit: AgentKit }> {
  // 1. Create a fresh wallet for the child
  const { address: childAddress, agentKit: childKit } =
    await createChildWallet();

  // 2. Fund the child wallet from parent (seed money + registration fee)
  const seedAmount = template.seedFundUsdc || 5;
  const totalFund = seedAmount + 1; // +1 for registration fee

  const actions = parentKit.getActions();
  const transferAction = actions.find((a) => a.name === "transfer_token");

  if (transferAction) {
    await transferAction.invoke({
      to: childAddress,
      token: "USDC",
      amount: totalFund.toString(),
    });
  }

  // 3. Register the child using its own wallet
  const registered = await registerAgent(childKit, {
    ...template,
    spawnedBy: template.spawnedBy,
  });

  return {
    ...registered,
    wallet: childAddress,
    childKit,
  };
}
