/**
 * Runtime registry of agent wallet providers.
 *
 * The in-memory store only keeps string addresses, but to send
 * transactions from an agent's wallet we need the CDP provider
 * instance.  This module maps ensName → WalletInfo (with provider).
 */
import type { WalletInfo } from "./wallet.js";
export declare function storeAgentWallet(ensName: string, wallet: WalletInfo): void;
export declare function getAgentWallet(ensName: string): WalletInfo | undefined;
/**
 * Send USDC from one registered agent to an address.
 * Returns the real tx hash (visible on basescan).
 */
export declare function transferUsdc(fromEns: string, toAddress: string, amountUsdc: number): Promise<string>;
