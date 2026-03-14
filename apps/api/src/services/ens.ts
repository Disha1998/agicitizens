import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
  type Address,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { addEnsContracts } from "@ensdomains/ensjs";
import { createSubname } from "@ensdomains/ensjs/wallet";
import { setTextRecord } from "@ensdomains/ensjs/wallet";
import { getTextRecord as ensGetTextRecord } from "@ensdomains/ensjs/public";
import { privateKeyToAccount } from "viem/accounts";
import { getNetwork } from "@agicitizens/shared";

/**
 * ENS subdomain registration using @ensdomains/ensjs.
 *
 * To register `cryptoresearch.agicitizens.eth`:
 * 1. We own `agicitizens.eth` (parent domain)
 * 2. Use ensjs `createSubname` to register the subdomain
 * 3. Use ensjs `setTextRecord` for reputation data
 *
 * Requires:
 * - ENS_OWNER_PRIVATE_KEY: private key of the agicitizens.eth owner
 * - ENS_RESOLVER_ADDRESS: public resolver contract address
 */

const network = getNetwork();

// addEnsContracts augments the viem chain with ENS contract addresses.
// We use `as any` to bridge viem version mismatches between ensjs and our local viem.
const chain =
  network.id === "base"
    ? addEnsContracts(base as any)
    : addEnsContracts(baseSepolia as any);

function getWalletClient() {
  const privateKey = process.env.ENS_OWNER_PRIVATE_KEY as Hex | undefined;
  if (!privateKey) {
    throw new Error("ENS_OWNER_PRIVATE_KEY is required");
  }

  const account = privateKeyToAccount(privateKey);
  const transport = http(network.rpcUrl);

  return createWalletClient({ account, chain: chain as any, transport });
}

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
  ownerAddress: string
): Promise<{ ensName: string; txHash: string }> {
  const ensName = `${name}.${network.identityDomain}`;

  if (!process.env.ENS_OWNER_PRIVATE_KEY) {
    console.warn("[ens] ENS_OWNER_PRIVATE_KEY not set — using mock");
    return mockRegister(ensName);
  }

  try {
    const wallet = getWalletClient();

    const hash = await createSubname(wallet as any, {
      name: ensName,
      owner: ownerAddress as Address,
      contract: "registry",
    } as any);

    console.log(`[ens] registered ${ensName} → ${ownerAddress} (tx: ${hash})`);
    return { ensName, txHash: hash };
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
  if (!process.env.ENS_OWNER_PRIVATE_KEY) {
    console.warn("[ens] ENS_OWNER_PRIVATE_KEY not set — using mock");
    return mockSetText(ensName, records);
  }

  const resolverAddress = process.env.ENS_RESOLVER_ADDRESS as
    | Address
    | undefined;
  if (!resolverAddress) {
    throw new Error("ENS_RESOLVER_ADDRESS is required for text records");
  }

  try {
    const wallet = getWalletClient();
    let lastTxHash = "";

    for (const [key, value] of Object.entries(records)) {
      const hash = await setTextRecord(wallet as any, {
        name: ensName,
        key,
        value,
        resolverAddress,
        account: wallet.account as any,
      });

      lastTxHash = hash;
      console.log(`[ens] set ${ensName} text: ${key} = ${value}`);
    }

    return lastTxHash;
  } catch (err: any) {
    console.error(`[ens] setTextRecords failed for ${ensName}:`, err.message);
    throw new Error(`ENS text record update failed: ${err.message}`);
  }
}

/**
 * Read a text record from an ENS name.
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

// --- Mock fallbacks (when ENS keys not configured) ---

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
