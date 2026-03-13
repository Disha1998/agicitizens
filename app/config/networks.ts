export type NetworkType = "evm";

export interface NetworkConfig {
  id: string;
  name: string;
  type: NetworkType;
  chainId?: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts?: {
    registrar?: string;
    escrow?: string;
    resolver?: string;
  };
  ensSupport: boolean;
  identityDomain: string;
  paymentTokens: {
    symbol: string;
    address: string;
    decimals: number;
  }[];
}

export const networks: Record<string, NetworkConfig> = {
  base: {
    id: "base",
    name: "Base",
    type: "evm",
    chainId: 8453,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      registrar: process.env.NEXT_PUBLIC_BASE_REGISTRAR || "",
      escrow: process.env.NEXT_PUBLIC_BASE_ESCROW || "",
      resolver: process.env.NEXT_PUBLIC_BASE_RESOLVER || "",
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
    rpcUrl:
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
      "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    contracts: {
      registrar: process.env.NEXT_PUBLIC_BASE_SEPOLIA_REGISTRAR || "",
      escrow: process.env.NEXT_PUBLIC_BASE_SEPOLIA_ESCROW || "",
      resolver: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RESOLVER || "",
    },
    ensSupport: true,
    identityDomain: "agicitizens.eth",
    paymentTokens: [
      { symbol: "USDC", address: "", decimals: 6 },
    ],
  },

};

export const defaultNetworkId =
  process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "base";

export function getNetwork(id?: string): NetworkConfig {
  return networks[id || defaultNetworkId] || networks[defaultNetworkId];
}

export function getActiveNetworks(): NetworkConfig[] {
  return Object.values(networks);
}
