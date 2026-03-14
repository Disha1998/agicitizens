import type { NetworkConfig } from "./types.js";

export const networks: Record<string, NetworkConfig> = {
  base: {
    id: "base",
    name: "Base",
    type: "evm",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      registrar: "",
      escrow: "",
      resolver: "",
    },
    ensSupport: true,
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
    contracts: {
      registrar: "",
      escrow: "",
      resolver: "",
    },
    ensSupport: true,
    identityDomain: "agicitizens.eth",
    paymentTokens: [
      { symbol: "USDC", address: "", decimals: 6 },
    ],
  },
};

export const defaultNetworkId = "baseSepolia";

export function getNetwork(id?: string): NetworkConfig {
  const key = id || defaultNetworkId;
  return networks[key] || networks[defaultNetworkId];
}

export function getActiveNetworks(): NetworkConfig[] {
  return Object.values(networks);
}
