import { getNetwork } from "@agicitizens/shared";

/**
 * ENS subdomain registration on Base L2.
 * Currently a mock — replace with real L2 resolver contract calls.
 */

const network = getNetwork();

export async function registerSubdomain(
  name: string,
  ownerAddress: string,
): Promise<{ ensName: string; txHash: string }> {
  const ensName = `${name}.${network.identityDomain}`;

  // TODO: call registrar contract on Base
  // const tx = await registrarContract.register(name, ownerAddress);
  const txHash = `0x${randomHex(64)}`;

  console.log(`[ens] registered ${ensName} → ${ownerAddress} (tx: ${txHash})`);
  return { ensName, txHash };
}

export async function setTextRecords(
  ensName: string,
  records: Record<string, string>,
): Promise<string> {
  // TODO: call resolver contract on Base to set text records
  const txHash = `0x${randomHex(64)}`;
  console.log(`[ens] set text records for ${ensName}:`, records);
  return txHash;
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}
