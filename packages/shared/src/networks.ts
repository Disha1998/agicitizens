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

// --- Payment networks (Base) ---

export const paymentNetworks: Record<string, NetworkConfig> = {
  base: {
    id: "base",
    name: "Base",
    type: "evm",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {},
    ensSupport: false,
    identityDomain: "agicitizens.eth",
    paymentTokens: [
      {
        symbol: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
    ],
  },
  baseSepolia: {
    id: "baseSepolia",
    name: "Base Sepolia",
    type: "evm",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {},
    ensSupport: false,
    identityDomain: "agicitizens.eth",
    paymentTokens: [
      {
        symbol: "USDC",
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        decimals: 6,
      },
    ],
  },
};

// --- ENS networks (Ethereum) ---

export const ensNetworks: Record<string, NetworkConfig> = {
  mainnet: {
    id: "mainnet",
    name: "Ethereum",
    type: "evm",
    chainId: 1,
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {},
    ensSupport: true,
    identityDomain: "agicitizens.eth",
    paymentTokens: [],
  },
  sepolia: {
    id: "sepolia",
    name: "Sepolia",
    type: "evm",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {},
    ensSupport: true,
    identityDomain: "agicitizens.eth",
    paymentTokens: [],
  },
};

// --- Environment mapping ---

const ENV_TO_PAYMENT: Record<string, string> = {
  mainnet: "base",
  base: "base",
  testnet: "baseSepolia",
  baseSepolia: "baseSepolia",
  "base-sepolia": "baseSepolia",
};

const ENV_TO_ENS: Record<string, string> = {
  mainnet: "mainnet",
  base: "mainnet",
  testnet: "sepolia",
  baseSepolia: "sepolia",
  "base-sepolia": "sepolia",
};

export const defaultNetworkId = "baseSepolia";

/**
 * Get the payment network config (Base chain).
 * Used for: X402 payments, USDC transfers, CDP wallets.
 */
export function getPaymentNetwork(id?: string): NetworkConfig {
  const env = id || process.env.NETWORK_ID || "base-sepolia";
  const key = ENV_TO_PAYMENT[env] || "baseSepolia";
  return paymentNetworks[key];
}

/**
 * Get the ENS network config (Ethereum chain).
 * Used for: ENS subdomain registration, text records, identity.
 */
export function getEnsNetwork(id?: string): NetworkConfig {
  const env = id || process.env.NETWORK_ID || "base-sepolia";
  const key = ENV_TO_ENS[env] || "sepolia";
  return ensNetworks[key];
}

/**
 * @deprecated Use getPaymentNetwork() or getEnsNetwork() instead.
 * Kept for backward compatibility — returns payment network.
 */
export function getNetwork(id?: string): NetworkConfig {
  return getPaymentNetwork(id);
}

export function getActiveNetworks(): NetworkConfig[] {
  return [...Object.values(paymentNetworks), ...Object.values(ensNetworks)];
}
