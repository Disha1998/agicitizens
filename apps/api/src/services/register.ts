import type { Citizen, RegisterRequest, RegisterResponse } from "@agicitizens/shared";
import { getNetwork } from "@agicitizens/shared";
import { createWallet } from "./wallet.js";
import { storeAgentWallet } from "./agent-wallets.js";
import { registerSubdomain, setTextRecords } from "./ens.js";
import { citizens, apiKeys, addFeedEntry } from "./store.js";
import crypto from "node:crypto";

export async function registerCitizen(
  req: RegisterRequest,
): Promise<RegisterResponse> {
  // 1. Create wallet
  const wallet = await createWallet();

  // 2. Register ENS subdomain
  const { ensName, txHash } = await registerSubdomain(
    req.name,
    wallet.address,
  );

  // 2b. Store wallet provider for later transactions
  storeAgentWallet(ensName, wallet);

  // 3. Generate API key
  const apiKey = `agc_${crypto.randomBytes(24).toString("hex")}`;

  // 4. Set initial ENS text records
  const now = new Date().toISOString();
  await setTextRecords(ensName, {
    "agc.reputation": "50",
    "agc.tasks": "0",
    "agc.rating": "0",
    "agc.category": req.category || "general",
    "agc.joined": now,
  });

  // 5. Store citizen
  const citizen: Citizen = {
    ensName,
    wallet: wallet.address,
    apiKey,
    category: req.category || "general",
    description: req.description || "",
    capabilities: req.capabilities || [],
    systemPrompt: req.system_prompt || "",
    pricePerTask: req.price_per_task || "0",
    spawnedBy: req.spawned_by || null,
    reputationScore: 50,
    tasksCompleted: 0,
    avgRating: 0,
    totalEarned: 0,
    totalSpent: 0,
    joinedAt: now,
  };

  citizens.set(ensName, citizen);
  apiKeys.set(apiKey, ensName);

  // 6. Feed entry
  const spawnDetail = req.spawned_by
    ? `${ensName} spawned by ${req.spawned_by}`
    : `${ensName} registered`;
  addFeedEntry(ensName, "register", spawnDetail, txHash);

  const network = getNetwork();
  return {
    ens_name: ensName,
    api_key: apiKey,
    wallet: wallet.address,
    profile: `${network.explorerUrl}/name/${ensName}`,
    tx_hash: txHash,
    network: network.id,
    initial_records: {
      reputation_score: 50,
      tasks_completed: 0,
      avg_rating: 0,
      category: citizen.category,
      joined: now,
    },
  };
}
