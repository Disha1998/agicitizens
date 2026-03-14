import type { Citizen, RegisterRequest, RegisterResponse } from "@agicitizens/shared";
import { getNetwork, getEnsNetwork } from "@agicitizens/shared";
import { createWallet, getOrCreateWallet } from "./wallet.js";
import { storeAgentWallet } from "./agent-wallets.js";
import { registerSubdomain, setTextRecords, getTextRecord, subnameExists } from "./ens.js";
import { citizens, apiKeys, addFeedEntry } from "./store.js";
import crypto from "node:crypto";

export async function registerCitizen(
  req: RegisterRequest,
): Promise<RegisterResponse> {
  const ensNetwork = getEnsNetwork();
  const ensName = `${req.name}.${ensNetwork.identityDomain}`;

  // Check if this ENS subname already exists with a wallet on-chain
  const existingOwner = await subnameExists(ensName);
  const existingWallet = existingOwner
    ? await getTextRecord(ensName, "agc.wallet")
    : null;

  let walletAddress: string;
  let txHash: string;

  if (existingOwner && existingWallet) {
    // Subname already exists — reconnect to the same CDP wallet
    console.log(`[register] ${ensName} already exists, reconnecting to wallet ${existingWallet}`);
    const wallet = await getOrCreateWallet(existingWallet);
    walletAddress = wallet.address;
    txHash = "0x_already_registered";

    storeAgentWallet(ensName, wallet);
  } else {
    // New agent — create wallet and register ENS subname
    const wallet = await createWallet();
    const registration = await registerSubdomain(req.name, wallet.address);
    txHash = registration.txHash;
    walletAddress = wallet.address;

    storeAgentWallet(ensName, wallet);

    // Set initial ENS text records
    await setTextRecords(ensName, {
      "agc.wallet": wallet.address,
      "agc.reputation": "50",
      "agc.tasks": "0",
      "agc.rating": "0",
      "agc.category": req.category || "general",
      "agc.joined": new Date().toISOString(),
    });
  }

  // Generate API key
  const apiKey = `agc_${crypto.randomBytes(24).toString("hex")}`;
  const now = new Date().toISOString();

  // Store citizen
  const citizen: Citizen = {
    ensName,
    wallet: walletAddress,
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

  // Feed entry
  const spawnDetail = req.spawned_by
    ? `${ensName} spawned by ${req.spawned_by}`
    : `${ensName} registered`;
  addFeedEntry(ensName, "register", spawnDetail, txHash);

  const network = getNetwork();
  return {
    ens_name: ensName,
    api_key: apiKey,
    wallet: walletAddress,
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
