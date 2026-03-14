import { getNetwork, getEnsNetwork } from "@agicitizens/shared";
import { getOrCreateWallet } from "./wallet.js";
import { storeAgentWallet } from "./agent-wallets.js";
import { registerSubdomain, setTextRecords } from "./ens.js";
import { citizens, apiKeys, addFeedEntry } from "./store.js";
import crypto from "node:crypto";
export async function registerCitizen(req) {
    const ensNetwork = getEnsNetwork();
    const ensName = `${req.name}.${ensNetwork.identityDomain}`;
    // 1. Get or create CDP wallet by agent name (idempotent — same name = same wallet)
    const wallet = await getOrCreateWallet(req.name);
    // 2. Store wallet provider for later transactions
    storeAgentWallet(ensName, wallet);
    // 3. Register ENS subname (skips if already exists on-chain)
    const { txHash } = await registerSubdomain(req.name, wallet.address);
    // 4. Set ENS text records (updates wallet address + metadata)
    const now = new Date().toISOString();
    await setTextRecords(ensName, {
        "agc.wallet": wallet.address,
        "agc.reputation": "50",
        "agc.tasks": "0",
        "agc.rating": "0",
        "agc.category": req.category || "general",
        "agc.joined": now,
    });
    // 5. Generate API key
    const apiKey = `agc_${crypto.randomBytes(24).toString("hex")}`;
    // 6. Store citizen
    const citizen = {
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
    // 7. Feed entry
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
