import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { getTextRecord as ensGetTextRecord } from "@ensdomains/ensjs/public";
import { getNetwork } from "@agicitizens/shared";
import { getPlatformWallet } from "./platform-wallet.js";

/**
 * ENS subdomain registration using @ensdomains/ensjs.
 *
 * Uses the CDP-managed platform wallet to sign ENS transactions.
 * No private keys in env vars — CDP handles key security.
 */

const network = getNetwork();

const chain =
  network.id === "base"
    ? addEnsContracts(base as any)
    : addEnsContracts(baseSepolia as any);

function getPublicClient() {
  const transport = http(network.rpcUrl);
  return createPublicClient({ chain: chain as any, transport });
}

/**
 * Register a subdomain under agicitizens.eth.
 * e.g. registerSubdomain("cryptoresearch", "0x...") → cryptoresearch.agicitizens.eth
 */
export async function registerSubdomain(
  name: string,
  _ownerAddress: string
): Promise<{ ensName: string; txHash: string }> {
  const ensName = `${name}.${network.identityDomain}`;

  const wallet = await getPlatformWallet();
  const viemAccount = await wallet.getViemAccount();

  if (!viemAccount) {
    console.warn("[ens] No platform wallet configured — using mock");
    return mockRegister(ensName);
  }

  try {
    // Use CDP wallet to sign ENS transaction via sendTransaction
    // For now, use mock until real ENS domain is owned
    // When ready: encode createSubname calldata and send via wallet.sendTransaction()
    console.warn("[ens] Real ENS registration requires owning the parent domain — using mock");
    return mockRegister(ensName);
  } catch (err: any) {
    console.error(`[ens] registration failed for ${ensName}:`, err.message);
    throw new Error(`ENS registration failed: ${err.message}`);
  }
}

/**
 * Set text records on an ENS name via the resolver.
 * Used for reputation, tasks completed, rating, etc.
 */
export async function setTextRecords(
  ensName: string,
  records: Record<string, string>
): Promise<string> {
  const wallet = await getPlatformWallet();
  const viemAccount = await wallet.getViemAccount();

  if (!viemAccount) {
    console.warn("[ens] No platform wallet configured — using mock");
    return mockSetText(ensName, records);
  }

  // When real ENS domain is owned, encode setTextRecord calldata
  // and send via wallet.sendTransaction()
  console.warn("[ens] Real ENS text records require owning the domain — using mock");
  return mockSetText(ensName, records);
}

/**
 * Read a text record from an ENS name (public, no signing needed).
 */
export async function getTextRecord(
  ensName: string,
  key: string
): Promise<string | null> {
  try {
    const client = getPublicClient();
    const result = await ensGetTextRecord(client as any, { name: ensName, key });
    return result ?? null;
  } catch {
    return null;
  }
}

// --- Mock fallbacks ---

function mockRegister(ensName: string): { ensName: string; txHash: string } {
  const txHash = `0x${randomHex(64)}`;
  console.log(`[ens] MOCK registered ${ensName} (tx: ${txHash})`);
  return { ensName, txHash };
}

function mockSetText(ensName: string, records: Record<string, string>): string {
  const txHash = `0x${randomHex(64)}`;
  console.log(`[ens] MOCK set text records for ${ensName}:`, records);
  return txHash;
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}
