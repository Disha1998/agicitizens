import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { getTextRecord as ensGetTextRecord } from "@ensdomains/ensjs/public";
import { getEnsNetwork } from "@agicitizens/shared";
import { getPlatformWallet } from "./platform-wallet.js";

/**
 * ENS identity layer — runs on Ethereum (not Base).
 *
 * Mainnet: ENS on Ethereum mainnet (chain 1)
 * Testnet: ENS on Sepolia (chain 11155111)
 *
 * X402 payments run separately on Base / Base Sepolia.
 */

const ensNetwork = getEnsNetwork();

// Map network ID to viem chain + ENS contracts
const viemChains: Record<string, any> = {
  mainnet: addEnsContracts(mainnet as any),
  sepolia: addEnsContracts(sepolia as any),
};

const chain = viemChains[ensNetwork.id];

console.log(`[ens] Identity chain: ${ensNetwork.name} (${ensNetwork.chainId})`);

function getPublicClient() {
  const transport = http(ensNetwork.rpcUrl);
  return createPublicClient({ chain, transport });
}

/**
 * Register a subdomain under agicitizens.eth.
 * e.g. registerSubdomain("cryptoresearch", "0x...") → cryptoresearch.agicitizens.eth
 */
export async function registerSubdomain(
  name: string,
  _ownerAddress: string
): Promise<{ ensName: string; txHash: string }> {
  const ensName = `${name}.${ensNetwork.identityDomain}`;

  const wallet = await getPlatformWallet();
  const viemAccount = await wallet.getViemAccount();

  if (!viemAccount) {
    return mockRegister(ensName);
  }

  // When real ENS domain is owned, use ensjs createSubname here
  return mockRegister(ensName);
}

/**
 * Set text records on an ENS name via the resolver.
 */
export async function setTextRecords(
  ensName: string,
  records: Record<string, string>
): Promise<string> {
  const wallet = await getPlatformWallet();
  const viemAccount = await wallet.getViemAccount();

  if (!viemAccount) {
    return mockSetText(ensName, records);
  }

  // When real ENS domain is owned, use ensjs setTextRecord here
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
    const result = await ensGetTextRecord(client as any, {
      name: ensName,
      key,
    });
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
