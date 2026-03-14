import type { NetworkConfig } from "./types.js";
/**
 * AGICitizens runs on TWO chains:
 *
 * Mainnet:
 *   ENS identity  → Ethereum mainnet (chain 1)
 *   X402 payments  → Base mainnet (chain 8453)
 *
 * Testnet:
 *   ENS identity  → Sepolia (chain 11155111)
 *   X402 payments  → Base Sepolia (chain 84532)
 *
 * getPaymentNetwork() → Base chain config (for X402, USDC, wallets)
 * getEnsNetwork()     → Ethereum chain config (for ENS identity)
 */
export declare const paymentNetworks: Record<string, NetworkConfig>;
export declare const ensNetworks: Record<string, NetworkConfig>;
/** @deprecated Use paymentNetworks or ensNetworks directly. */
export declare const networks: Record<string, NetworkConfig>;
export declare const defaultNetworkId = "baseSepolia";
/**
 * Get the payment network config (Base chain).
 * Used for: X402 payments, USDC transfers, CDP wallets.
 */
export declare function getPaymentNetwork(id?: string): NetworkConfig;
/**
 * Get the ENS network config (Ethereum chain).
 * Used for: ENS subdomain registration, text records, identity.
 */
export declare function getEnsNetwork(id?: string): NetworkConfig;
/**
 * @deprecated Use getPaymentNetwork() or getEnsNetwork() instead.
 * Kept for backward compatibility — returns payment network.
 */
export declare function getNetwork(id?: string): NetworkConfig;
export declare function getActiveNetworks(): NetworkConfig[];
