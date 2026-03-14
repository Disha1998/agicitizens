/**
 * Runtime registry of agent wallet providers.
 *
 * The in-memory store only keeps string addresses, but to send
 * transactions from an agent's wallet we need the CDP provider
 * instance.  This module maps ensName → WalletInfo (with provider).
 */

import { encodeFunctionData } from "viem";
import type { WalletInfo } from "./wallet.js";
import { getPaymentNetwork } from "@agicitizens/shared";

const paymentNet = getPaymentNetwork();
const USDC_ADDRESS = paymentNet.paymentTokens[0]?.address as `0x${string}`;

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function" as const,
    inputs: [
      { name: "to", type: "address" as const },
      { name: "amount", type: "uint256" as const },
    ],
    outputs: [{ name: "", type: "bool" as const }],
    stateMutability: "nonpayable" as const,
  },
] as const;

// ---- Registry ----

const agentWallets = new Map<string, WalletInfo>();

export function storeAgentWallet(ensName: string, wallet: WalletInfo): void {
  agentWallets.set(ensName, wallet);
}

export function getAgentWallet(ensName: string): WalletInfo | undefined {
  return agentWallets.get(ensName);
}

// ---- USDC Transfer ----

/**
 * Send USDC from one registered agent to an address.
 * Returns the real tx hash (visible on basescan).
 */
export async function transferUsdc(
  fromEns: string,
  toAddress: string,
  amountUsdc: number,
): Promise<string> {
  const sender = agentWallets.get(fromEns);
  if (!sender) throw new Error(`No wallet provider for ${fromEns}`);
  if (!sender.provider) throw new Error(`${fromEns} has a mock wallet — cannot send real tx`);

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [toAddress as `0x${string}`, BigInt(Math.round(amountUsdc * 1_000_000))],
  });

  const txHash = await sender.provider.sendTransaction({
    to: USDC_ADDRESS,
    data,
  });

  console.log(`[agent-wallets] ${fromEns} → ${toAddress}: ${amountUsdc} USDC  tx=${txHash}`);
  return txHash;
}
